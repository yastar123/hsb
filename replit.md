# Running this app on Replit

- Frontend: React + TypeScript, built with Vite and TanStack Router.
- Backend: Express, serving the frontend and the `/api` routes from one process.
- Database: PostgreSQL through the `DATABASE_URL` environment variable.

## Start the app

Run `npm run dev`. The server listens on `0.0.0.0:5000`, which is the Replit web preview port. Vite serves the React app through Express during development. Use Node.js 20.19 or newer with npm.

## Check the database

Open `/api/health`. A successful response includes `"database":"connected"`. Replit provides `DATABASE_URL` for the project PostgreSQL database; do not copy the credential into source files.

For local development, copy `.env.example` to `.env` and enter a PostgreSQL connection string there. `.env` is ignored by Git.

Install the locked dependencies with `npm ci --registry=https://registry.npmjs.org/`, then apply development schema migrations with `npm run db:push`. The migration command applies versioned SQL files in `db/migrations/` and refuses to run with `NODE_ENV=production`. Replit-managed production schema changes are applied through Publish.

## Build and run production mode

Run `npm run build`, then `npm run start`. The Express server serves the compiled React app from `dist`.

Customer accounts and sessions, financial requests and ledger entries, site content, notifications, and the market catalog persist in PostgreSQL. Admin edits to the market catalog are saved from `/admin/pasar`. Market prices and charts are illustrative only; the Pasar pages do not place or execute broker orders.

Account and financial-request routes are not connected to verified identity, payment settlement, banking, or brokerage providers. Do not use the application to hold real funds or treat example balances and prices as verified financial information.

## Test the project

Run `npm run test:all` to lint the changed runtime files, type-check, run unit tests, and exercise every file-based page plus key interactions against a production build. On Replit the browser test uses `/repl/tools/bin/chromium`. On another machine, install Chromium with `npx playwright install chromium`.

## VPS deployment

See `deploy/vps/` for systemd/Caddy examples and `deploy/pm2/` plus `deploy/nginx/` for the PM2/Nginx setup for `webullxau.com`. Set `DATABASE_URL`, `ADMIN_NUMBER` (or `ADMIN_USERNAME`), and a strong, unique `ADMIN_PASSWORD` in a protected `.env` file on the VPS. Build with `npm run build` and use HTTPS before entering admin credentials. The production `/admin` routes return 503 until admin credentials are configured and require HTTP Basic Auth afterwards. The VPS needs Node.js 20.19 or newer, PostgreSQL access, and public DNS/firewall configuration for HTTPS. Never commit real credentials.
