# Running this app on Replit

- Frontend: React + TypeScript, built with Vite and TanStack Router.
- Backend: Express, serving the frontend and the `/api` routes from one process.
- Database: PostgreSQL through the `DATABASE_URL` environment variable.

## Start the app

Run `bun run dev`. The server listens on `0.0.0.0:5000`, which is the Replit web preview port. Vite serves the React app through Express during development.

## Check the database

Open `/api/health`. A successful response includes `"database":"connected"`. Replit provides `DATABASE_URL` for the project PostgreSQL database; do not copy the credential into source files.

For local development, copy `.env.example` to `.env` and enter a PostgreSQL connection string there. `.env` is ignored by Git.

Apply development schema migrations with `bun run db:push`. It applies the versioned SQL files in `db/migrations/` and refuses to run with `NODE_ENV=production`. Replit-managed production schema changes are applied through Publish. The initial tables are for non-sensitive settings and simulated demo data only; the app's current screens still store their data in browser storage.

## Build and run production mode

Run `bun run build`, then `bun run start`. The Express server serves the compiled React app from `dist`.

Existing demo content and account flows still persist in browser storage. They have not been migrated to PostgreSQL because their data model and access controls need to be defined before storing shared user or trading data.

## Test the project

Run `bun run test:all` to lint the changed runtime files, type-check, run unit tests, and exercise every file-based page plus key interactions against a production build. On Replit the browser test uses `/repl/tools/bin/chromium`. On another machine, install Chromium with `bunx playwright install chromium`.

## VPS deployment

See `deploy/vps/` for sample systemd and Caddy configuration. Set `DATABASE_URL`, `ADMIN_USERNAME`, and a strong, unique `ADMIN_PASSWORD` in a protected environment file on the VPS, build with `bun run build`, and run the Express service behind Caddy or another HTTPS reverse proxy. The production `/admin` routes return 503 until admin credentials are configured and require HTTP Basic Auth afterwards. The VPS needs Node.js 20.19 or newer, PostgreSQL access, and public DNS/firewall configuration for HTTPS.
