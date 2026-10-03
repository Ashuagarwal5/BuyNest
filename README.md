# BuyNest

Local ecommerce for a single shop: stationery, gifts, toys, sports and decoration items,
delivered locally with Cash on Delivery.

| Folder            | What it is                                                        |
| ----------------- | ----------------------------------------------------------------- |
| `App/BuyNest`     | Customer mobile app (Expo, React Native, Expo Router)             |
| `Backend`         | REST API (Express, Prisma, PostgreSQL). See `Backend/README.md`   |
| `Admin/Frontend`  | Admin dashboard (not started)                                     |

`CLAUDE.md` holds the project's working instructions.

## Running it locally

Three things run together. Start them in separate terminals.

```bash
cd Backend && npm run db:dev      # the database (keep it open)
cd Backend && npm run dev         # the API on port 4000
cd App/BuyNest && npm start       # the mobile app
```

### Telling the app where the API is

The app reads `EXPO_PUBLIC_API_BASE_URL` from `App/BuyNest/.env.local` (copy
`.env.example`). Expo reads it **only at startup**, so restart `npm start` after changing it.

| Where the app runs            | Value                                                  |
| ----------------------------- | ------------------------------------------------------ |
| Web, on this computer         | `http://localhost:4000`                                |
| Physical phone (Expo Go)      | `http://<this computer's LAN IP>:4000` (see `ipconfig`) |
| Android emulator              | `http://10.0.2.2:4000`                                 |
| Phone on USB, `adb reverse`   | `http://localhost:4000` after `adb reverse tcp:4000 tcp:4000` |

On a phone, `localhost` is the phone itself, so it needs the computer's address. The phone
and computer must be on the same Wi-Fi, and Windows Firewall must allow Node on port 4000.
In the app, Account → "Check connection" tells you whether the server is reachable.

Development builds fall back to `localhost` if the variable is missing. **Production builds
never do:** they require `EXPO_PUBLIC_API_BASE_URL` to be set and to start with `https://`
(Android blocks plain `http://` in release builds), and otherwise every request fails with a
clear configuration error.
