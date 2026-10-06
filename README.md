# DoorKart

Local ecommerce for a single shop: stationery, gifts, toys, sports and decoration items,
delivered locally with Cash on Delivery.

| Folder            | What it is                                                        |
| ----------------- | ----------------------------------------------------------------- |
| `App/BuyNest`     | Customer mobile app (Expo, React Native, Expo Router)             |
| `Backend`         | REST API (Express, Prisma, PostgreSQL). See `Backend/README.md`   |
| `Admin/Frontend`  | Admin panel (Next.js, Tailwind). See `Admin/Frontend/README.md`   |

`CLAUDE.md` holds the project's working instructions.

## Running it locally

### Docker (API, admin frontend, and database)

Install Docker with Compose, then run from the repository root:

```bash
docker compose up --build -d
```

The admin panel is at http://localhost:3000 and the API is at
http://localhost:4000 (`/health` checks the API and database). PostgreSQL runs only
inside Docker and has no host port. Migrations run automatically before the API
starts. Database data and uploaded media persist in named Docker volumes.

Load the optional sample catalogue:

```bash
docker compose exec backend npm run prisma:seed -- --config prisma7.config.ts
```

Create the first admin with your own email, name, and password (at least 10 characters):

```bash
docker compose exec -e ADMIN_SEED_EMAIL=owner@example.com -e ADMIN_SEED_NAME=Owner -e ADMIN_SEED_PASSWORD="your-long-passphrase" backend npm run admin:create
```

View logs with `docker compose logs -f`; stop with `docker compose down`. Stopping
keeps data. `docker compose down -v` permanently deletes the database and uploads.

Optional settings are in `.env.docker.example`; copy it to `.env` in the repository
root to override them. The Compose database connection overrides `Backend/.env`,
and local environment files are excluded from Docker images. Changing the database
password after the volume is initialized requires updating the PostgreSQL role's
password too; changing the environment alone does not update existing credentials.

The default Compose setup is for local HTTP use. For deployment behind HTTPS,
set `BACKEND_NODE_ENV=production`, a strong URL-safe `POSTGRES_PASSWORD`, your admin
origin in `CORS_ORIGINS`, and the browser-accessible HTTPS API origin in
`NEXT_PUBLIC_API_BASE_URL`. Set `TRUST_PROXY_HOPS` to match your reverse proxy setup.
Rebuild the frontend after changing its API URL; Next.js embeds it during the build.

The Expo mobile app still runs separately using the instructions below and connects
to the Docker API through port 4000. Do not start `npm run db:dev` for this setup.

### Without Docker

These run together. Start them in separate terminals.

```bash
cd Backend && npm run db:dev      # the database (keep it open)
cd Backend && npm run dev         # the API on port 4000
cd App/BuyNest && npm start       # the mobile app
cd Admin/Frontend && npm run dev  # the admin panel on http://localhost:3000
```

The admin panel needs an admin account first: set `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD`
and `ADMIN_SEED_NAME` in `Backend/.env`, then run `cd Backend && npm run admin:create`.

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
