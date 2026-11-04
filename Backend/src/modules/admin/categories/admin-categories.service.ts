import type { Prisma } from '../../../generated/prisma/client.js';
import { AppError, conflict, notFound } from '../../../lib/errors.js';
import { isUniqueViolation } from '../../../lib/prisma-errors.js';
import { prisma } from '../../../lib/prisma.js';
import { slugify } from '../../../lib/slug.js';
import type { CreateCategoryBody, UpdateCategoryBody } from './admin-categories.schemas.js';

const categoryArgs = {
  include: {
    parent: { select: { name: true } },
    _count: { select: { products: true, children: true } },
  },
} satisfies Prisma.CategoryDefaultArgs;

type CategoryWithCount = Prisma.CategoryGetPayload<typeof categoryArgs>;

function toAdminCategory(category: CategoryWithCount) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    imageUrl: category.imageUrl,
    displayOrder: category.displayOrder,
    isActive: category.isActive,
    parentId: category.parentId,
    parentName: category.parent?.name ?? null,
    childCount: category._count.children,
    productCount: category._count.products,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

async function assertSlugFree(slug: string, exceptId?: string) {
  const taken = await prisma.category.findFirst({
    where: { slug, ...(exceptId ? { id: { not: exceptId } } : {}) },
    select: { id: true },
  });
  if (taken) {
    throw conflict('DUPLICATE_SLUG', `The slug "${slug}" is already used by another category.`);
  }
}

/**
 * A category may sit under a top-level category only (two levels: Toys > Soft Toys), and a
 * category that already has children cannot itself become a child.
 */
async function assertValidParent(parentId: string, selfId?: string) {
  if (selfId && parentId === selfId) {
    throw new AppError(400, 'INVALID_PARENT', 'A category cannot be its own parent.');
  }
  const parent = await prisma.category.findUnique({
    where: { id: parentId },
    select: { parentId: true, isActive: true },
  });
  if (!parent) {
    throw notFound('CATEGORY_NOT_FOUND', 'The parent category does not exist.');
  }
  if (parent.parentId !== null) {
    throw conflict('CATEGORY_TOO_DEEP', 'Categories can only be nested one level deep. Choose a top-level category as the parent.');
  }
  if (selfId && (await prisma.category.count({ where: { parentId: selfId } })) > 0) {
    throw conflict('CATEGORY_HAS_CHILDREN', 'This category has subcategories, so it cannot be placed under another category.');
  }
  return parent;
}

/** All categories, inactive ones included, in the order the shop shows them. */
export async function listCategories() {
  const categories = await prisma.category.findMany({
    ...categoryArgs,
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  });
  return categories.map(toAdminCategory);
}

export async function createCategory(body: CreateCategoryBody) {
  const slug = body.slug ?? slugify(body.name);
  if (slug === '') {
    throw new AppError(400, 'VALIDATION_ERROR', 'Give the category a slug: the name has no letters or digits to build one from.');
  }
  await assertSlugFree(slug);
  if (body.parentId) {
    const parent = await assertValidParent(body.parentId);
    if (body.isActive && !parent.isActive) {
      throw conflict('PARENT_INACTIVE', 'The parent category is inactive. Activate it first, or save this one as inactive.');
    }
  }

  try {
    const created = await prisma.category.create({
      data: {
        name: body.name,
        slug,
        description: body.description,
        imageUrl: body.imageUrl,
        displayOrder: body.displayOrder,
        isActive: body.isActive,
        parentId: body.parentId,
      },
      ...categoryArgs,
    });
    return toAdminCategory(created);
  } catch (error) {
    if (isUniqueViolation(error, 'slug')) {
      throw conflict('DUPLICATE_SLUG', 'That slug is already used by another category.');
    }
    throw error;
  }
}

/**
 * Categories are never deleted (products belong to them): set `isActive` to false to hide
 * one. The shop then stops listing it and its products, but nothing is lost.
 */
export async function updateCategory(id: string, body: UpdateCategoryBody) {
  const existing = await prisma.category.findUnique({
    where: { id },
    select: { slug: true, parentId: true, isActive: true },
  });
  if (!existing) {
    throw notFound('CATEGORY_NOT_FOUND', 'This category does not exist.');
  }
  if (body.slug !== undefined && body.slug !== existing.slug) {
    await assertSlugFree(body.slug, id);
  }

  const parentId = body.parentId === undefined ? existing.parentId : body.parentId;
  if (parentId !== null && (body.parentId !== undefined || body.isActive === true)) {
    const parent = await assertValidParent(parentId, id);
    if ((body.isActive ?? existing.isActive) && !parent.isActive) {
      throw conflict('PARENT_INACTIVE', 'The parent category is inactive. Activate it first.');
    }
  }

  try {
    // Hiding a category hides its subcategories too, so the shop never lists a child under a hidden parent.
    const updated = await prisma.$transaction(async (tx) => {
      if (body.isActive === false) {
        await tx.category.updateMany({ where: { parentId: id }, data: { isActive: false } });
      }
      return tx.category.update({ where: { id }, data: body, ...categoryArgs });
    });
    return toAdminCategory(updated);
  } catch (error) {
    if (isUniqueViolation(error, 'slug')) {
      throw conflict('DUPLICATE_SLUG', 'That slug is already used by another category.');
    }
    throw error;
  }
}
