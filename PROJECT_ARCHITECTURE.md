# DoorKart / BuyNest project architecture

Source discovery date: **9 October 2026**. This document describes the inspected working tree, including pre-existing uncommitted work. It does not establish the committed/deployed version, live database state, dependency compatibility, or passing tests. Recheck relevant source before changes.

## Evidence and scope

Sections describing implementations below are verified from repository source, manifests, configuration, schema, migrations, and test definitions. No application, Docker service, database migration, integration, or test suite was executed during discovery or document creation. Private environment values were not inspected. Suspected issues and unknowns are listed separately at the end.

The product is branded **DoorKart**. The repository and technical identifiers also use **BuyNest** / `buynest`; preserve both. Historical instructions and roadmap entries can describe aspirations or obsolete paths rather than implemented behavior.

## 1. Applications and repository structure

| Application | Root             | Declared stack at discovery                              | Entry point                                    |
| ----------- | ---------------- | -------------------------------------------------------- | ---------------------------------------------- |
| Customer    | `App/BuyNest`    | Expo 57, React Native 0.86.3, React 19.2.3, TypeScript   | `expo-router/entry`, `src/app/_layout.tsx`     |
| API         | `Backend`        | Node >=22, Express 5.2.1, Prisma 7.10, PostgreSQL, Zod 4 | `src/server.ts`, `createApp()` in `src/app.ts` |
| Admin       | `Admin/Frontend` | Next.js 16.3.8, React 19.2.8, TypeScript, Tailwind 4     | `src/app/layout.tsx`                           |

These versions are manifest declarations, not a compatibility certification. Each application has `package.json` and `package-lock.json`; no root package manifest or shared workspace package was found.

```text
App/BuyNest/
  src/app/                 Expo Router routes and layouts
  src/features/            Customer screens, providers, reducers, storage
  src/components/ui/       Shared UI
  src/services/api/        Network client, parsing, endpoint adapters
  src/services/storage.ts  AsyncStorage wrapper and keys
  src/constants/theme.ts   Design tokens
  assets/                  Images and icons

The root, `Backend`, and `Admin/Frontend` contain Git repositories. The mobile app resolves to the root repository. Their statuses may differ; inspect every affected repository before Git operations. Existing nested `AGENTS.md` files in mobile/admin remain applicable. Admin `CLAUDE.md` references its `AGENTS.md`.

## 2. Data flow and ownership

```text
Customer device -- REST /api/v1 -----------+
                                          +-- Express -- Prisma PG adapter -- PostgreSQL
Admin browser -- REST /api/v1/admin -------+
                                          +-- Product upload filesystem
                                          +-- SMTP email delivery
                                          +-- Google identity verification
```

Both frontend applications call Express directly. No Next.js API layer or frontend database connection was found. Browser requests include the admin session cookie; mobile account requests use a bearer token. Guest order requests use order-specific tracking tokens.

The backend owns authoritative prices, delivery charges, order totals, inventory, status transitions, and permissions. Frontend calculations are estimates or input conversions.

| Entity                    | Origin / update path                                 | Readers and dependent flows                                                            |
| ------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Categories/products/media | Admin API; database and upload directory             | Mobile browsing, wishlist, cart refresh, checkout                                      |
| Delivery areas            | Admin API; database                                  | Checkout eligibility, minimums, delivery estimates; historical orders retain snapshots |
| Orders                    | Mobile order API; atomic database transaction        | Mobile tracking/cancellation; admin fulfillment, customer figures, dashboard           |
| Inventory                 | Placement/cancellation/delivery and admin adjustment | Public availability, checkout, low-stock/dashboard figures                             |
| Guest customers           | Order placement upsert by normalized mobile          | Admin customer list/detail and order statistics                                        |
| Accounts                  | Email/Google sign-in and profile API                 | Mobile account state; not linked to guest order ownership                              |
| Settings                  | Super-admin settings API                             | Authentication configuration, SMTP, public shop details                                |

API shapes are maintained independently in frontends. There is no shared generated contract package. Uploaded paths are resolved against the API origin at display time.

## 3. Backend request architecture

`src/server.ts` calls `createApp()`, listens on the configured port, handles startup errors, and disconnects Prisma on graceful shutdown.

`src/app.ts` configures trust-proxy hops, Helmet, CORS, public static `/uploads`, a 100 KB JSON-body limit, request logging outside tests, route mounting, and centralized errors.

Typical flow: **route -> Zod input validation -> service -> Prisma/transaction -> public/admin mapping -> response**. Smaller admin modules combine routes, schemas, and database operations; there is no mandatory controller layer.

`src/lib/prisma.ts` constructs Prisma with `@prisma/adapter-pg`. Normal queries use Prisma. Tagged, parameterized raw SQL implements atomic reservations, releases, sales, order counters, and column-comparison stock queries.

Response conventions in `src/lib/http.ts` and `src/middleware/error-handler.ts`:

```json
{ "success": true, "data": {} }
```

```json
{
  "success": false,
  "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [] }
}
```

Zod failures are 400 responses with field details. Known `AppError` instances retain their status/code. Unexpected errors are logged; production responses hide internal error messages. Development can return the unexpected error's message. Request logging includes method, path, status, and duration, excluding query strings, headers, and bodies.

## 4. Important REST endpoints

All paths below include their mounted prefixes. Verify route files for exact request schemas before editing.

### Public catalog and orders

| Method | Path                                 | Behavior                                                     |
| ------ | ------------------------------------ | ------------------------------------------------------------ |
| GET    | `/health`                            | API/database health                                          |
| GET    | `/api/v1/categories`                 | Active categories                                            |
| GET    | `/api/v1/products`                   | Active products in active categories, filters and pagination |
| GET    | `/api/v1/products/:identifier`       | Active product by ID or slug                                 |
| GET    | `/api/v1/delivery-areas`             | Active delivery rules                                        |
| GET    | `/api/v1/shop`                       | Public contact details and policy URLs                       |
| POST   | `/api/v1/orders`                     | Guest order creation or idempotent replay                    |
| GET    | `/api/v1/orders/:orderNumber`        | Order read using `x-tracking-token`                          |
| POST   | `/api/v1/orders/:orderNumber/cancel` | Token-authorized customer cancellation                       |

Catalog supports category slug, search, featured/new flags, IDs, selling-price range in paise, in-stock filter, and sorts `newest`, `price_asc`, `price_desc`, `name_asc`. Public pagination defaults to page 1 / limit 20, maximum 50. Responses contain `items` and `pagination` (`page`, `limit`, `total`, `totalPages`). Search is case-insensitive name/description matching. Sorts include an ID tie-breaker.

### Customer authentication and account

| Method           | Path                             | Behavior                                          |
| ---------------- | -------------------------------- | ------------------------------------------------- |
| GET              | `/api/v1/auth/config`            | Enabled methods and public Google web client ID   |
| POST             | `/api/v1/auth/email-otp/request` | Request email code                                |
| POST             | `/api/v1/auth/email-otp/verify`  | Verify code and return account/session            |
| POST             | `/api/v1/auth/google`            | Verify Google ID token and return account/session |
| POST             | `/api/v1/auth/logout`            | Revoke bearer session                             |
| GET/PATCH/DELETE | `/api/v1/account/me`             | Read/rename/delete signed-in account              |

### Admin

Base prefix: `/api/v1/admin`.

| Method    | Relative path                               | Behavior                                  |
| --------- | ------------------------------------------- | ----------------------------------------- |
| POST      | `/auth/login`, `/auth/logout`               | Staff sign-in/sign-out                    |
| GET       | `/auth/me`                                  | Current staff identity                    |
| GET       | `/dashboard`                                | Shop metrics, recent orders, low stock    |
| GET       | `/orders`, `/orders/:id`                    | Order list/detail                         |
| PATCH     | `/orders/:id/status`, `/orders/:id/payment` | Fulfillment or cash collection            |
| GET/POST  | `/products`                                 | List/create products                      |
| GET/PATCH | `/products/:id`                             | Read/update details                       |
| POST      | `/products/:id/inventory-adjustment`        | Signed stock adjustment with note         |
| GET/POST  | `/categories`, `/delivery-areas`            | List/create                               |
| PATCH     | `/categories/:id`, `/delivery-areas/:id`    | Update/deactivate                         |
| GET       | `/customers`, `/customers/:id`              | Guest customer records/statistics         |
| POST      | `/uploads`                                  | Upload one file in multipart field `file` |
| GET/PATCH | `/settings`                                 | Super-admin settings                      |
| POST      | `/settings/email/test`                      | Super-admin SMTP test                     |

Admin paginated lists default to limit 25, maximum 100. Order date filters use inclusive IST calendar dates converted to UTC ranges. Admin order responses exclude customer tracking tokens, request fingerprints, and request IDs. Catalog/delivery records are deactivated rather than deleted through their APIs.

Sources: `Backend/src/modules/*/*.routes.ts`, admin module route files, and `Admin/Frontend/src/services/api/admin-api.ts`.

## 5. PostgreSQL schema and relationships

Repository sources: `Backend/prisma/schema.prisma` and SQL under `Backend/prisma/migrations`. These describe the intended migrated schema, not verified live state. Prisma generates its client into `Backend/src/generated/prisma`.

| Model                | Important fields / relationships                                                                                                                                     |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Category             | Unique slug, name, description/image, activity/display order; one-to-many products                                                                                   |
| Product              | Category FK, unique SKU/slug, paise prices, physical/reserved stock, threshold, activity/featured/new flags                                                          |
| ProductImage         | Product FK, URL, media type, alternative text, display order; table name retained for videos                                                                         |
| Customer             | Guest name and unique normalized Indian mobile; one-to-many orders                                                                                                   |
| DeliveryArea         | Unique name, optional pincode, delivery charge, minimum/free threshold, activity; referenced by orders                                                               |
| Order                | Unique order number/request ID, fingerprint, tracking token, customer/area FKs, address/name snapshots, totals, independent statuses, fulfillment/payment timestamps |
| OrderItem            | Order/product FKs; snapshot name/SKU/image/price/quantity/line total; unique order/product pair                                                                      |
| OrderStatusHistory   | Order FK, status/note/time, optional staff attribution                                                                                                               |
| PaymentStatusHistory | Order FK, from/to status, note/time, optional staff attribution                                                                                                      |
| InventoryTransaction | Product FK, optional order/admin, movement type, signed-or-positive quantity, note/time                                                                              |
| OrderCounter         | IST calendar-day primary key and sequence                                                                                                                            |
| AdminUser            | Unique normalized email, name, scrypt hash, role, activity, login timestamps                                                                                         |
| AdminSession         | Admin FK, unique token hash, expiry/use timestamps                                                                                                                   |
| Account              | Unique email, optional unique Google subject, profile/verification/login timestamps                                                                                  |
| AccountSession       | Account FK, unique token hash, expiry                                                                                                                                |
| EmailOtp             | Email, keyed code hash, attempts, expiry/consumption/time                                                                                                            |
| Setting              | Key primary key, value, secret flag, update time and updater identifier                                                                                              |

Most entity IDs are CUID strings. `OrderCounter.day` and `Setting.key` are natural keys. `Setting.updatedByAdminId` is an identifier field, not a declared Prisma relation.

Business FKs generally use deletion restrictions for products/customers/delivery areas referenced by history. Owned media, order child histories/items, and sessions have cascades where declared. Optional inventory/audit references use `SetNull` where declared. Account deletion cascades its sessions and explicitly removes email OTP records; it does not delete guest orders.

Indexes cover category activity/display order; product category and merchandising flags; media order; order customer/status/date/delivery/payment dates; history and inventory lookups; session expiry; and OTP email/date. Unique constraints back up application duplicate checks.

### Enums and database guarantees

- `OrderStatus`: PLACED, CONFIRMED, PACKED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED, DELIVERY_FAILED.
- `PaymentMethod`: COD.
- `PaymentStatus`: PENDING, COLLECTED, REFUNDED (refund behavior is not implemented).
- `AdminRole`: SUPER_ADMIN, ADMIN.
- `InventoryTransactionType`: RESERVE, RELEASE, SALE, ADJUSTMENT.
- `MediaType`: IMAGE, VIDEO.

Handwritten SQL CHECK constraints enforce nonnegative physical stock; reserved stock between zero and physical stock; nonnegative relevant monetary amounts; positive order quantities; and nonzero inventory movements (negative allowed only for adjustments). Prisma schema alone does not express these constraints. The selling-price/MRP relationship is validated in application code, not by the documented price CHECK constraint.

### Migration history

1. `20261003103118_init`: base commerce schema and checks.
2. `20261003115330_add_order_request_fingerprint`: replay intent fingerprint.
3. `20261003121953_add_admin_auth_and_audit`: staff sessions/audit, payment history, timestamps, signed adjustment check.
4. `20261005120000_add_product_media_type`: media enum/column.
5. `20261006180000_add_customer_accounts_and_settings`: accounts, sessions, OTPs, settings.

No implemented server cart, address-book, variant, coupon, payment-gateway, warehouse, or shipping-provider tables were found.

## 6. Authentication and authorization

### Admin

`modules/admin/auth/password.ts` uses salted Node scrypt hashes. `session.ts` issues random session tokens, stores only SHA-256 hashes, and sets HttpOnly `bn_admin_session` cookies scoped to `/api/v1/admin`. Cookies use `SameSite=Lax` and Secure in production. Default lifetime is 12 hours, configurable; validity and admin activity are checked on requests.

`modules/admin/admin.routes.ts` applies trusted-origin checks, mounts auth routes, then `requireAdmin` before business routes. Login is rate limited. `requireRole('SUPER_ADMIN')` protects settings reads/writes and email tests. Other implemented business routes require an active staff session. Frontend `AuthGate` is a UI guard; Express enforces access.

Cookie behavior requires compatible browser/API deployment origins and HTTPS configuration; CORS permission alone does not override browser cookie policy.

### Customer account

Email codes are six digits, default ten-minute lifetime (settings permit 3-30), single-use, with keyed hashes. The implementation permits five wrong attempts, a 60-second resend interval, and five requests per email per hour, plus IP-based auth limiting outside tests.

Google verification uses `google-auth-library` and configured audiences, validates the ID token, and requires verified email. Verified email can link a Google sign-in to an existing email-code account.

Account sessions issue random bearer tokens, store SHA-256 hashes, and last 30 days. Mobile tokens use SecureStore. Native Google functionality is loaded on demand and disabled in Expo Go; actual release/device compatibility remains untested.

`Account` is separate from mobile-number-keyed guest `Customer`. There is no account-to-order ownership relation or server synchronization of saved addresses/cart/wishlist. Deleting an account preserves shop order records.

### Guest order access

Order numbers are not credentials. Order reads/cancellation require `x-tracking-token`; comparison is constant-time. Mobile retains order number/token references. Do not place tokens in URLs, logs, or admin DTOs.

## 7. Catalog, prices, checkout, and idempotency

`modules/catalog/catalog.service.ts` hides inactive products and inactive categories. Public products expose computed `availableQuantity`, not internal stock bookkeeping. Category/delivery rules come from the database, not a fixed category list.

`lib/pricing.ts` calculates integer-paise line totals, subtotal, delivery charge, and grand total. Free delivery applies at the area's threshold. Discounts are currently zero. No separate tax or coupon calculation was found.

Order input in `orders.schemas.ts` uses strict objects: customer, address, delivery-area ID, product IDs/quantities, request ID, COD. Client-supplied prices/totals are rejected. It permits at most 50 unique product lines and quantities 1-999; mobile is normalized to an Indian ten-digit number, and pincode is validated as six digits.

`orders.service.ts` validates the active delivery area, reserves products in sorted ID order, reads locked product prices/snapshots, checks category activity and minimum order, upserts the guest customer, issues an order number, and writes order/items/history/inventory records in one transaction. Failure rolls back the transaction.

`clientRequestId` is unique. `fingerprint.ts` hashes canonical validated purchase intent. Same-ID retries only succeed if fingerprints match; mismatches are conflicts. Legacy null fingerprints cannot be accepted as matching replays. Creation returns 201; replay returns 200 and `Idempotent-Replayed: true`.

`order-number.ts` uses an atomic daily counter for `DK-YYYYMMDD-NNNN` in IST. Order-number validation also accepts legacy BN-prefixed numbers. Preserve historical identifiers.

Mobile `pending-order.ts` and `order-context.tsx` retain the full unresolved request before sending, serialize submissions, and preserve unknown outcomes. A replay uses the original request. Confirmed orders are saved to the tracked index before clearing the pending record. Cart clearing uses a fingerprint to avoid deleting a cart changed during submission.

## 8. Order lifecycle, inventory, and cash

Authoritative sources: `modules/orders/order-lifecycle.ts`, `orders.service.ts`, and `modules/admin/orders/admin-orders.service.ts`.

| Current status        | Permitted admin next statuses |
| --------------------- | ----------------------------- |
| PLACED                | CONFIRMED, CANCELLED          |
| CONFIRMED             | PACKED, CANCELLED             |
| PACKED                | OUT_FOR_DELIVERY, CANCELLED   |
| OUT_FOR_DELIVERY      | DELIVERED, DELIVERY_FAILED    |
| DELIVERY_FAILED       | OUT_FOR_DELIVERY, CANCELLED   |
| DELIVERED / CANCELLED | None                          |

Customer cancellation permits only PLACED -> CANCELLED. Failure retains reservations for redelivery; cancellation releases them. Collected cash blocks cancellation/failure because refunds are not built.

| Event             | Physical stock | Reserved stock | Audit      |
| ----------------- | -------------- | -------------- | ---------- |
| Place             | Unchanged      | Increase       | RESERVE    |
| Cancel            | Unchanged      | Decrease       | RELEASE    |
| Deliver           | Decrease       | Decrease       | SALE       |
| Manual adjustment | Signed change  | Unchanged      | ADJUSTMENT |

Availability is always physical minus reserved. Atomic SQL conditions prevent overselling or invalid decrements. Status claims include the expected current status in the update; repeated/concurrent changes cannot both apply the same stock movement. Changes and histories are transactional. Adjustments require a note and cannot reduce physical stock below reservations. Product details updates do not directly edit existing stock.

Payment status is independent. Only PENDING -> COLLECTED is supported, while OUT_FOR_DELIVERY or DELIVERED. It records `paymentCollectedAt` and separate history. Delivery does not imply payment, and REFUNDED in the enum does not enable refunds.

Order/customer/address/product/pricing snapshots preserve purchase-time history rather than reading mutable catalog values.

## 9. Mobile architecture and persistence

Root layout mounts Auth, Cart, Orders, Wishlist, and Addresses providers. Tabs are Home, Products, Cart, Orders, Account. Stack routes include search, categories, collections, product details, checkout, success/details, sign-in, wishlist, addresses/editor, help, and about.

Route wrappers live in `src/app`; implementations live in `src/features`. React contexts, reducers, and component state handle state. `useApiData` exposes loading/error/success/refresh states with request cancellation and stale-response protection; `useProductPages` loads additional pages. No external shared query cache/state package was found.

`services/api/client.ts` centralizes fetch, timeout/error envelopes, and parser callbacks. `catalog-api.ts` maps DTOs: API `availableQuantity` becomes mobile `stockQuantity`; `mrpPaise` / `sellingPricePaise` become mobile `mrp` / `sellingPrice`, still integer paise. This naming boundary is important for compatibility.

AsyncStorage retains cart snapshots, wishlist IDs, saved addresses/default selection, checkout convenience details, tracked order credentials, and full pending requests. Storage keys preserve existing `buynest:*` and `doorkart:*` identifiers. Account tokens use SecureStore. Catalog/full order contents come from the API and are held in memory. Device-local records are not account-scoped or cleared by account sign-out.

Reusable UI includes product cards/grids/gallery, screen/text/buttons/fields, quantity and price controls, loading/error/empty states, order rows/timelines, and address components. Styling uses `StyleSheet` and `constants/theme.ts`; app supports light/dark navigation themes. Image/video display uses Expo modules.

`app.json` preserves DoorKart branding, `doorkart` scheme, typed routes, React compiler configuration, and existing plugins. Generated native directories were not present in the inspected app root. Release signing/store readiness is unverified.

## 10. Admin functionality and conventions

Next.js App Router layouts wrap providers and `(dashboard)` AuthGate. Feature screens fetch from the browser with `credentials: 'include'`; no session token is stored in browser storage. Auth restoration uses `/auth/me`; a 401 during ordinary calls triggers expiry handling. Sign-out revokes the server session before ending normal frontend auth state.

Implemented features: dashboard, order search/filter/detail/actions, product create/edit/deactivation/media, stock adjustments, category/delivery-area management, guest customer statistics, and super-admin settings. `useApiQuery` handles stale results and refresh without a shared cache. URL parameters preserve list filters/pagination. Shared UI includes tables, fields, pagination, dialogs, badges, toast, and navigation shell. Tailwind 4 handles styling.

The panel uses backend `allowedNextStatuses` and `canCollectPayment`. The transition list reflects the status table; cancellation/failure can still be rejected by additional collected-payment guards. Rupee input conversion uses string arithmetic to produce whole paise.

Dashboard 'today' is IST, timestamps are UTC. Revenue uses delivery timestamps; collected cash uses payment timestamps; cash pending counts delivered unpaid orders. Customer total order value excludes cancelled orders but includes other statuses, so it is not a delivered-only revenue measure. The sidebar polls dashboard counts every minute while visible.

No staff-management/password-change UI, stock-history screen, payment gateway, shipping-provider integration, or dedicated coupon/reporting module was found. Backend admin tooling creates staff and can explicitly reset passwords.

## 11. Media, integrations, configuration, and operations

`media-types.ts` detects allowed file signatures; `admin-uploads.routes.ts` uses Multer memory storage. Images (JPG/PNG/WebP/GIF) cap at 5 MB; videos (MP4/MOV/WebM) at 50 MB. Product schemas permit up to ten media items, at most three videos. Main product pictures are chosen from image media. HEIC/HEIF is rejected. Detection is not full media decoding.

`media-storage.ts` stores random filenames in `UPLOAD_DIR`. Product references to local uploads require an existing issued path. Express serves `/uploads` publicly with range support and cross-origin resource policy. Removing references leaves files on disk. Back up database and uploads together.

SMTP uses Nodemailer and database settings. `settings.registry.ts` defines accepted keys and metadata; `settings.service.ts` validates updates and returns secret-presence flags instead of secret values. `lib/secrets.ts` uses derived keys for AES-256-GCM secret encryption and keyed OTP hashing. Changing/losing `SECRETS_KEY` makes existing saved secrets unreadable. Google ID verification uses configured client IDs.

Backend configuration names include `NODE_ENV`, `PORT`, `DATABASE_URL`, `CORS_ORIGINS`, `ADMIN_SESSION_TTL_HOURS`, `TRUST_PROXY_HOPS`, `UPLOAD_DIR`, `SECRETS_KEY`. No private values belong in documentation. Mobile reads `EXPO_PUBLIC_API_BASE_URL`; production requires HTTPS and has no localhost fallback. Admin reads build-time `NEXT_PUBLIC_API_BASE_URL`; missing production configuration errors rather than guessing. CORS allows configured origins with credentials; blank origins permit development browsers but not production browsers.

Compose defines PostgreSQL 17 without a host database port, backend port 4000, admin port 3000, persistent database/upload volumes, and health checks. Its backend startup executes migration deployment before serving. The mobile app runs separately. Next.js uses standalone output. Container/runtime state was not tested.

`scripts/dev-db.ts` supports local embedded PostgreSQL. `reset-dev-data.ts` truncates order/customer/history data and releases reservations with local/nonproduction checks and an explicit flag; it remains destructive. Seed/demo/admin creation/reset scripts write data. No backend scheduler/queue/webhook was found; OTP/session cleanup is request-driven.

## 12. Existing verification

| Application | Existing commands                                                | Notes                                                                            |
| ----------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Backend     | `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` | Tests start temporary PostgreSQL and deploy migrations; build emits `dist`       |
| Admin       | `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` | Typecheck can create incremental metadata; build writes `.next`                  |
| Mobile      | `npm run typecheck`, `npm run lint`                              | No automated mobile test suite found; runtime checks still needed for UI changes |

Backend Vitest tests cover catalog, pricing, normalized mobile input, fingerprinting, order idempotency/concurrency/privacy/cancellation, database guarantees, admin auth/catalog/orders/dashboard, uploads, account/settings flows, and maintenance tools. Tests use Supertest and a temporary migrated PostgreSQL; files run serially because they share that database. Mail/Google verification support test replacements. Admin Vitest tests cover money conversion/formatting, dates, and API client behavior.

No checks were executed for the discovery/documentation task. Do not infer passing results from the existence of tests. Nested mobile guidance requires lint/typecheck for mobile implementation work; it does not authorize installing packages or starting services in a documentation-only task.

## 13. High-risk maintenance boundaries

- Inventory transactionality, atomic conditions, consistent lock order, and status races.
- Paise calculations, integer storage limits, and delivery-rule changes.
- Idempotency fingerprints, recovery after unknown outcomes, and pending-storage versions.
- Independent order/payment status, timestamps, and dashboard/customer metric semantics.
- Snapshot preservation and restrictions on deleting referenced entities.
- Tracking tokens, bearer/cookie sessions, origin checks, and role authorization.
- Guest/customer-account separation and device-local data expectations.
- Manually maintained API types and mobile availability-field adaptation.
- SQL constraints not represented in Prisma schema.
- Database/media backup consistency and nested Git worktrees with existing changes.

## 14. Verified limitations and documentation drift

- Some historical `CLAUDE.md` paths and instructions describe an earlier project state. Read actual code before treating those statements as implementation facts.
- Admin README describes plural `inventory-adjustments`; actual server/client use singular `inventory-adjustment`.
- Some role comments say nothing requires role restrictions; settings now require SUPER_ADMIN.
- Mobile README contains starter content and an obsolete reset command.
- API types are manually synchronized; device-local data does not synchronize across accounts/devices.
- Unreferenced uploaded files persist; category images use URL input rather than the product upload manager.
- Existing source changes were present in multiple Git repositories during discovery; this document does not establish which were committed/deployed.

## 15. Suspected issues: not reproduced or fixed

These are static observations for later targeted investigation, not confirmed runtime bugs or instructions to repair them automatically:

- OTP resend/hourly-limit checks precede the write transaction; concurrent requests may bypass intended limits.
- Later-page product results can arrive after filters change; test stale requests and refresh interactions in `use-product-pages.ts`.
- Concurrent partial product price updates may invalidate selling-price/MRP relationships checked against earlier reads.
- Upload signature checks do not fully decode media, and concurrent memory-buffered uploads may increase memory pressure.
- Home loading issues product requests per category, potentially increasing cost as category counts grow.

## 16. Unknowns and inspection limits

Unverified: live schema/data and migration drift; deployed revisions; actual SMTP/Google operation; mobile/admin rendering, accessibility, navigation, offline behavior, or native release compatibility; historical invalid-hook symptoms; installed dependency compatibility; build/lint/typecheck/test results; release signing; production origin/proxy configuration; backups/recovery.

Generated outputs, caches, database files, private environment values, and uploaded-file contents were not audited. Discovery covered repository structure and main implementation paths, not exhaustive line-by-line correctness/security review of every component. Future tasks must reread relevant source, preserve existing work, and perform appropriately scoped verification.
