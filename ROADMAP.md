# DoorKart Roadmap

Where the project stands and what is left to run the shop on it. Written 5 Oct 2026 from the
actual state of the code. `CLAUDE.md` still holds the working rules; this file is the plan.

## Where we are

| Area | State |
| ---- | ----- |
| Customer app (Expo): browse, search, cart, checkout (COD), orders, product pictures and videos | Built and connected to the API |
| Backend (Express, Prisma, PostgreSQL): catalog, orders, stock, delivery areas, idempotent order placing | Built, 178 tests passing |
| Admin API and sign-in (cookie session, origin check, rate limit) | Built |
| Admin panel (Next.js): dashboard, orders, products with uploads, inventory, categories, delivery areas, customers | Built, used against a sandbox; not yet used with real shop data |
| Production setup (hosting, HTTPS, backups, app build) | **Not started** |

Nothing is deployed. Everything runs on your PC with a development database.

## Phase 5: Prove it with real use (about 1 week)

Goal: find what breaks before customers do.

1. Commit the finished work in sensible pieces (admin panel, uploads, backend changes).
2. Enter your real catalog through the admin panel: categories, delivery areas, products with photos and stock.
3. Place 10 or more test orders from the phone, as different "customers", and run each through the whole flow in the admin panel. Include a cancelled order, a failed delivery, and one order that goes out of stock.
4. Check the numbers by hand: dashboard totals, cash collected vs delivered, stock after each step.
5. Test on the phones your customers use, including a low-end Android phone and a weak connection.
6. Write down everything awkward. That list decides what Phase 6 contains.

Done when: a full day of pretend orders runs with no surprises and no manual database fixes.

## Phase 6: Fixes from real use, and the missing basics (1 to 2 weeks)

Do the items that Phase 5 shows matter. Known candidates today:

| Item | Why |
| ---- | --- |
| Admin password change and a way to add a second admin | Right now the password can only be set from the command line |
| Make the login rate limit survive an API restart | It is kept in memory today, so a restart resets it |
| Delete uploaded files that no product uses any more | Removed pictures stay on disk |
| Category pictures by upload (not typed web address) | Only products have uploads |
| Stock history screen in the admin panel | Every change is recorded, but there is no screen to read it |
| Order search and filter polish, printing a packing slip or delivery note | Day-to-day speed for packing and delivery |
| "Undo" rules for mistakes (marked Delivered by accident) | Delivered cannot be reversed today, by design; decide the correction process |
| Customer app: Account tab, saved address, reorder from past order | Account is minimal today |
| Customer app: clear messages when stock changes between cart and checkout | Part of the reliability story |

## Phase 7: Go live (1 to 2 weeks)

Goal: customers can install the app and the shop runs from a server instead of your PC.

1. **Choose hosting.** One small server (VPS) running the API, PostgreSQL and the admin panel is enough for one shop. A managed PostgreSQL costs more but removes backup worries. Decide this first; everything below depends on it.
2. **Real PostgreSQL.** The bundled dev database is for development only. Create the production database and run `npm run prisma:deploy`.
3. **HTTPS and a domain** for the API (for example `api.yourshop.com`) and the admin panel. The mobile release build requires `https://`.
4. **Production settings:** `NODE_ENV=production`, `CORS_ORIGINS` set to the admin panel's address only, `TRUST_PROXY_HOPS` matching your proxy, `UPLOAD_DIR` on a disk that survives redeploys. Admin cookies become `Secure` in production.
5. **Backups.** Nightly database dump plus a copy of the uploads folder, stored somewhere other than the server. Do one test restore before launch. This is the most important item in this phase.
6. **Run it as a service** that restarts after a crash or reboot, with logs you can read.
7. **Create the production admin** with a long passphrase. Do not reuse a development password.
8. **Build the Android app** with EAS Build and set `EXPO_PUBLIC_API_BASE_URL` to the live API. Test the installed build, not Expo Go.
9. **Distribute it:** Google Play (needs a developer account and a privacy policy page) or share the APK directly with early customers first.
10. **Soft launch** with a handful of known customers for a week, while you watch the admin dashboard.

Done when: a customer outside your home network can install the app, order, and you can deliver and close the order from the admin panel on a live server, and a restored backup has been proven.

## Phase 8: Run the business (ongoing)

Pick from these only when the shop actually needs them. They are all deliberately left out so far (see "Do not build yet" in `CLAUDE.md`).

- Phone number login (OTP) so customers keep their order history across phones
- Push notifications for order status
- Online payments (Razorpay, UPI)
- Coupons and offers
- Delivery staff accounts and an app for them
- Reports: daily and monthly sales, top products, category sales
- GST invoices and returns or refunds
- Product variants (size, colour, pack size)
- Supplier and purchase management, multiple stores or warehouses

## Decisions made (5 Oct 2026)

1. **Hosting: the cheapest that works.** One small virtual server running the API, PostgreSQL and the admin panel together, plus backups. Check current prices before choosing; expect a few hundred rupees a month.
2. **Launch on Google Play.** Needs a Google Play developer account (one-time fee), a privacy policy page, and a testing period before the public release. Start the account early because the approval steps take days.
3. **Admin roles:** Super admin creates logins for Admins. A seller or reseller role is a later phase. Admin management (create, disable, reset password) moves into Phase 6.
4. **Order corrections:** Staff mark each step when it happens (accepted, packed, out for delivery, delivered, cash collected). A mistaken status gets a super-admin-only correction with a required reason, which is recorded in the history. Decide the exact rules in Phase 6.
5. **First extra feature:** to be chosen after Phase 7, based on what customers ask for.

## Ground rules that stay the same

- Money is whole paise; the backend decides prices, totals and stock, never the app.
- Orders keep a snapshot of the product at purchase time.
- Order status and payment status stay separate; Delivered never means paid.
- Products, categories and areas are deactivated, never deleted.
- No real secrets in git; no `npm audit fix --force`; no automatic commits.
