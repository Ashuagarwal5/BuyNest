import { Router } from 'express';
import { z } from 'zod';

import { normalizeEmail } from '../../../lib/email.js';
import { AppError, notFound } from '../../../lib/errors.js';
import { sendSuccess } from '../../../lib/http.js';
import { idParamsSchema } from '../../../lib/params.js';
import { prisma } from '../../../lib/prisma.js';
import { isUniqueViolation } from '../../../lib/prisma-errors.js';
import { getAdmin, requireRole } from '../../../middleware/admin-auth.js';
import { hashPassword, validateNewPassword } from '../auth/password.js';
import { revokeAllSessions } from '../auth/session.js';

/**
 * Staff accounts. Super admins only: they create logins, switch them on and off, and set a
 * new password for someone who forgot theirs. Accounts are deactivated, never deleted, so the
 * names on order and stock history stay meaningful. The password hash is never returned.
 */
export const adminStaffRouter = Router();
adminStaffRouter.use(requireRole('SUPER_ADMIN'));
adminStaffRouter.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

const staffSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
} as const;

const roleSchema = z.enum(['SUPER_ADMIN', 'ADMIN']);
const nameSchema = z.string().trim().min(1).max(100);
const passwordSchema = z.string().min(1).max(200);

const createBodySchema = z.strictObject({
  name: nameSchema,
  email: z.string().trim().min(3).max(254).pipe(z.email()),
  password: passwordSchema,
  role: roleSchema.default('ADMIN'),
});

const updateBodySchema = z
  .strictObject({
    name: nameSchema.optional(),
    role: roleSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), 'Nothing to change.');

const resetPasswordBodySchema = z.strictObject({ newPassword: passwordSchema });

function assertStrongPassword(password: string): void {
  const problem = validateNewPassword(password);
  if (problem) {
    throw new AppError(400, 'VALIDATION_ERROR', problem);
  }
}

adminStaffRouter.get('/', async (_req, res) => {
  const staff = await prisma.adminUser.findMany({
    select: staffSelect,
    orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
  });
  sendSuccess(res, { items: staff });
});

adminStaffRouter.post('/', async (req, res) => {
  const body = createBodySchema.parse(req.body);
  assertStrongPassword(body.password);
  const email = normalizeEmail(body.email);
  const actor = getAdmin(res);

  const duplicate = () => new AppError(409, 'ADMIN_EXISTS', 'A staff account with this email already exists.');
  if (await prisma.adminUser.findUnique({ where: { email }, select: { id: true } })) {
    throw duplicate();
  }

  let created;
  try {
    created = await prisma.adminUser.create({
      data: { name: body.name, email, role: body.role, passwordHash: await hashPassword(body.password) },
      select: staffSelect,
    });
  } catch (error) {
    throw isUniqueViolation(error, 'email') ? duplicate() : error;
  }

  console.log(`[staff] ${actor.email} created ${created.role} account ${created.email}`);
  sendSuccess(res, created, 201);
});

adminStaffRouter.patch('/:id', async (req, res) => {
  const { id } = idParamsSchema.parse(req.params);
  const body = updateBodySchema.parse(req.body);
  const actor = getAdmin(res);

  // Changing your own role or active flag could lock the shop out of its own admin panel.
  if (id === actor.id && (body.role !== undefined || body.isActive !== undefined)) {
    throw new AppError(
      409,
      'ADMIN_SELF_CHANGE',
      'You cannot change your own role or deactivate your own account. Ask another super admin.'
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const { count } = await tx.adminUser.updateMany({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.role !== undefined ? { role: body.role } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      },
    });
    if (count === 0) {
      throw notFound('ADMIN_NOT_FOUND', 'This staff account does not exist.');
    }
    // Never leave the shop without an active super admin (two admins changing each other at once).
    if (await tx.adminUser.count({ where: { role: 'SUPER_ADMIN', isActive: true } }) === 0) {
      throw new AppError(409, 'ADMIN_SELF_CHANGE', 'There must always be at least one active super admin.');
    }
    return tx.adminUser.findUniqueOrThrow({ where: { id }, select: staffSelect });
  });

  if (body.isActive === false) {
    await revokeAllSessions(id);
  }

  console.log(`[staff] ${actor.email} updated ${updated.email}: ${Object.keys(body).join(', ')}`);
  sendSuccess(res, updated);
});

adminStaffRouter.post('/:id/reset-password', async (req, res) => {
  const { id } = idParamsSchema.parse(req.params);
  const { newPassword } = resetPasswordBodySchema.parse(req.body);
  const actor = getAdmin(res);

  if (id === actor.id) {
    throw new AppError(409, 'ADMIN_SELF_CHANGE', 'Use "Change password" on your profile for your own account.');
  }
  assertStrongPassword(newPassword);

  const { count } = await prisma.adminUser.updateMany({
    where: { id },
    data: { passwordHash: await hashPassword(newPassword) },
  });
  if (count === 0) {
    throw notFound('ADMIN_NOT_FOUND', 'This staff account does not exist.');
  }
  // Whoever held the old password (or a session made with it) is signed out at once.
  await revokeAllSessions(id);

  console.log(`[staff] ${actor.email} reset a password (${id})`);
  sendSuccess(res, { reset: true });
});
