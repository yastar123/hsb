# HSB Trading

React, TypeScript, and TanStack Router frontend with an Express API and PostgreSQL connection.

## Run locally

Install dependencies with Bun and start the combined Express/Vite development server:

```sh
bun install
bun run dev
```

The site is served on port 5000. The API health endpoint is `/api/health`.

## PostgreSQL

Replit supplies the PostgreSQL connection as `DATABASE_URL` at runtime. For local development, copy `.env.example` to `.env` and replace the example URL with a PostgreSQL connection string. Never commit `.env` or real credentials.

The app's current demo content and account flows still use browser storage. The Express/PostgreSQL connection is available and checked by `/api/health`; product-specific database tables and APIs should be added when those data requirements are defined.

## Production build

```sh
bun run build
bun run start
```

## Run the checks

```sh
bun run test:all
```

This runs linting, TypeScript checks, unit tests, then a production-build browser smoke test for every file-based route and several key interactions. The browser test uses `/repl/tools/bin/chromium` on Replit; elsewhere, install Chromium with `bunx playwright install chromium`.

## Deploy to a public VPS

The repository includes sample systemd and Caddy configuration in `deploy/vps/`. A typical setup is:

1. Use a Linux VPS with Node.js 20.19 or newer, Bun, and PostgreSQL. Point your domain's DNS records to the server and allow inbound ports 80 and 443.
2. Install the project in `/opt/hsb-trading`, then run `bun install --frozen-lockfile` and `bun run build`.
3. Create `/etc/hsb-trading/hsb-trading.env` with `DATABASE_URL`, `ADMIN_USERNAME`, and a unique, strong `ADMIN_PASSWORD`. Keep this file outside the repository and restrict it to the service account. If the admin credentials are absent, production `/admin` routes stay disabled.
4. Copy `deploy/vps/hsb-trading.service.example` to `/etc/systemd/system/hsb-trading.service`. Update the service user and paths to match the VPS, then enable and start it with systemd.
5. Configure Caddy with `deploy/vps/Caddyfile.example`, replacing `your-domain.example` with the domain. Caddy terminates HTTPS and forwards traffic to Express on port 5000.
6. Check `https://your-domain.example/api/health`; it should report `"database":"connected"`.

These are deployment instructions and sample configuration only; the app has not been installed on an external VPS or connected to a public domain.

## Current demo limits

Login, registration, deposit, withdrawal, and trading/account data are still demo flows. The smoke test verifies their current interface behavior, not real identity checks or financial transactions. Do not use them for live trading or real customer data. Production `/admin` pages require HTTP Basic Auth credentials; keep HTTPS enabled and never reuse the database password.
