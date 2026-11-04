import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  advance,
  app,
  createTestAdmin,
  getStock,
  placeTestOrder,
  prisma,
  resetDatabase,
  seedFixtures,
  signIn,
  TEST_PASSWORD,
  type Fixtures,
} from './helpers.js';

const CHANGE_PASSWORD = '/api/v1/admin/auth/change-password';
const STAFF = '/api/v1/admin/staff';
const ME = '/api/v1/admin/auth/me';

const SUPER = 'super@example.test';
const PLAIN = 'plain@example.test';
const NEW_PASSWORD = 'a-brand-new-passphrase-9';

beforeEach(async () => {
  await resetDatabase();
  await createTestAdmin({ email: SUPER, name: 'Owner', role: 'SUPER_ADMIN' });
  await createTestAdmin({ email: PLAIN, name: 'Helper', role: 'ADMIN' });
});

describe('POST /api/v1/admin/auth/change-password', () => {
  it('changes the password, keeps this browser signed in and signs the others out', async () => {
    const here = await signIn(PLAIN);
    const elsewhere = await signIn(PLAIN);

    const response = await here
      .post(CHANGE_PASSWORD)
      .send({ currentPassword: TEST_PASSWORD, newPassword: NEW_PASSWORD });
    expect(response.status).toBe(200);

    expect((await here.get(ME)).status).toBe(200);
    expect((await elsewhere.get(ME)).status).toBe(401);

    const oldLogin = await request(app).post('/api/v1/admin/auth/login').send({ email: PLAIN, password: TEST_PASSWORD });
    const newLogin = await request(app).post('/api/v1/admin/auth/login').send({ email: PLAIN, password: NEW_PASSWORD });
    expect(oldLogin.status).toBe(401);
    expect(newLogin.status).toBe(200);
  });

  it('refuses a wrong current password, a weak new one and an unchanged one', async () => {
    const agent = await signIn(PLAIN);

    const wrong = await agent.post(CHANGE_PASSWORD).send({ currentPassword: 'nope-nope-nope', newPassword: NEW_PASSWORD });
    expect(wrong.status).toBe(422);
    expect(wrong.body.error.code).toBe('INVALID_CREDENTIALS');

    const weak = await agent.post(CHANGE_PASSWORD).send({ currentPassword: TEST_PASSWORD, newPassword: 'short' });
    expect(weak.status).toBe(400);

    const same = await agent.post(CHANGE_PASSWORD).send({ currentPassword: TEST_PASSWORD, newPassword: TEST_PASSWORD });
    expect(same.status).toBe(400);

    // Nothing changed: the old password still signs in.
    const login = await request(app).post('/api/v1/admin/auth/login').send({ email: PLAIN, password: TEST_PASSWORD });
    expect(login.status).toBe(200);
  });

  it('needs a signed-in admin', async () => {
    const response = await request(app)
      .post(CHANGE_PASSWORD)
      .send({ currentPassword: TEST_PASSWORD, newPassword: NEW_PASSWORD });
    expect(response.status).toBe(401);
  });
});

describe('staff management', () => {
  it('is closed to ordinary admins', async () => {
    const agent = await signIn(PLAIN);
    expect((await agent.get(STAFF)).status).toBe(403);
    expect((await agent.post(STAFF).send({ name: 'X', email: 'x@example.test', password: NEW_PASSWORD })).status).toBe(403);
  });

  it('lists staff without ever returning a password hash', async () => {
    const agent = await signIn(SUPER);
    const response = await agent.get(STAFF);
    expect(response.status).toBe(200);
    expect(response.body.data.items).toHaveLength(2);
    expect(JSON.stringify(response.body)).not.toMatch(/passwordHash|scrypt/);
  });

  it('creates an admin who can then sign in, and refuses duplicates and weak passwords', async () => {
    const agent = await signIn(SUPER);

    const created = await agent
      .post(STAFF)
      .send({ name: 'New Helper', email: 'New.Helper@Example.test', password: NEW_PASSWORD });
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({ email: 'new.helper@example.test', role: 'ADMIN', isActive: true });

    const login = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: 'new.helper@example.test', password: NEW_PASSWORD });
    expect(login.status).toBe(200);

    const duplicate = await agent
      .post(STAFF)
      .send({ name: 'Again', email: 'new.helper@example.test', password: NEW_PASSWORD });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('ADMIN_EXISTS');

    const weak = await agent.post(STAFF).send({ name: 'Weak', email: 'weak@example.test', password: 'short' });
    expect(weak.status).toBe(400);
  });

  it('deactivating an admin signs them out at once and blocks sign-in', async () => {
    const owner = await signIn(SUPER);
    const helper = await signIn(PLAIN);
    const helperRow = await prisma.adminUser.findUniqueOrThrow({ where: { email: PLAIN } });

    const response = await owner.patch(`${STAFF}/${helperRow.id}`).send({ isActive: false });
    expect(response.status).toBe(200);
    expect(response.body.data.isActive).toBe(false);

    expect((await helper.get(ME)).status).toBe(401);
    expect(await prisma.adminSession.count({ where: { adminUserId: helperRow.id } })).toBe(0);
    const login = await request(app).post('/api/v1/admin/auth/login').send({ email: PLAIN, password: TEST_PASSWORD });
    expect(login.status).toBe(401);
  });

  it('cannot change or deactivate its own account', async () => {
    const owner = await signIn(SUPER);
    const self = await prisma.adminUser.findUniqueOrThrow({ where: { email: SUPER } });

    const deactivate = await owner.patch(`${STAFF}/${self.id}`).send({ isActive: false });
    expect(deactivate.status).toBe(409);
    const demote = await owner.patch(`${STAFF}/${self.id}`).send({ role: 'ADMIN' });
    expect(demote.status).toBe(409);
    expect((await owner.get(ME)).status).toBe(200);

    // A rename is harmless and allowed.
    const rename = await owner.patch(`${STAFF}/${self.id}`).send({ name: 'Shop Owner' });
    expect(rename.status).toBe(200);
  });

  it('resets another admin password and signs that admin out everywhere', async () => {
    const owner = await signIn(SUPER);
    const helper = await signIn(PLAIN);
    const helperRow = await prisma.adminUser.findUniqueOrThrow({ where: { email: PLAIN } });

    const weak = await owner.post(`${STAFF}/${helperRow.id}/reset-password`).send({ newPassword: 'short' });
    expect(weak.status).toBe(400);

    const response = await owner.post(`${STAFF}/${helperRow.id}/reset-password`).send({ newPassword: NEW_PASSWORD });
    expect(response.status).toBe(200);

    expect((await helper.get(ME)).status).toBe(401);
    const login = await request(app).post('/api/v1/admin/auth/login').send({ email: PLAIN, password: NEW_PASSWORD });
    expect(login.status).toBe(200);

    const self = await prisma.adminUser.findUniqueOrThrow({ where: { email: SUPER } });
    const own = await owner.post(`${STAFF}/${self.id}/reset-password`).send({ newPassword: NEW_PASSWORD });
    expect(own.status).toBe(409);
  });

  it('answers 404 for an unknown account', async () => {
    const owner = await signIn(SUPER);
    expect((await owner.patch(`${STAFF}/does-not-exist`).send({ name: 'Ghost' })).status).toBe(404);
    expect((await owner.post(`${STAFF}/does-not-exist/reset-password`).send({ newPassword: NEW_PASSWORD })).status).toBe(404);
  });
});

describe('POST /api/v1/admin/orders/:id/reopen-delivery', () => {
  let fixtures: Fixtures;
  const PATH = (id: string) => `/api/v1/admin/orders/${id}/reopen-delivery`;
  const REASON = 'Marked delivered by mistake';

  beforeEach(async () => {
    fixtures = await seedFixtures();
  });

  async function deliveredOrder() {
    const owner = await signIn(SUPER);
    const order = await placeTestOrder(fixtures, [{ productId: fixtures.products.notebook.id, quantity: 2 }]);
    await advance(owner, order.id, ['CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED']);
    return { owner, order };
  }

  it('is closed to ordinary admins', async () => {
    const { order } = await deliveredOrder();
    const helper = await signIn(PLAIN);
    expect((await helper.post(PATH(order.id)).send({ reason: REASON })).status).toBe(403);
  });

  it('puts the order back out for delivery and restores the stock sale', async () => {
    const { owner, order } = await deliveredOrder();
    expect(await getStock(fixtures.products.notebook.id)).toEqual({ stockQuantity: 8, reservedQuantity: 0 });

    const response = await owner.post(PATH(order.id)).send({ reason: REASON });
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ orderStatus: 'OUT_FOR_DELIVERY', deliveredAt: null });
    expect(response.body.data.statusHistory.at(-1)).toMatchObject({
      status: 'OUT_FOR_DELIVERY',
      note: `Correction: ${REASON}`,
    });

    expect(await getStock(fixtures.products.notebook.id)).toEqual({ stockQuantity: 10, reservedQuantity: 2 });
    const movements = await prisma.inventoryTransaction.findMany({
      where: { orderId: order.id, note: { contains: REASON } },
    });
    expect(movements.map((movement) => `${movement.type}:${movement.quantity}`).sort()).toEqual([
      'ADJUSTMENT:2',
      'RESERVE:2',
    ]);

    // It can now be delivered properly, and the sale is booked once more.
    await advance(owner, order.id, ['DELIVERED']);
    expect(await getStock(fixtures.products.notebook.id)).toEqual({ stockQuantity: 8, reservedQuantity: 0 });
  });

  it('requires a real reason', async () => {
    const { owner, order } = await deliveredOrder();
    expect((await owner.post(PATH(order.id)).send({})).status).toBe(400);
    expect((await owner.post(PATH(order.id)).send({ reason: 'no' })).status).toBe(400);
    expect(await getStock(fixtures.products.notebook.id)).toEqual({ stockQuantity: 8, reservedQuantity: 0 });
  });

  it('refuses once cash is collected, and leaves everything unchanged', async () => {
    const { owner, order } = await deliveredOrder();
    expect((await owner.patch(`/api/v1/admin/orders/${order.id}/payment`).send({ paymentStatus: 'COLLECTED' })).status).toBe(200);

    const response = await owner.post(PATH(order.id)).send({ reason: REASON });
    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('ORDER_CORRECTION_NOT_ALLOWED');
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).orderStatus).toBe('DELIVERED');
    expect(await getStock(fixtures.products.notebook.id)).toEqual({ stockQuantity: 8, reservedQuantity: 0 });
  });

  it('refuses an order that is not delivered', async () => {
    const owner = await signIn(SUPER);
    const order = await placeTestOrder(fixtures, [{ productId: fixtures.products.notebook.id, quantity: 1 }]);

    const response = await owner.post(PATH(order.id)).send({ reason: REASON });
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('INVALID_ORDER_TRANSITION');
    expect((await owner.post(PATH('does-not-exist')).send({ reason: REASON })).status).toBe(404);
  });
});
