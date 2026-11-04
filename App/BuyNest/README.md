# DoorKart Mobile App

The customer app: browse products, add to cart, check out with Cash on Delivery and track
orders. Expo SDK 57, React Native, Expo Router and TypeScript. It has no backend of its
own; every screen talks to the DoorKart API in `Backend/` under `/api/v1`.

## Running it locally

1. `cd App/BuyNest && npm install`
2. Copy `.env.example` to `.env.local` and set `EXPO_PUBLIC_API_BASE_URL`.
3. Start the API (`cd Backend && npm run db:dev` and `npm run dev`), then `npm start`.

Expo reads the environment only at startup, so restart `npm start` after changing it. Which
value to use for the web, a physical phone or an Android emulator is in the root `README.md`
under "Telling the app where the API is". Production builds require an `https://` URL.

## Scripts

| Command             | What it does                                    |
| ------------------- | ----------------------------------------------- |
| `npm start`         | Expo dev server (also `android`, `ios`, `web`)  |
| `npm run lint`      | `expo lint`                                     |
| `npm run typecheck` | `tsc --noEmit`                                  |

Add Expo-related packages with `npx expo install <package>` so versions match the SDK.

## Structure

```text
src/app/                 Expo Router routes and layouts (thin: they render feature screens)
src/features/<name>/     Screens, components, context providers, reducers, storage
src/components/ui/       Shared UI components
src/services/api/        Network client, response parsing, one adapter file per API area
src/services/storage.ts  AsyncStorage wrapper and storage keys
src/hooks/               Shared hooks (use-api-data, use-debounced-value, use-theme)
src/constants/theme.ts   Design tokens: colors, spacing, typography
src/utils/               Money, pricing and date helpers
src/types/               Shared TypeScript types
```

Features: account, addresses, auth, cart, catalog, checkout, help, home, notifications,
orders, reviews, search, wishlist.

## Conventions

- **Server is the source of truth.** The app never trusts its own prices, delivery charge or
  stock; the backend recalculates them when an order is placed. Money is integer paise.
- **State:** local UI state uses React state. Cross-screen state (cart, auth, orders,
  wishlist, addresses, notifications) lives in one context per feature, with a reducer and
  AsyncStorage persistence where the data must survive a restart (for example the cart).
- **API access:** screens never call `fetch` directly. They use the adapters in
  `src/services/api`, which throw typed errors from `api-error.ts`. Load data with
  `useApiData` (loading / error / success) and render an empty state when a list is empty.
- **Styling:** use the tokens from `src/constants/theme.ts`; do not add raw hex values to
  components.
- **File names** are kebab-case (`cart-screen.tsx`); components are PascalCase; hooks start
  with `use`.

See `PROJECT_ARCHITECTURE.md` in the repository root for the full system design and
`AGENTS.md` here for Expo-specific notes.
