import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  type AdminAgent,
  advance,
  app,
  createTestAdmin,
  type Fixtures,
  getStock,
  placeTestOrder,
  prisma,
  resetDatabase,
  seedFixtures,
  signIn,
} from './helpers.js';

let fixtures: Fixtures;
let admin: AdminAgent;

const PRODUCTS = '/api/v1/admin/products';

beforeEach(async () => {
  await resetDatabase();
  fixtures = await seedFixtures();
  await createTestAdmin();
  admin = await signIn();
});

const newProduct = (overrides: Record<string, unknown> = {}) => ({
  name: 'Wooden Blocks',
  description: 'Thirty-two natural wood blocks.',
  categoryId: fixtures.categories.toys.id,
  sku: 'WB-001',
  mrpPaise: 129900,
  sellingPricePaise: 89900,
  stockQuantity: 2,
  ...overrides,
});

describe('product cost, tax and size details', () => {
  it('stores them on create and returns them to admins only', async () => {
    const created = await admin.post(PRODUCTS).send(
      newProduct({
        procurementCostPaise: 42000,
        gstRatePercent: 12,
        hsnCode: '95030010',
        weightGrams: 420,
        lengthMm: 220,
        widthMm: 180,
        heightMm: 80,
      })
    );
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({
      procurementCostPaise: 42000,
      gstRatePercent: 12,
      hsnCode: '95030010',
      weightGrams: 420,
      lengthMm: 220,
      widthMm: 180,
      heightMm: 80,
      allowBackorder: false,
    });

    const publicView = await request(app).get(`/api/v1/products/${created.body.data.id}`);
    expect(publicView.status).toBe(200);
    expect(publicView.body.data).not.toHaveProperty('procurementCostPaise');
    expect(JSON.stringify(publicView.body)).not.toContain('42000');
  });

  it('defaults them to empty and lets an update clear them', async () => {
    const created = await admin.post(PRODUCTS).send(newProduct());
    expect(created.body.data).toMatchObject({ procurementCostPaise: null, gstRatePercent: null, hsnCode: null, weightGrams: null });

    const id = created.body.data.id;
    expect((await admin.patch(`${PRODUCTS}/${id}`).send({ gstRatePercent: 18, hsnCode: '4820' })).status).toBe(200);
    const cleared = await admin.patch(`${PRODUCTS}/${id}`).send({ gstRatePercent: null, hsnCode: '' });
    expect(cleared.status).toBe(200);
    expect(cleared.body.data).toMatchObject({ gstRatePercent: null, hsnCode: null });
  });

  it('rejects an unknown GST slab, a malformed HSN code and zero sizes', async () => {
    const response = await admin.post(PRODUCTS).send(newProduct({ gstRatePercent: 7, hsnCode: '12345', weightGrams: 0 }));
    expect(response.status).toBe(400);
    expect(response.body.error.details.map((d: { field: string }) => d.field)).toEqual(
      expect.arrayContaining(['gstRatePercent', 'hsnCode', 'weightGrams'])
    );
  });
});

describe('backorders', () => {
  it('keeps a strict product sold out at zero available', async () => {
    const created = await admin.post(PRODUCTS).send(newProduct({ stockQuantity: 1 }));
    const id = created.body.data.id;
    await placeTestOrder(fixtures, [{ productId: id, quantity: 1 }]);

    const publicView = await request(app).get(`/api/v1/products/${id}`);
    expect(publicView.body.data).toMatchObject({ inStock: false, availableQuantity: 0, isBackorder: false });
  });

  it('takes orders beyond stock and delivers them once stock is added', async () => {
    const created = await admin.post(PRODUCTS).send(newProduct({ stockQuantity: 1, allowBackorder: true }));
    const id = created.body.data.id;

    const order = await placeTestOrder(fixtures, [{ productId: id, quantity: 3 }]);
    expect(await getStock(id)).toEqual({ stockQuantity: 1, reservedQuantity: 3 });

    const publicView = await request(app).get(`/api/v1/products/${id}`);
    expect(publicView.body.data).toMatchObject({ inStock: true, isBackorder: true, readyQuantity: 0 });
    const inStockList = await request(app).get('/api/v1/products?inStock=true');
    expect(inStockList.body.data.items.map((item: { id: string }) => item.id)).toContain(id);

    const adminView = await admin.get(`${PRODUCTS}/${id}`);
    expect(adminView.body.data.availableQuantity).toBe(-2);

    // Not enough on hand yet: the order cannot be handed over.
    await advance(admin, order.id, ['CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY']);
    const early = await admin.patch(`/api/v1/admin/orders/${order.id}/status`).send({ status: 'DELIVERED' });
    expect(early.status).toBe(409);
    expect(early.body.error.code).toBe('STOCK_NOT_RECEIVED');

    const restock = await admin.post(`${PRODUCTS}/${id}/inventory-adjustment`).send({ quantityDelta: 2, note: 'Supplier delivery' });
    expect(restock.status).toBe(200);
    await advance(admin, order.id, ['DELIVERED']);
    expect(await getStock(id)).toEqual({ stockQuantity: 0, reservedQuantity: 0 });
  });

  it('tells customers how many units are ready while it still has stock', async () => {
    const created = await admin.post(PRODUCTS).send(newProduct({ stockQuantity: 2, allowBackorder: true }));
    const publicView = await request(app).get(`/api/v1/products/${created.body.data.id}`);
    expect(publicView.body.data).toMatchObject({ readyQuantity: 2, isBackorder: false, inStock: true });
    expect(publicView.body.data.availableQuantity).toBeGreaterThan(2);

    const strict = await admin.post(PRODUCTS).send(newProduct({ name: 'Stacking Cups', sku: 'WB-002', stockQuantity: 4 }));
    const strictView = await request(app).get(`/api/v1/products/${strict.body.data.id}`);
    expect(strictView.body.data).toMatchObject({ readyQuantity: 4, availableQuantity: 4, isBackorder: false });
  });

  it('refuses to turn backorders off while orders exceed stock', async () => {
    const created = await admin.post(PRODUCTS).send(newProduct({ stockQuantity: 0, allowBackorder: true }));
    const id = created.body.data.id;
    await placeTestOrder(fixtures, [{ productId: id, quantity: 2 }]);

    const response = await admin.patch(`${PRODUCTS}/${id}`).send({ allowBackorder: false });
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('BACKORDERS_OPEN');

    await admin.post(`${PRODUCTS}/${id}/inventory-adjustment`).send({ quantityDelta: 2, note: 'Restocked' });
    expect((await admin.patch(`${PRODUCTS}/${id}`).send({ allowBackorder: false })).status).toBe(200);
  });

  it('never lets stock on hand go below zero', async () => {
    const created = await admin.post(PRODUCTS).send(newProduct({ stockQuantity: 1, allowBackorder: true }));
    const response = await admin
      .post(`${PRODUCTS}/${created.body.data.id}/inventory-adjustment`)
      .send({ quantityDelta: -2, note: 'Damaged' });
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('ADJUSTMENT_BELOW_ZERO');
  });

  it('is not available for combos', async () => {
    const response = await admin.post(PRODUCTS).send(
      newProduct({
        kind: 'COMBO',
        sku: 'COMBO-1',
        stockQuantity: 0,
        allowBackorder: true,
        comboComponents: [
          { productId: fixtures.products.notebook.id, quantity: 1 },
          { productId: fixtures.products.pencil.id, quantity: 1 },
        ],
      })
    );
    expect(response.status).toBe(400);
    expect(response.body.error.details.map((d: { field: string }) => d.field)).toContain('allowBackorder');
  });

  it('is refused by the database for a combo, whatever path a write takes', async () => {
    const combo = await admin.post(PRODUCTS).send(
      newProduct({
        kind: 'COMBO',
        sku: 'COMBO-2',
        stockQuantity: 0,
        comboComponents: [
          { productId: fixtures.products.notebook.id, quantity: 1 },
          { productId: fixtures.products.pencil.id, quantity: 1 },
        ],
      })
    );
    expect(combo.status).toBe(201);
    await expect(
      prisma.product.update({ where: { id: combo.body.data.id }, data: { allowBackorder: true } })
    ).rejects.toThrow();
  });
});
