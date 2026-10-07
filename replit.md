# Running this app on Replit

- Frontend: React + TypeScript, built with Vite and TanStack Router.
- Backend: Express, serving the frontend and the `/api` routes from one process.
- Database: PostgreSQL through the `DATABASE_URL` environment variable.

## Start the app

Run `bun run dev`. The server listens on `0.0.0.0:5000`, which is the Replit web preview port. Vite serves the React app through Express during development.

## Check the database

Open `/api/health`. A successful response includes `"database":"connected"`. Replit provides `DATABASE_URL` for the project PostgreSQL database; do not copy the credential into source files.

For local development, copy `.env.example` to `.env` and enter a PostgreSQL connection string there. `.env` is ignored by Git.

## Build and run production mode

Run `bun run build`, then `bun run start`. The Express server serves the compiled React app from `dist`.

Existing demo content and account flows still persist in browser storage. They have not been migrated to PostgreSQL because their data model and access controls need to be defined before storing shared user or trading data.
