# HSB Trading

React, TypeScript, and TanStack Router frontend with an Express API and PostgreSQL connection.

## Run locally

Install the locked dependencies, apply the development database migrations, then start the combined Express/Vite development server (Node.js 20.19 or newer):

```sh
npm ci --registry=https://registry.npmjs.org/
npm run db:push
npm run dev
```

The site is served on port 5000. The API health endpoint is `/api/health`.

## PostgreSQL

Replit supplies the PostgreSQL connection as `DATABASE_URL` at runtime. For local development or VPS deployment, copy `.env.example` to a protected environment configuration and replace every example value. Configure `ADMIN_EMAIL` and `ADMIN_PHONE` as alternate login identifiers using the same `ADMIN_PASSWORD` (at least 16 characters), and set `SESSION_SECRET` to a random value of at least 32 characters. Keep `SESSION_SECRET` unchanged while encrypted customer data depends on it. Never commit populated credentials.

Run `npm run db:push` to apply the versioned SQL files in `db/migrations/` to the configured development database. The command records checksums, serializes concurrent runs, and refuses to run with `NODE_ENV=production`; production schema changes for Replit-managed PostgreSQL go through Publish.

The PostgreSQL backend stores customer accounts and sessions, deposit/withdrawal requests, ledger entries, site settings, notifications, and the market catalog. Market catalog changes made by an administrator are saved to PostgreSQL. The market's example prices and charts are illustrative, not live quotes; the Pasar pages do not execute broker orders.

Although account and financial-request data is persisted, the app is not connected to a verified identity, payment settlement, bank, or brokerage provider. Do not use it to hold real funds or represent example balances or prices as verified financial information. `/api/health` checks database connectivity.

## Production build

```sh
npm run build
npm run start
```

## Run the checks

```sh
npm run test:all
```

This runs linting, TypeScript checks, unit tests, then a production-build browser smoke test for every file-based route and several key interactions. To skip market page checks, run `E2E_SKIP_MARKET=1 npm run test:all`. The browser test uses `/repl/tools/bin/chromium` on Replit; elsewhere, install Chromium with `npx playwright install chromium`.

## Deploy to a public VPS

The repository includes sample systemd and Caddy configuration in `deploy/vps/`. A typical setup is:

1. Use a Linux VPS with Node.js 20.19 or newer, npm, and PostgreSQL. Point your domain's DNS records to the server and allow inbound ports 80 and 443.
2. Install the project in `/opt/hsb-trading`, then run `npm ci` and `npm run build`.
3. Create `/etc/hsb-trading/hsb-trading.env` with `DATABASE_URL`, `ADMIN_EMAIL` and/or `ADMIN_PHONE`, a unique `ADMIN_PASSWORD` of at least 16 characters, and a random `SESSION_SECRET` of at least 32 characters. Keep this file outside the repository and restrict it to the service account. If the admin credentials are absent or too short, admin routes stay disabled. `ADMIN_NUMBER` and `ADMIN_USERNAME` remain supported for older setups.
4. Copy `deploy/vps/hsb-trading.service.example` to `/etc/systemd/system/hsb-trading.service`. Update the service user and paths to match the VPS, then enable and start it with systemd.
5. Configure Caddy with `deploy/vps/Caddyfile.example`, replacing `your-domain.example` with the domain. Caddy terminates HTTPS and forwards traffic to Express on port 5000.
6. Check `https://your-domain.example/api/health`; it should report `"database":"connected"`.

These are deployment instructions and sample configuration only; the app has not been installed on an external VPS or connected to a public domain.

## Deploy on Rocky Linux with PM2 and Nginx

The sample files are `deploy/pm2/ecosystem.config.cjs` and `deploy/nginx/webullxau.com.conf.example`. They run the production Express server on `127.0.0.1:5000` behind Nginx. Use Node.js 20.19 or newer and make sure PostgreSQL is running and the `HSB` database exists.

1. On the server, clone the repository, enter its directory, then run `npm ci --registry=https://registry.npmjs.org/` and `npm run build`.
2. Create a private `.env` file in the project root (it is ignored by Git), with `DATABASE_URL`, `ADMIN_EMAIL` and/or `ADMIN_PHONE`, `ADMIN_PASSWORD` (at least 16 characters), and a random `SESSION_SECRET` (at least 32 characters). Keep your current `SESSION_SECRET` unchanged if existing encrypted records must remain readable. Use your own values; do not commit them or put them in `.env.example`. Either email or phone can be used as the HTTP Basic Auth username for `/admin`. `ADMIN_NUMBER` and `ADMIN_USERNAME` remain supported for older setups.
3. Install PM2 globally with `npm install -g pm2`, then run `pm2 start deploy/pm2/ecosystem.config.cjs --env production`, `pm2 save`, and `pm2 startup`. Run the startup command PM2 prints so the process returns after a reboot.
4. Copy the Nginx example to `/etc/nginx/conf.d/webullxau.com.conf`, test it with `sudo nginx -t`, and reload Nginx. Point the domain's DNS A record to the server and allow inbound ports 80 and 443.
5. Install Certbot for Rocky Linux and run `sudo certbot --nginx -d webullxau.com` to enable HTTPS. Use HTTPS before entering admin credentials; HTTP Basic Auth must not be exposed over plain HTTP.
6. Check `https://webullxau.com/api/health`; it should report `"database":"connected"`. If it reports `disconnected`, verify that PostgreSQL is running and `DATABASE_URL` points to an existing database with valid credentials.

The `/admin` protection is HTTP Basic Auth, not a full user/session system. Admin routes require configured credentials in both development and production; production access must use HTTPS. Trading, deposits, withdrawals, and account flows remain demos and must not be used for real funds or customer financial data.

## Current demo limits

Login, registration, deposit, withdrawal, and trading/account data are still demo flows. The smoke test verifies their current interface behavior, not real identity checks or financial transactions. Do not use them for live trading or real customer data. Production `/admin` pages require HTTP Basic Auth credentials; keep HTTPS enabled and never reuse the database password.
