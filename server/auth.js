import {
  createCipheriv,
  createDecipheriv,
  createHash,
  hkdfSync,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const PASSWORD_COST = 32768;
const PASSWORD_BLOCK_SIZE = 8;
const PASSWORD_PARALLELISM = 1;
const PASSWORD_KEY_LENGTH = 64;
const PASSWORD_MAX_MEMORY = 64 * 1024 * 1024;
const SESSION_DAYS = 7;

export class ConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ConfigurationError";
  }
}

export function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function normalizeIndonesianPhone(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return "";
  if (digits.startsWith("62")) return `+${digits}`;
  if (digits.startsWith("0")) return `+62${digits.slice(1)}`;
  return `+62${digits}`;
}

export function validPassword(value) {
  return typeof value === "string" &&
    value.length >= 12 &&
    value.length <= 128 &&
    /\d/.test(value) &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /[^A-Za-z0-9\s]/.test(value) &&
    !/\s/.test(value);
}

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, PASSWORD_KEY_LENGTH, {
    N: PASSWORD_COST,
    r: PASSWORD_BLOCK_SIZE,
    p: PASSWORD_PARALLELISM,
    maxmem: PASSWORD_MAX_MEMORY,
  });
  return `scrypt$${PASSWORD_COST}$${PASSWORD_BLOCK_SIZE}$${PASSWORD_PARALLELISM}$${salt.toString("base64url")}$${Buffer.from(hash).toString("base64url")}`;
}

export async function verifyPassword(password, encoded) {
  const parts = String(encoded ?? "").split("$");
  if (
    parts.length !== 6 ||
    parts[0] !== "scrypt" ||
    Number(parts[1]) !== PASSWORD_COST ||
    Number(parts[2]) !== PASSWORD_BLOCK_SIZE ||
    Number(parts[3]) !== PASSWORD_PARALLELISM
  ) {
    await scrypt(password, Buffer.alloc(16), PASSWORD_KEY_LENGTH, {
      N: PASSWORD_COST,
      r: PASSWORD_BLOCK_SIZE,
      p: PASSWORD_PARALLELISM,
      maxmem: PASSWORD_MAX_MEMORY,
    });
    return false;
  }
  try {
    const salt = Buffer.from(parts[4], "base64url");
    const expected = Buffer.from(parts[5], "base64url");
    if (salt.length !== 16 || expected.length !== PASSWORD_KEY_LENGTH) return false;
    const actual = Buffer.from(await scrypt(password, salt, PASSWORD_KEY_LENGTH, {
      N: PASSWORD_COST,
      r: PASSWORD_BLOCK_SIZE,
      p: PASSWORD_PARALLELISM,
      maxmem: PASSWORD_MAX_MEMORY,
    }));
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function privateDataKey() {
  const secret = process.env.SESSION_SECRET;
  if (typeof secret !== "string" || secret.length < 32) {
    throw new ConfigurationError("SESSION_SECRET must contain at least 32 characters.");
  }
  return Buffer.from(hkdfSync(
    "sha256",
    Buffer.from(secret, "utf8"),
    Buffer.from("hsb-private-data-v1", "utf8"),
    Buffer.from("bank-details-and-payment-proofs", "utf8"),
    32,
  ));
}

export function encryptPrivate(value) {
  if (typeof value !== "string" || !value.length) {
    throw new TypeError("Sensitive data must be a non-empty string.");
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", privateDataKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptPrivate(value) {
  if (typeof value !== "string" || !value.startsWith("v1.")) {
    throw new Error("Unsupported encrypted-data format.");
  }
  const [, encodedIv, encodedTag, encodedCiphertext] = value.split(".");
  const iv = Buffer.from(encodedIv ?? "", "base64url");
  const tag = Buffer.from(encodedTag ?? "", "base64url");
  const ciphertext = Buffer.from(encodedCiphertext ?? "", "base64url");
  if (iv.length !== 12 || tag.length !== 16 || ciphertext.length === 0) {
    throw new Error("Invalid encrypted-data format.");
  }
  const decipher = createDecipheriv("aes-256-gcm", privateDataKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

export function newSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export function sessionExpiry() {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
}

export function sessionCookie(token) {
  const name = process.env.NODE_ENV === "production" ? "__Host-hsb_session" : "hsb_session";
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${name}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 24 * 60 * 60}${secure}`;
}

export function clearSessionCookie() {
  const name = process.env.NODE_ENV === "production" ? "__Host-hsb_session" : "hsb_session";
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export function readSessionToken(request) {
  const name = process.env.NODE_ENV === "production" ? "__Host-hsb_session" : "hsb_session";
  const cookie = request.headers.cookie ?? "";
  for (const item of cookie.split(";")) {
    const [key, ...valueParts] = item.trim().split("=");
    if (key !== name) continue;
    try {
      return decodeURIComponent(valueParts.join("="));
    } catch {
      return "";
    }
  }
  return "";
}

export function timingSafeTextEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string") return false;
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function validEmail(value) {
  return typeof value === "string" &&
    value.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function adminIdentifiers() {
  const identifiers = new Set();
  const addPhone = (value) => {
    const raw = value?.trim();
    if (!raw) return;
    identifiers.add(normalizeIndonesianPhone(raw) || raw);
  };

  const email = process.env.ADMIN_EMAIL?.trim();
  if (email && validEmail(normalizeEmail(email))) identifiers.add(normalizeEmail(email));
  addPhone(process.env.ADMIN_PHONE);
  addPhone(process.env.ADMIN_NUMBER);

  const username = process.env.ADMIN_USERNAME?.trim();
  if (username) identifiers.add(username);
  return [...identifiers];
}

export function hasConfiguredAdminCredentials() {
  const password = process.env.ADMIN_PASSWORD;
  return adminIdentifiers().length > 0 &&
    typeof password === "string" &&
    password.length >= 16 &&
    password.length <= 128;
}

export function verifyAdminCredentials(identity, password) {
  if (!hasConfiguredAdminCredentials()) return false;
  const configuredPassword = process.env.ADMIN_PASSWORD;

  const rawIdentity = String(identity ?? "").trim();
  const candidates = new Set([
    rawIdentity,
    normalizeEmail(rawIdentity),
    normalizeIndonesianPhone(rawIdentity),
  ].filter(Boolean));
  let identityMatches = false;
  for (const expected of adminIdentifiers()) {
    for (const candidate of candidates) {
      identityMatches = timingSafeTextEqual(candidate, expected) || identityMatches;
    }
  }
  const passwordMatches = timingSafeTextEqual(String(password ?? ""), configuredPassword);
  return identityMatches && passwordMatches;
}

let adminDbPool = null;

export function setAdminDbPool(pool) {
  adminDbPool = pool;
}

export function getPrimaryAdminEmail() {
  return process.env.ADMIN_EMAIL?.trim() || "admin@webullxau.com";
}

const activeAdminSessions = new Map();

export async function createAdminSession(adminName, pool = adminDbPool) {
  const token = newSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = sessionExpiry();
  const sessionData = {
    adminName: adminName || "Administrator",
    expiresAt: expiresAt.toISOString(),
  };
  activeAdminSessions.set(tokenHash, sessionData);

  const targetPool = pool || adminDbPool;
  if (targetPool) {
    try {
      await targetPool.query(
        `INSERT INTO public.app_settings (setting_key, value, updated_at)
         VALUES ($1, $2, now())
         ON CONFLICT (setting_key) DO UPDATE SET value = $2, updated_at = now()`,
        [`admin-session:${tokenHash}`, JSON.stringify(sessionData)],
      );
    } catch {
      // In-memory fallback
    }
  }

  return { token, expiresAt, tokenHash };
}

export async function verifyAdminSession(token, pool = adminDbPool) {
  if (!token || typeof token !== "string") return null;
  const tokenHash = hashSessionToken(token);
  const now = new Date();

  const mem = activeAdminSessions.get(tokenHash);
  if (mem) {
    if (new Date(mem.expiresAt) > now) {
      return mem;
    }
    activeAdminSessions.delete(tokenHash);
  }

  const targetPool = pool || adminDbPool;
  if (targetPool) {
    try {
      const res = await targetPool.query(
        "SELECT value FROM public.app_settings WHERE setting_key = $1",
        [`admin-session:${tokenHash}`],
      );
      if (res.rowCount) {
        const raw = res.rows[0].value;
        const data = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (new Date(data.expiresAt) > now) {
          activeAdminSessions.set(tokenHash, data);
          return data;
        } else {
          await targetPool
            .query("DELETE FROM public.app_settings WHERE setting_key = $1", [`admin-session:${tokenHash}`])
            .catch(() => {});
        }
      }
    } catch {
      // Ignore
    }
  }

  return null;
}

export async function destroyAdminSession(token, pool = adminDbPool) {
  if (!token || typeof token !== "string") return;
  const tokenHash = hashSessionToken(token);
  activeAdminSessions.delete(tokenHash);
  const targetPool = pool || adminDbPool;
  if (targetPool) {
    try {
      await targetPool
        .query("DELETE FROM public.app_settings WHERE setting_key = $1", [`admin-session:${tokenHash}`])
        .catch(() => {});
    } catch {
      // Ignore
    }
  }
}
