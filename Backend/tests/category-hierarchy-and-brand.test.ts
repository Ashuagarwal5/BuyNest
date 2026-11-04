import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  type AdminAgent,
  app,
  createTestAdmin,
  type Fixtures,
  resetDatabase,
  seedFixtures,
  signIn,
} from './helpers.js';

let fixtures: Fixtures;
let admin: AdminAgent;

const CATEGORIES = '/api/v1/admin/categories';
const PRODUCTS = '/api/v1/admin/products';

beforeEach(async () => {
  await resetDatabase();
  fixtures = await seedFixtures();
  await createTestAdmin();
  admin = await signIn();
});

async function createChild(name: string, parentId: string, extra: Record<string, unknown> = {}) {
  return admin.post(CATEGORIES).send({ name, parentId, ...extra });
}

const newProduct = (categoryId: string, overrides: Record<string, unknown> = {}) => ({
  name: 'Soft Bear',
  description: 'A soft toy.',
  categoryId,
  sku: 'SB-1',
  mrpPaise: 30000,
  sellingPricePaise: 25000,
  stockQuantity: 5,
  ...overrides,
});

describe('nested categories', () => {
  it('creates a subcategory and reports its parent and the parent’s child count', async () => {
    const toys = fixtures.categories.toys;
    const child = await createChild('Soft Toys', toys.id);
    expect(child.status).toBe(201);
    expect(child.body.data).toMatchObject({ parentId: toys.id, parentName: 'Toys', childCount: 0 });

    const list = await admin.get(CATEGORIES);
    const parent = list.body.data.find((c: { id: string }) => c.id === toys.id);
    expect(parent).toMatchObject({ parentId: null, childCount: 1 });
  });

  it('refuses a third level, a self-parent, and parenting a category that has children', async () => {
    const toys = fixtures.categories.toys;
    const soft = (await createChild('Soft Toys', toys.id)).body.data;

    const tooDeep = await createChild('Plush', soft.id);
    expect(tooDeep.status).toBe(409);
    expect(tooDeep.body.error.code).toBe('CATEGORY_TOO_DEEP');

    const self = await admin.patch(`${CATEGORIES}/${toys.id}`).send({ parentId: toys.id });
    expect(self.status).toBe(400);
    expect(self.body.error.code).toBe('INVALID_PARENT');

    const hasChildren = await admin
      .patch(`${CATEGORIES}/${toys.id}`)
      .send({ parentId: fixtures.categories.stationery.id });
    expect(hasChildren.status).toBe(409);
    expect(hasChildren.body.error.code).toBe('CATEGORY_HAS_CHILDREN');
  });

  it('deactivating a parent hides its subcategories, and a child cannot be activated under it', async () => {
    const toys = fixtures.categories.toys;
    const soft = (await createChild('Soft Toys', toys.id)).body.data;

    await admin.patch(`${CATEGORIES}/${toys.id}`).send({ isActive: false }).expect(200);
    const child = (await admin.get(CATEGORIES)).body.data.find((c: { id: string }) => c.id === soft.id);
    expect(child.isActive).toBe(false);

    const blocked = await admin.patch(`${CATEGORIES}/${soft.id}`).send({ isActive: true });
    expect(blocked.status).toBe(409);
    expect(blocked.body.error.code).toBe('PARENT_INACTIVE');
  });

  it('lists a parent’s products together with its subcategories’ products in the shop', async () => {
    const toys = fixtures.categories.toys;
    const soft = (await createChild('Soft Toys', toys.id)).body.data;
    const created = await admin.post(PRODUCTS).send(newProduct(soft.id));
    expect(created.status).toBe(201);
    expect(created.body.data.category).toMatchObject({ slug: 'soft-toys', parent: { name: 'Toys' } });

    const parentListing = await request(app).get('/api/v1/products?category=toys&limit=50');
    const names = parentListing.body.data.items.map((p: { name: string }) => p.name);
    expect(names).toContain('Soft Bear');
    expect(names).toContain('Remote Car');

    const childListing = await request(app).get('/api/v1/products?category=soft-toys');
    expect(childListing.body.data.items.map((p: { name: string }) => p.name)).toEqual(['Soft Bear']);

    const categories = await request(app).get('/api/v1/categories');
    expect(categories.body.data.find((c: { slug: string }) => c.slug === 'soft-toys').parentId).toBe(toys.id);
  });
});

describe('product brand', () => {
  it('stores a brand, clears it with a blank value, and filters by it', async () => {
    const toys = fixtures.categories.toys.id;
    const created = await admin.post(PRODUCTS).send(newProduct(toys, { brand: '  Funskool ' }));
    expect(created.body.data.brand).toBe('Funskool');
    await admin.post(PRODUCTS).send(newProduct(toys, { name: 'No Brand Toy', sku: 'NB-1' })).expect(201);

    const byBrand = await admin.get(`${PRODUCTS}?brand=funskool`);
    expect(byBrand.body.data.items.map((p: { name: string }) => p.name)).toEqual(['Soft Bear']);

    const shop = await request(app).get('/api/v1/products?brand=FUNSKOOL');
    expect(shop.body.data.items.map((p: { name: string }) => p.name)).toEqual(['Soft Bear']);
    expect((await request(app).get('/api/v1/brands')).body.data).toEqual(['Funskool']);

    const cleared = await admin.patch(`${PRODUCTS}/${created.body.data.id}`).send({ brand: '' });
    expect(cleared.body.data.brand).toBeNull();
  });
});
