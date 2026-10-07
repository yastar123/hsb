import "dotenv/config";

import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDirectory = path.join(projectRoot, "db", "migrations");
const migrationNamePattern = /^\d{4}_[a-z0-9_]+\.sql$/;
const advisoryLockId = 917304621;

async function readMigrations() {
  const names = (await readdir(migrationsDirectory)).filter((name) => name.endsWith(".sql")).sort();
  const invalidName = names.find((name) => !migrationNamePattern.test(name));
  if (invalidName) {
    throw new Error(`Invalid migration filename "${invalidName}". Use NNNN_lowercase_name.sql.`);
  }

  return Promise.all(
    names.map(async (name) => {
      const sql = await readFile(path.join(migrationsDirectory, name), "utf8");
      if (!sql.trim()) throw new Error(`Migration "${name}" is empty.`);
      return {
        name,
        sql,
        checksum: createHash("sha256").update(sql).digest("hex"),
      };
    }),
  );
}

async function applyMigrations() {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "db:push is development-only; production schema changes use the Replit Publish flow.",
    );
  }

  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to apply database migrations.");
  }

  const migrations = await readMigrations();
  const client = new Client({ connectionString });
  let lockAcquired = false;

  try {
    await client.connect();
    await client.query("SELECT pg_advisory_lock($1)", [advisoryLockId]);
    lockAcquired = true;

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
        migration_name text PRIMARY KEY,
        checksum char(64) NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const appliedResult = await client.query(
      "SELECT migration_name, checksum FROM public.schema_migrations ORDER BY migration_name",
    );
    const applied = new Map(
      appliedResult.rows.map((row) => [row.migration_name, row.checksum.trim()]),
    );
    let appliedCount = 0;

    for (const migration of migrations) {
      const previousChecksum = applied.get(migration.name);
      if (previousChecksum) {
        if (previousChecksum !== migration.checksum) {
          throw new Error(
            `Migration "${migration.name}" changed after it was applied. Add a new migration instead.`,
          );
        }
        continue;
      }

      await client.query("BEGIN");
      try {
        await client.query(migration.sql);
        await client.query(
          "INSERT INTO public.schema_migrations (migration_name, checksum) VALUES ($1, $2)",
          [migration.name, migration.checksum],
        );
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }

      appliedCount += 1;
      console.log(`Applied ${migration.name}`);
    }

    console.log(
      appliedCount === 0
        ? "Database schema is up to date; no migrations to apply."
        : `Applied ${appliedCount} migration${appliedCount === 1 ? "" : "s"}.`,
    );
  } finally {
    if (lockAcquired) {
      await client.query("SELECT pg_advisory_unlock($1)", [advisoryLockId]).catch(() => {});
    }
    await client.end();
  }
}

applyMigrations().catch((error) => {
  console.error(
    `Database push failed: ${error instanceof Error ? error.message : "Unknown error"}`,
  );
  process.exitCode = 1;
});
