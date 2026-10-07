import { hasConfiguredAdminCredentials, verifyAdminCredentials } from "./auth.js";

export const ROLES = Object.freeze({
  ADMIN: "admin",
  CUSTOMER: "customer",
});

const ADMIN_FAILURE_LIMIT = 8;
const ADMIN_FAILURE_WINDOW_MS = 15 * 60 * 1000;
const ADMIN_FAILURE_MAX_CLIENTS = 5_000;
const adminFailures = new Map();

export function requireRole(...allowedRoles) {
  return (request, response, next) => {
    if (!request.auth) {
      return response.status(401).json({ error: "Autentikasi diperlukan." });
    }
    if (!allowedRoles.includes(request.auth.role)) {
      return response.status(403).json({ error: "Anda tidak memiliki izin untuk tindakan ini." });
    }
    return next();
  };
}

function failureKey(request) {
  return String(request.ip || request.socket?.remoteAddress || "unknown");
}

function recordAdminFailure(key, now) {
  const current = adminFailures.get(key);
  if (!current || current.until <= now) {
    if (!adminFailures.has(key) && adminFailures.size >= ADMIN_FAILURE_MAX_CLIENTS) {
      const oldestKey = adminFailures.keys().next().value;
      if (oldestKey) adminFailures.delete(oldestKey);
    }
    adminFailures.set(key, { count: 1, until: now + ADMIN_FAILURE_WINDOW_MS });
    return;
  }
  current.count += 1;
}

export function requireAdminAuthentication(request, response, next) {
  response.setHeader("Cache-Control", "no-store");

  if (!hasConfiguredAdminCredentials()) {
    return response
      .status(503)
      .type("text")
      .send(
        "Admin access is disabled until a valid identifier and a password of at least 16 characters are configured.",
      );
  }

  const key = failureKey(request);
  const now = Date.now();
  const failures = adminFailures.get(key);
  if (failures && failures.until <= now) adminFailures.delete(key);
  if (failures && failures.until > now && failures.count >= ADMIN_FAILURE_LIMIT) {
    response.setHeader("Retry-After", String(Math.ceil((failures.until - now) / 1000)));
    return response
      .status(429)
      .json({ error: "Terlalu banyak percobaan masuk admin. Coba lagi nanti." });
  }

  const authorization = request.get("authorization") ?? "";
  const [scheme, encodedCredentials = ""] = authorization.split(" ", 2);
  if (scheme?.toLowerCase() === "basic") {
    try {
      const credentials = Buffer.from(encodedCredentials, "base64").toString("utf8");
      const separator = credentials.indexOf(":");
      if (separator >= 0) {
        const suppliedUsername = credentials.slice(0, separator);
        const suppliedPassword = credentials.slice(separator + 1);
        if (verifyAdminCredentials(suppliedUsername, suppliedPassword)) {
          adminFailures.delete(key);
          request.adminName = suppliedUsername;
          request.auth = { role: ROLES.ADMIN, subject: suppliedUsername };
          return next();
        }
      }
    } catch {
      // Treat malformed Basic credentials like any other failed attempt.
    }
  }

  recordAdminFailure(key, now);
  response.setHeader("WWW-Authenticate", 'Basic realm="HSB Admin", charset="UTF-8"');
  return response.status(401).json({ error: "Autentikasi admin tidak valid." });
}
