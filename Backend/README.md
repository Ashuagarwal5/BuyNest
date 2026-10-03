# BuyNest Backend

REST API for BuyNest: Express 5, TypeScript, Prisma 7 and PostgreSQL. It is the source of
truth for the catalogue, delivery areas, stock and orders, and will serve the customer app,
the admin dashboard and any later clients.

Money is always **integer paise** (₹149.50 = `14950`). Prices, totals, delivery charges and
stock are computed here from the database; values sent by a client are never trusted.

## Requirements

- Node.js 22 or newer
- A PostgreSQL database (any of the options below)

## Setup

```bash
npm install
```

```bash
copy .env.example .env
```

### Database: pick one

**A. Bundled dev database (no install needed).** Runs a real PostgreSQL from npm, with data
in `.pgdata/`. Keep it running in its own terminal:

```bash
npm run db:dev
```

The default `DATABASE_URL` in `.env.example` already points at it (`localhost:5433`).

**B. Your own PostgreSQL** (local install, Docker or hosted). Create an empty database and
set `DATABASE_URL` in `.env`:

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
```

With Docker, for example:

```bash
docker run --name buynest-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=buynest -p 5432:5432 -d postgres:17
```

### Create the tables and load development data

```bash
npm run prisma:deploy
```

```bash
npm run prisma:seed
```

The seed mirrors the mobile app's mock data: 5 categories, 15 products and 6 delivery areas.
**It is placeholder data** — the delivery areas, charges, prices and stock levels are made
up for development. It is safe to re-run and never resets stock.

## Environment variables

| Variable       | Required | Purpose                                                                      |
| -------------- | -------- | ---------------------------------------------------------------------------- |
| `DATABASE_URL` | yes      | PostgreSQL connection string                                                 |
| `PORT`         | no       | API port, default `4000`                                                     |
| `NODE_ENV`     | no       | `development` (default), `test` or `production`                              |
| `CORS_ORIGINS` | no       | Comma-separated browser origins. Empty allows all in development, none in production |

`.env` is ignored by Git. Never commit real credentials.

## Commands

| Command                   | What it does                                             |
| ------------------------- | -------------------------------------------------------- |
| `npm run dev`             | Start the API with reload                                |
| `npm run build`           | Compile to `dist/`                                       |
| `npm start`               | Run the compiled API                                     |
| `npm run typecheck`       | TypeScript check                                         |
| `npm run lint`            | ESLint                                                   |
| `npm test`                | Run the tests                                            |
| `npm run db:dev`          | Start the bundled dev PostgreSQL                         |
| `npm run prisma:generate` | Regenerate the Prisma client (also runs on `npm install`) |
| `npm run prisma:migrate`  | Create and apply a migration after a schema change       |
| `npm run prisma:deploy`   | Apply existing migrations                                |
| `npm run prisma:seed`     | Load development data                                    |
| `npm run db:reset-dev -- --yes` | DEV ONLY: delete all orders and customers, release reserved stock |

`db:reset-dev` keeps the catalogue and delivery areas. It refuses to run if `NODE_ENV` is
`production` or the database is not on this machine, and does nothing without `--yes`.

Tests start their own throwaway PostgreSQL and apply the real migrations to it, so they need
nothing running and never touch your development database.

## API

Base URL: `http://localhost:4000/api/v1`

| Method | Path                           | Notes                                                        |
| ------ | ------------------------------ | ------------------------------------------------------------ |
| GET    | `/health` (no prefix)          | API and database status                                      |
| GET    | `/categories`                  | Active categories, by display order                          |
| GET    | `/products`                    | `page`, `limit` (max 50), `category` (slug), `featured`, `new`, `search` |
| GET    | `/products/:identifier`        | By slug (preferred) or id                                    |
| GET    | `/delivery-areas`              | Active areas with charges                                    |
| POST   | `/orders`                      | Place an order                                               |
| GET    | `/orders/:orderNumber`         | Needs the `X-Tracking-Token` header                          |
| POST   | `/orders/:orderNumber/cancel`  | Needs the `X-Tracking-Token` header; only while `PLACED`     |

There are no public endpoints that create or change products, stock, order status or
payment. Those will be authenticated admin APIs.

### Responses

```json
{ "success": true, "data": {} }
```

```json
{ "success": false, "error": { "code": "OUT_OF_STOCK", "message": "...", "details": {} } }
```

| Status | Codes                                                                    |
| ------ | ------------------------------------------------------------------------ |
| 400    | `VALIDATION_ERROR`, `INVALID_JSON`                                       |
| 401    | `INVALID_TRACKING_TOKEN` (header missing)                                |
| 403    | `INVALID_TRACKING_TOKEN` (wrong token)                                   |
| 404    | `PRODUCT_NOT_FOUND`, `DELIVERY_AREA_NOT_FOUND`, `ORDER_NOT_FOUND`, `ROUTE_NOT_FOUND` |
| 409    | `OUT_OF_STOCK`, `PRODUCT_UNAVAILABLE`, `DELIVERY_AREA_UNAVAILABLE`, `ORDER_CANNOT_BE_CANCELLED`, `IDEMPOTENCY_CONFLICT` |
| 422    | `MINIMUM_ORDER_NOT_MET`                                                  |
| 500    | `INTERNAL_ERROR`                                                         |

### Placing an order

```json
{
  "clientRequestId": "0b9e0c1e-6f0e-4b53-9f0e-1c2d3e4f5a6b",
  "customer": { "fullName": "Ravi Kumar", "mobile": "+91 98765 43210" },
  "address": {
    "addressLine1": "12 Shastri Street",
    "addressLine2": "",
    "landmark": "Near the temple",
    "city": "Lucknow",
    "pincode": "226001"
  },
  "deliveryAreaId": "<id from /delivery-areas>",
  "items": [{ "productId": "<product id>", "quantity": 2 }],
  "paymentMethod": "COD"
}
```

- Unknown fields are rejected, so a client cannot send prices, totals or a delivery charge.
- `201` returns the order with its `orderNumber` and a `trackingToken`. **The token is only
  returned here**; store it, because reading or cancelling the order requires it.
- Sending the same request again (same `clientRequestId` **and** same contents) returns the
  original order with `200` and the header `Idempotent-Replayed: true`. It never creates a
  second order. This is how a client recovers when a response is lost: replay the request.
- The same `clientRequestId` with **different** contents is rejected with `409
  IDEMPOTENCY_CONFLICT`, and the reply reveals nothing about the original order.

## How the important rules are enforced

**Stock is reserved, not sold, at order time.** `available = stockQuantity - reservedQuantity`.
Placing an order increases `reservedQuantity`; cancelling decreases it. `stockQuantity` only
drops when an order is delivered (a future admin action, recorded as `SALE`). Every movement
is written to `InventoryTransaction`.

**Overselling is prevented in the database, not in application code.** A reservation is one
statement:

```sql
UPDATE "Product" SET "reservedQuantity" = "reservedQuantity" + $qty
WHERE "id" = $id AND "isActive" AND "stockQuantity" - "reservedQuantity" >= $qty
```

The availability check and the write are the same atomic statement and the row is locked,
so when two orders race for the last unit exactly one updates a row; the other updates none
and is rejected with `OUT_OF_STOCK`. As a backstop, a `CHECK` constraint keeps
`0 <= reservedQuantity <= stockQuantity`, so even a faulty query cannot oversell. Products
are always locked in id order, which prevents deadlocks between orders sharing products.

**An order is all-or-nothing.** Reservation, customer, order, items, status history, the
order number and the inventory records are written in one transaction. Any failure rolls
everything back.

**Idempotency covers the whole request, not just its id.** Each order stores a SHA-256
fingerprint of what was asked for: customer, address, delivery area, items (in any order)
and payment method. It is computed from the validated input, so `+91 98765 43210` and
`9876543210` match, and it excludes everything the server decides. A replay is accepted only
if its fingerprint matches. That keeps one id from standing for two purchases, and it means
the full original request acts as the proof needed to get the order (and its tracking token)
back: knowing only the id is not enough. Orders created before fingerprints existed have none
and can never be replayed.

**Order numbers** (`BN-YYYYMMDD-NNNN`, date in IST) come from an `OrderCounter` row
incremented with `INSERT ... ON CONFLICT DO UPDATE`, which is safe across concurrent
requests and multiple server processes.

**Order privacy.** Order numbers are sequential and guessable, so they grant nothing on
their own. Each order has a random 192-bit `trackingToken`, compared in constant time, sent
in a header so it stays out of URLs and logs.

## Project layout

```
prisma/        schema, migrations, seed
scripts/       bundled dev database
src/
  config/      environment parsing
  lib/         prisma client, errors, pricing, mobile number
  middleware/  error handling, request log
  modules/     catalog, orders, health (routes, schemas, services)
  app.ts       Express app
  server.ts    entry point
tests/         API tests against a real PostgreSQL
```
