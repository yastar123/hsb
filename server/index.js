import "dotenv/config";

import express from "express";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { createServer as createViteServer } from "vite";
import { hasConfiguredAdminCredentials, verifyAdminCredentials } from "./auth.js";
import { createApiRouter } from "./api.js";

const { Pool } = pg;
const app = express();
const httpServer = createServer(app);
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT) || 5000;
const databaseUrl = process.env.DATABASE_URL?.trim();
const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;

app.disable("x-powered-by");
app.set(
  "trust proxy",
  process.env.NODE_ENV === "production" || process.env.REPLIT_DEV_DOMAIN ? 1 : false,
);
app.use(express.json({ limit: "3mb" }));

app.get("/api/health", async (_request, response) => {
  if (!pool) {
    return response.status(503).json({ status: "error", database: "unconfigured" });
  }

  try {
    await pool.query("SELECT 1");
    return response.json({ status: "ok", database: "connected" });
  } catch {
    console.error("PostgreSQL health check failed.");
    return response.status(503).json({ status: "error", database: "disconnected" });
  }
});

app.use("/api", createApiRouter(pool));

app.use("/api", (_request, response) => {
  response.status(404).json({ error: "API route not found" });
});

app.use((request, response, next) => {
  if (process.env.NODE_ENV !== "production" || !/^\/admin(?:\/|$)/i.test(request.path)) {
    return next();
  }

  response.setHeader("Cache-Control", "no-store");

  if (!hasConfiguredAdminCredentials()) {
    return response
      .status(503)
      .type("text")
      .send("Admin access is disabled until credentials are configured.");
  }

  const authorization = request.get("authorization") ?? "";
  const [scheme, encodedCredentials = ""] = authorization.split(" ", 2);
  if (scheme?.toLowerCase() === "basic") {
    const credentials = Buffer.from(encodedCredentials, "base64").toString("utf8");
    const separator = credentials.indexOf(":");
    if (separator >= 0) {
      const suppliedUsername = Buffer.from(credentials.slice(0, separator));
      const suppliedPassword = Buffer.from(credentials.slice(separator + 1));
      if (verifyAdminCredentials(suppliedUsername.toString(), suppliedPassword.toString())) {
        return next();
      }
    }
  }

  response.setHeader("WWW-Authenticate", 'Basic realm="HSB Admin", charset="UTF-8"');
  return response.status(401).type("text").send("Authentication required.");
});

if (process.env.NODE_ENV === "production") {
  const buildDirectory = path.join(projectRoot, "dist");
  app.use(express.static(buildDirectory, { index: false }));
  app.use((request, response, next) => {
    if (request.method !== "GET") return next();
    response.sendFile(path.join(buildDirectory, "index.html"), (error) => {
      if (error) next(error);
    });
  });
} else {
  const vite = await createViteServer({
    appType: "custom",
    configFile: path.join(projectRoot, "vite.config.ts"),
    root: projectRoot,
    server: {
      middlewareMode: true,
      ws: { server: httpServer },
    },
  });

  app.use(vite.middlewares);
  app.use(async (request, response, next) => {
    if (request.method !== "GET") return next();

    try {
      const template = await readFile(path.join(projectRoot, "index.html"), "utf8");
      const html = await vite.transformIndexHtml(request.originalUrl, template);
      response.status(200).type("html").send(html);
    } catch (error) {
      vite.ssrFixStacktrace(error);
      next(error);
    }
  });
}

app.use((error, _request, response, _next) => {
  console.error("Request failed.");
  if (response.headersSent) return;
  response.status(500).send("Internal server error");
});

const server = httpServer.listen(port, "0.0.0.0", () => {
  console.log(`HSB Trading is listening on port ${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(() => {
      void pool?.end();
    });
  });
}
