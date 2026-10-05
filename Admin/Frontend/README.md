# BuyNest Admin

The shop's admin panel: orders, products, stock, categories, delivery areas and customers.
Next.js (App Router), TypeScript and Tailwind CSS. It has no backend of its own; every screen
talks to the BuyNest API in `Backend/` under `/api/v1/admin`.

## Running it locally

Three terminals:

```bash
cd Backend && npm run db:dev        # the database (keep it open)
cd Backend && npm run dev           # the API on http://localhost:4000
cd Admin/Frontend && npm run dev    # the admin panel on http://localhost:3000
```

First time only:

1. `cd Admin/Frontend && npm install`
2. Copy `.env.example` to `.env.local`.
3. Create an admin account. In `Backend/.env` set `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD`
   (at least 10 characters) and `ADMIN_SEED_NAME`, then run `cd Backend && npm run admin:create`.
   `Backend/.env` is ignored by git. Never put a real password in `.env.example`.

Then open http://localhost:3000 and sign in.

## Environment variables

| Variable                   | Example                 | Notes                                             |
| -------------------------- | ----------------------- | ------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:4000` | The API's origin, without `/api/v1`. No secrets.  |

Next.js reads it at startup (dev) or build time (production), so restart or rebuild after
changing it. Development falls back to `http://localhost:4000` when it is missing; a
production build refuses to guess and shows a configuration error instead.

### The backend must allow this panel's address

The backend's `CORS_ORIGINS` (in `Backend/.env`) lists the browser origins that may call it.

- Left blank, development accepts any origin, so local work needs no change.
- If you set it, include every browser origin you use, comma separated, for example
  `CORS_ORIGINS=http://localhost:3000,http://localhost:8081` (admin panel and the Expo web app).
- In production it must be set to the admin panel's real address; a blank value allows nothing.

An origin missing from the list shows up as "Cannot reach the server" on the sign-in page,
because the browser blocks the request before it is sent.

## Commands

```bash
npm run dev        # development server
npm run typecheck  # TypeScript
npm run lint       # ESLint
npm test           # unit tests (money, dates, API client)
npm run build      # production build
npm start          # serve the production build
```

## How it is put together

```
src/
  app/                 routes only; each page is a thin wrapper around a feature component
    login/
    (dashboard)/       everything behind sign-in (layout mounts the auth gate and the shell)
  features/            one folder per screen area: auth, dashboard, orders, products,
                       inventory, categories, delivery-areas, customers, settings
  components/ui/       shared building blocks (button, field, table, modal, toast, states…)
  components/layout/   sidebar, mobile drawer
  services/api/        the API client and one function per admin endpoint
  hooks/               use-api-query (loading/error/success), use-url-params (filters in the URL)
  types/api.ts         the shapes the backend returns
  utils/               money (integer paise), dates (India time), class names
  constants/           labels and colours for order and payment statuses
```

### Signing in

The backend sets an HttpOnly cookie (`bn_admin_session`) when you sign in. The panel never
sees the cookie's value and stores nothing in `localStorage` or `sessionStorage`; every request
simply goes out with `credentials: 'include'`.

On load the panel asks `GET /admin/auth/me`. Until that answers, protected pages show a spinner
rather than their content. A `401` from any request sends you to `/login` with a "session has
expired" notice. Signing out calls `POST /admin/auth/logout`, which deletes the session on the
server.

Because the cookie belongs to the API's origin, the Next.js server cannot read it. That is why
all admin data is fetched in the browser and the pages are client components. The sign-in
check in the panel is for a good experience only; the backend is what enforces access.

### Rules the panel does not re-implement

- **Order status buttons** come from `allowedNextStatuses` in the order the server returns.
  The panel has no transition table of its own.
- **Cash collection** is shown only when the server says `canCollectPayment`. Marking an order
  delivered never marks it paid.
- **Stock** changes only through "Adjust stock" (`POST /admin/products/:id/inventory-adjustments`).
  The product form does not edit stock after creation.
- **Money** is typed in rupees and converted to whole paise with string arithmetic, never floats.
- **Totals, prices and availability** are displayed exactly as the server sent them.

When the server refuses something (an order changed in another tab, stock would fall below
what is reserved, a duplicate SKU), its message is shown and the screen reloads the latest data.

### Pictures and videos

On a product, "Pictures and videos" lets you pick or drop files, preview them, reorder them
and remove them. Each file is uploaded to the backend as soon as it is chosen; the product
only keeps the returned address, so nothing is lost if you leave without saving except the
unused file. The first picture is the main one. Videos are shown first only if you put them
first; they are never the main picture. You can still paste a web address instead of uploading.
The server decides what a file really is and enforces the size limits (5 MB pictures, 50 MB videos).

### Dates

Everything is shown in India time (`Asia/Kolkata`) through `src/utils/date.ts`, whatever the
computer's own time zone is.

## Known limitations

- One admin role in practice; there is no screen to manage admin users or change a password
  (use `npm run admin:create` in `Backend`).
- Category images are still web addresses typed in by hand; only products have uploads.
- Removing a picture from a product leaves its file on the backend's disk.
- No stock history screen; adjustments are recorded by the backend but not listed here.
- The API types in `src/types/api.ts` are kept in step with the backend by hand.
