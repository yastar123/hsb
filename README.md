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
