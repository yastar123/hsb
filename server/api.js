import express from "express";
import { timingSafeTextEqual } from "./auth.js";
import {
  clearSessionCookie,
  ConfigurationError,
  decryptPrivate,
  encryptPrivate,
  hashPassword,
  hashSessionToken,
  newSessionToken,
  normalizeEmail,
  normalizeIndonesianPhone,
  readSessionToken,
  sessionCookie,
  sessionExpiry,
  validEmail,
  validPassword,
  verifyPassword,
} from "./auth.js";

const MAX_MONEY = 1_000_000_000;
const BUSINESS_TIME_ZONE = "Asia/Jakarta";
const rateBuckets = new Map();

function asyncRoute(handler) {
  return (request, response, next) => Promise.resolve(handler(request, response, next)).catch(next);
}

function money(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0 || numeric > MAX_MONEY) return 0;
  return Math.round(numeric * 100) / 100;
}

function businessDate(value = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function addDate(date, days) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function apiError(response, status, message) {
  return response.status(status).json({ error: message });
}

function rateLimit(bucketName, limit = 12, windowMs = 15 * 60 * 1000) {
  return (request, response, next) => {
    const key = `${bucketName}:${request.ip || request.socket.remoteAddress || "unknown"}`;
    const now = Date.now();
    const current = rateBuckets.get(key);
    if (!current || current.until <= now) {
      rateBuckets.set(key, { count: 1, until: now + windowMs });
      return next();
    }
    current.count += 1;
    if (current.count <= limit) return next();
    response.setHeader("Retry-After", String(Math.ceil((current.until - now) / 1000)));
    return apiError(response, 429, "Terlalu banyak percobaan. Coba lagi beberapa menit.");
  };
}

function requireSameOrigin(request, response, next) {
  const origin = request.get("origin");
  if (!origin) return apiError(response, 403, "Permintaan lintas situs tidak diizinkan.");
  try {
    const parsed = new URL(origin);
    const expectedProtocol = process.env.NODE_ENV === "production" ? "https:" : request.protocol + ":";
    if (parsed.host !== request.get("host") || parsed.protocol !== expectedProtocol) {
      return apiError(response, 403, "Asal permintaan tidak sesuai.");
    }
  } catch {
    return apiError(response, 403, "Asal permintaan tidak valid.");
  }
  return next();
}

function requireDatabase(pool) {
  return (_request, response, next) => {
    if (!pool) return apiError(response, 503, "Database belum dikonfigurasi.");
    return next();
  };
}

function adminAuth(request, response, next) {
  if (process.env.NODE_ENV !== "production") {
    request.adminName = "development-admin";
    return next();
  }

  const username = process.env.ADMIN_USERNAME?.trim() || process.env.ADMIN_NUMBER?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) {
    return apiError(response, 503, "Akses admin belum dikonfigurasi.");
  }

  const authorization = request.get("authorization") ?? "";
  const [scheme, encoded = ""] = authorization.split(" ", 2);
  if (scheme?.toLowerCase() !== "basic") {
    response.setHeader("WWW-Authenticate", 'Basic realm="HSB Admin", charset="UTF-8"');
    return apiError(response, 401, "Autentikasi admin diperlukan.");
  }
  try {
    const decoded = Buffer.from(encoded, "base64").toString("utf8");
    const separator = decoded.indexOf(":");
    if (separator < 0) throw new Error("Invalid basic auth.");
    const suppliedUser = decoded.slice(0, separator);
    const suppliedPassword = decoded.slice(separator + 1);
    if (!timingSafeTextEqual(suppliedUser, username) || !timingSafeTextEqual(suppliedPassword, password)) {
      response.setHeader("WWW-Authenticate", 'Basic realm="HSB Admin", charset="UTF-8"');
      return apiError(response, 401, "Autentikasi admin tidak valid.");
    }
    request.adminName = username;
    return next();
  } catch {
    response.setHeader("WWW-Authenticate", 'Basic realm="HSB Admin", charset="UTF-8"');
    return apiError(response, 401, "Autentikasi admin tidak valid.");
  }
}

async function issueSession(pool, response, userId) {
  const token = newSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = sessionExpiry();
  await pool.query("DELETE FROM public.customer_sessions WHERE expires_at <= now()");
  await pool.query(
    `INSERT INTO public.customer_sessions (token_hash, user_id, expires_at)
     VALUES ($1, $2, $3)`,
    [tokenHash, userId, expiresAt],
  );
  response.setHeader("Set-Cookie", sessionCookie(token));
}

function requireCustomer(pool) {
  return asyncRoute(async (request, response, next) => {
    const token = readSessionToken(request);
    if (!token || !pool) return apiError(response, 401, "Silakan masuk untuk melanjutkan.");
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.status, u.created_at
       FROM public.customer_sessions s
       JOIN public.customer_users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.expires_at > now()`,
      [hashSessionToken(token)],
    );
    if (!result.rowCount) {
      response.setHeader("Set-Cookie", clearSessionCookie());
      return apiError(response, 401, "Sesi berakhir. Silakan masuk kembali.");
    }
    request.customer = result.rows[0];
    return next();
  });
}

function serializeUser(row, globalRate = 0) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    joined: businessDate(new Date(row.created_at)),
    balance: Number(row.main_balance ?? 0),
    deposit: Number(row.deposit_balance ?? 0),
    profit: Number(row.total_accrual ?? 0),
    dailyProfit: Number(row.daily_accrual ?? 0),
    dailyProfitDate: row.daily_accrual_date ? String(row.daily_accrual_date).slice(0, 10) : "",
    lastCompound: row.last_compound_date ? String(row.last_compound_date).slice(0, 10) : "",
    rate: row.daily_rate_override === null || row.daily_rate_override === undefined
      ? null
      : Number(row.daily_rate_override),
    status: row.status,
    effectiveRate: row.daily_rate_override === null || row.daily_rate_override === undefined
      ? globalRate
      : Number(row.daily_rate_override),
  };
}

function serializeDeposit(row, includeProof = false) {
  return {
    id: row.id,
    userId: row.user_id,
    name: decryptPrivate(row.sender_name_ciphertext),
    email: row.email,
    bankName: decryptPrivate(row.sender_bank_ciphertext),
    accountNumber: decryptPrivate(row.sender_account_ciphertext),
    transferredAmountIdr: Number(row.sender_amount_idr),
    destinationAccountId: row.destination_account_id,
    method: row.method,
    amount: Number(row.amount),
    status: row.status,
    note: row.note ?? "",
    date: row.created_at.toISOString(),
    proofAvailable: Boolean(row.proof_ciphertext),
    ...(includeProof && row.proof_ciphertext
      ? { proof: decryptPrivate(row.proof_ciphertext) }
      : {}),
  };
}

function serializeWithdrawal(row) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    bank: decryptPrivate(row.bank_ciphertext),
    account: decryptPrivate(row.account_ciphertext),
    amount: Number(row.amount),
    status: row.status,
    note: row.note ?? "",
    date: row.created_at.toISOString(),
  };
}

async function getCompoundSettings(pool) {
  const result = await pool.query(
    `SELECT global_rate_percent, enabled
     FROM public.customer_compound_settings WHERE singleton = true`,
  );
  const row = result.rows[0] ?? { global_rate_percent: 0, enabled: false };
  return { globalRate: Number(row.global_rate_percent), enabled: Boolean(row.enabled) };
}

async function getSiteSettings(pool) {
  const result = await pool.query(
    `SELECT setting_key, setting_value
     FROM public.customer_site_settings
     WHERE setting_key IN ('depositContent', 'bankAccounts')`,
  );
  const values = Object.fromEntries(result.rows.map((row) => [row.setting_key, row.setting_value]));
  return {
    depositContent: values.depositContent ?? null,
    bankAccounts: Array.isArray(values.bankAccounts) ? values.bankAccounts : [],
  };
}

async function addAudit(pool, adminName, action, targetType, targetId, details = {}) {
  await pool.query(
    `INSERT INTO public.customer_admin_audit
       (admin_name, action, target_type, target_id, details)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [adminName, action, targetType, String(targetId), JSON.stringify(details)],
  );
}

async function runDueCompounding(pool) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const settingResult = await client.query(
      `SELECT global_rate_percent, enabled
       FROM public.customer_compound_settings
       WHERE singleton = true
       FOR UPDATE`,
    );
    const settings = settingResult.rows[0] ?? { global_rate_percent: 0, enabled: false };
    const today = businessDate();
    const accounts = await client.query(
      `SELECT u.id, u.created_at, u.status, u.daily_rate_override,
              a.main_balance, a.total_accrual, a.last_compound_date
       FROM public.customer_users u
       JOIN public.customer_accounts a ON a.user_id = u.id
       ORDER BY u.created_at
       FOR UPDATE OF a`,
    );
    let applied = 0;
    for (const account of accounts.rows) {
      let nextDate = account.last_compound_date
        ? addDate(String(account.last_compound_date).slice(0, 10), 1)
        : businessDate(new Date(account.created_at));
      if (nextDate > today) nextDate = today;
      let balance = Number(account.main_balance);
      let totalAccrual = Number(account.total_accrual);
      let todaysAccrual = 0;
      let lastAccrualDate = null;
      let processedThrough = account.last_compound_date
        ? String(account.last_compound_date).slice(0, 10)
        : null;
      const originalProcessedThrough = processedThrough;
      let dayCount = 0;
      while (nextDate <= today && dayCount < 366) {
        dayCount += 1;
        const rate = account.daily_rate_override === null
          ? Number(settings.global_rate_percent)
          : Number(account.daily_rate_override);
        let accrual = 0;
        if (settings.enabled && account.status === "Aktif" && rate > 0 && balance > 0) {
          accrual = Math.round(balance * rate) / 100;
          accrual = Math.round(accrual * 100) / 100;
        }
        if (accrual > 0) {
          const insert = await client.query(
            `INSERT INTO public.customer_daily_accruals
               (user_id, accrual_date, rate_percent, amount, balance_after)
             VALUES ($1, $2::date, $3, $4, $5)
             ON CONFLICT (user_id, accrual_date) DO NOTHING
             RETURNING id`,
            [account.id, nextDate, rate, accrual, balance + accrual],
          );
          if (insert.rowCount) {
            balance = Math.round((balance + accrual) * 100) / 100;
            totalAccrual = Math.round((totalAccrual + accrual) * 100) / 100;
            await client.query(
              `INSERT INTO public.customer_ledger_entries
                 (user_id, entry_type, bucket, amount, balance_after, source_type, source_id, details)
               VALUES ($1, 'admin_rate_accrual', 'main', $2, $3, 'daily_accrual', $4, $5::jsonb)
               ON CONFLICT (entry_type, source_type, source_id) DO NOTHING`,
              [account.id, accrual, balance, `${account.id}:${nextDate}`, JSON.stringify({ ratePercent: rate, date: nextDate })],
            );
            applied += 1;
          }
          if (nextDate === today) {
            todaysAccrual = accrual;
            lastAccrualDate = nextDate;
          }
        }
        processedThrough = nextDate;
        nextDate = addDate(nextDate, 1);
      }
      if (processedThrough && processedThrough !== originalProcessedThrough) {
        await client.query(
          `UPDATE public.customer_accounts
           SET main_balance = $2,
               total_accrual = $3,
               daily_accrual = $4,
               daily_accrual_date = COALESCE($5::date, daily_accrual_date),
               last_compound_date = $6::date,
               updated_at = now()
           WHERE user_id = $1`,
          [account.id, balance, totalAccrual, todaysAccrual, lastAccrualDate, processedThrough],
        );
      }
    }
    await client.query("COMMIT");
    return { applied, date: today };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function loadUserRows(pool, userId) {
  const result = await pool.query(
    `SELECT u.id, u.name, u.email, u.phone, u.status, u.created_at,
            u.daily_rate_override, a.deposit_balance, a.main_balance, a.total_accrual,
            a.daily_accrual, a.daily_accrual_date, a.last_compound_date
     FROM public.customer_users u
     JOIN public.customer_accounts a ON a.user_id = u.id
     WHERE u.id = $1`,
    [userId],
  );
  return result.rows;
}

async function loadDeposits(pool, userId, includeProof = false) {
  const query = userId
    ? `SELECT d.*, u.email
       FROM public.customer_deposits d
       JOIN public.customer_users u ON u.id = d.user_id
       WHERE d.user_id = $1
       ORDER BY d.created_at DESC LIMIT 500`
    : `SELECT d.*, u.email
       FROM public.customer_deposits d
       JOIN public.customer_users u ON u.id = d.user_id
       ORDER BY d.created_at DESC LIMIT 2000`;
  const result = await pool.query(query, userId ? [userId] : []);
  return result.rows.map((row) => serializeDeposit(row, includeProof));
}

async function loadWithdrawals(pool, userId) {
  const query = userId
    ? `SELECT w.*, u.name, u.email
       FROM public.customer_withdrawals w
       JOIN public.customer_users u ON u.id = w.user_id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC LIMIT 500`
    : `SELECT w.*, u.name, u.email
       FROM public.customer_withdrawals w
       JOIN public.customer_users u ON u.id = w.user_id
       ORDER BY w.created_at DESC LIMIT 2000`;
  const result = await pool.query(query, userId ? [userId] : []);
  return result.rows.map(serializeWithdrawal);
}

async function makeState(pool, userId, admin = false) {
  await runDueCompounding(pool);
  const compound = await getCompoundSettings(pool);
  const settings = admin ? await getSiteSettings(pool) : undefined;
  const usersResult = admin
    ? await pool.query(
        `SELECT u.id, u.name, u.email, u.phone, u.status, u.created_at,
                u.daily_rate_override, a.deposit_balance, a.main_balance, a.total_accrual,
                a.daily_accrual, a.daily_accrual_date, a.last_compound_date
         FROM public.customer_users u
         JOIN public.customer_accounts a ON a.user_id = u.id
         ORDER BY u.created_at DESC LIMIT 5000`,
      )
    : await loadUserRows(pool, userId);
  const [deposits, withdrawals] = await Promise.all([
    loadDeposits(pool, admin ? null : userId, false),
    loadWithdrawals(pool, admin ? null : userId),
  ]);
  return {
    users: usersResult.rows.map((row) => serializeUser(row, compound.globalRate)),
    deposits,
    withdrawals,
    compound,
    ...(settings ?? {}),
  };
}

function validateDepositContent(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const stringKeys = [
    "title", "methodPlaceholder", "currency", "rateLabel", "minimumText",
    "button", "securityText", "securityBrand", "notice", "sheetTitle",
  ];
  if (stringKeys.some((key) => typeof value[key] !== "string" || value[key].length > 500)) return false;
  if (!Number.isFinite(Number(value.rate)) || Number(value.rate) <= 0 || Number(value.rate) > 100_000_000) return false;
  if (!Number.isFinite(Number(value.minimum)) || Number(value.minimum) < 0 || Number(value.minimum) > MAX_MONEY) return false;
  if (!Array.isArray(value.methods) || value.methods.length > 30) return false;
  return value.methods.every((method) =>
    method &&
    typeof method.id === "string" && method.id.length <= 100 &&
    typeof method.label === "string" && method.label.length <= 200 &&
    typeof method.badge === "string" && method.badge.length <= 60 &&
    typeof method.bank === "string" && method.bank.length <= 100,
  );
}

function validateBankAccounts(value) {
  return Array.isArray(value) &&
    value.length <= 100 &&
    value.every((account) =>
      account &&
      typeof account.id === "string" && account.id.length <= 100 &&
      typeof account.bank === "string" && account.bank.length <= 100 &&
      typeof account.holder === "string" && account.holder.length <= 120 &&
      typeof account.number === "string" && account.number.length <= 60 &&
      typeof account.active === "boolean",
    );
}

export function createApiRouter(pool) {
  const router = express.Router();
  router.use((request, response, next) => {
    response.setHeader("Cache-Control", "no-store");
    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
      return requireSameOrigin(request, response, next);
    }
    return next();
  });
  router.use(requireDatabase(pool));

  router.get("/auth/me", asyncRoute(async (request, response) => {
    const token = readSessionToken(request);
    if (!token) return response.json({ user: null });
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.status, u.created_at
       FROM public.customer_sessions s
       JOIN public.customer_users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.expires_at > now()`,
      [hashSessionToken(token)],
    );
    return response.json({ user: result.rows[0] ?? null });
  }));

  router.post("/auth/register", rateLimit("register", 6), asyncRoute(async (request, response) => {
    const name = typeof request.body?.name === "string" ? request.body.name.trim() : "";
    const email = normalizeEmail(request.body?.email);
    const phone = normalizeIndonesianPhone(request.body?.phone);
    const password = request.body?.password;
    if (name.length < 2 || name.length > 120) return apiError(response, 400, "Nama harus terdiri dari 2–120 karakter.");
    if (!validEmail(email)) return apiError(response, 400, "Alamat email tidak valid.");
    if (!phone) return apiError(response, 400, "Nomor telepon Indonesia tidak valid.");
    if (!validPassword(password)) return apiError(response, 400, "Password harus mengikuti semua aturan yang ditampilkan.");

    const passwordHash = await hashPassword(password);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const userResult = await client.query(
        `INSERT INTO public.customer_users (name, email, phone, password_hash)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, phone, status, created_at`,
        [name, email, phone, passwordHash],
      );
      const user = userResult.rows[0];
      await client.query(
        `INSERT INTO public.customer_accounts (user_id) VALUES ($1)`,
        [user.id],
      );
      await client.query("COMMIT");
      await issueSession(pool, response, user.id);
      return response.status(201).json({ user });
    } catch (error) {
      await client.query("ROLLBACK");
      if (error?.code === "23505") return apiError(response, 409, "Email atau nomor telepon sudah terdaftar.");
      throw error;
    } finally {
      client.release();
    }
  }));

  router.post("/auth/login", rateLimit("login", 10), asyncRoute(async (request, response) => {
    const identity = String(request.body?.identity ?? "").trim();
    const password = request.body?.password;
    if (!identity || typeof password !== "string" || password.length > 128) {
      return apiError(response, 400, "Email/nomor telepon dan password wajib diisi.");
    }
    const lookup = identity.includes("@")
      ? ["email", normalizeEmail(identity)]
      : ["phone", normalizeIndonesianPhone(identity)];
    if (!lookup[1]) return apiError(response, 401, "Kredensial tidak valid.");
    const result = await pool.query(
      `SELECT id, name, email, phone, status, created_at, password_hash
       FROM public.customer_users WHERE ${lookup[0]} = $1`,
      [lookup[1]],
    );
    const user = result.rows[0];
    const matches = await verifyPassword(password, user?.password_hash);
    if (!matches || !user) return apiError(response, 401, "Kredensial tidak valid.");
    if (user.status === "Diblokir") return apiError(response, 403, "Akun ini diblokir. Hubungi administrator.");
    await issueSession(pool, response, user.id);
    const { password_hash: _passwordHash, ...safeUser } = user;
    return response.json({ user: safeUser });
  }));

  router.post("/auth/logout", asyncRoute(async (request, response) => {
    const token = readSessionToken(request);
    if (token) {
      await pool.query(
        "DELETE FROM public.customer_sessions WHERE token_hash = $1",
        [hashSessionToken(token)],
      );
    }
    response.setHeader("Set-Cookie", clearSessionCookie());
    return response.json({ ok: true });
  }));

  router.get("/site/deposit-settings", asyncRoute(async (_request, response) => {
    return response.json(await getSiteSettings(pool));
  }));

  router.get("/account/state", requireCustomer(pool), asyncRoute(async (request, response) => {
    return response.json(await makeState(pool, request.customer.id));
  }));

  router.post("/account/deposits", requireCustomer(pool), rateLimit("deposit", 8), asyncRoute(async (request, response) => {
    if (request.customer.status !== "Aktif") return apiError(response, 403, "Akun harus diverifikasi admin sebelum mengirim deposit.");
    const name = typeof request.body?.name === "string" ? request.body.name.trim() : "";
    const bankName = typeof request.body?.bankName === "string" ? request.body.bankName.trim() : "";
    const accountNumber = String(request.body?.accountNumber ?? "").replace(/\D/g, "");
    const transferredAmountIdr = money(request.body?.transferredAmountIdr);
    const amount = money(request.body?.amount);
    const method = typeof request.body?.method === "string" ? request.body.method.trim() : "";
    const destinationAccountId = typeof request.body?.destinationAccountId === "string"
      ? request.body.destinationAccountId
      : "";
    const proof = typeof request.body?.proof === "string" ? request.body.proof : "";
    if (name.length < 2 || name.length > 120 || bankName.length < 2 || bankName.length > 100) {
      return apiError(response, 400, "Nama dan bank pengirim wajib diisi.");
    }
    if (!/^\d{6,30}$/.test(accountNumber)) return apiError(response, 400, "Nomor rekening pengirim tidak valid.");
    if (!amount || !transferredAmountIdr || !method || !destinationAccountId) {
      return apiError(response, 400, "Jumlah, metode, rekening tujuan, dan jumlah transfer aktual wajib diisi.");
    }
    if (!/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(proof) || proof.length > 2_000_000) {
      return apiError(response, 400, "Bukti transfer harus berupa gambar JPEG, PNG, atau WebP di bawah 1,5 MB.");
    }
    const settings = await getSiteSettings(pool);
    const methodConfig = settings.depositContent?.methods?.find((item) => item.label === method);
    const destination = settings.bankAccounts.find((item) =>
      item.id === destinationAccountId &&
      item.active &&
      item.bank === methodConfig?.bank &&
      item.number.trim() &&
      item.holder.trim(),
    );
    if (!destination) return apiError(response, 409, "Rekening tujuan aktif untuk metode ini belum tersedia.");
    const minimum = Number(settings.depositContent?.minimum ?? 0);
    if (amount < minimum) return apiError(response, 400, `Minimal deposit adalah ${minimum}.`);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const inserted = await client.query(
        `INSERT INTO public.customer_deposits
           (user_id, sender_name_ciphertext, sender_bank_ciphertext,
            sender_account_ciphertext, sender_amount_idr, destination_account_id,
            method, amount, proof_ciphertext)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          request.customer.id,
          encryptPrivate(name),
          encryptPrivate(bankName),
          encryptPrivate(accountNumber),
          transferredAmountIdr,
          destinationAccountId,
          method,
          amount,
          encryptPrivate(proof),
        ],
      );
      await addAudit(client, request.customer.email, "deposit_requested", "deposit", inserted.rows[0].id, { amount, currency: "USD" });
      await client.query("COMMIT");
      return response.status(201).json({ ok: true, id: inserted.rows[0].id, status: "Menunggu" });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }));

  router.post("/account/withdrawals", requireCustomer(pool), rateLimit("withdrawal", 8), asyncRoute(async (request, response) => {
    if (request.customer.status !== "Aktif") return apiError(response, 403, "Akun harus aktif untuk mengajukan penarikan.");
    const amount = money(request.body?.amount);
    const bank = typeof request.body?.bank === "string" ? request.body.bank.trim() : "";
    const account = String(request.body?.account ?? "").replace(/\D/g, "");
    if (!amount) return apiError(response, 400, "Jumlah penarikan tidak valid.");
    if (bank.length < 2 || bank.length > 100 || !/^\d{6,30}$/.test(account)) {
      return apiError(response, 400, "Nama bank atau nomor rekening tidak valid.");
    }
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const balanceResult = await client.query(
        `SELECT main_balance FROM public.customer_accounts
         WHERE user_id = $1 FOR UPDATE`,
        [request.customer.id],
      );
      if (!balanceResult.rowCount || Number(balanceResult.rows[0].main_balance) < amount) {
        await client.query("ROLLBACK");
        return apiError(response, 409, "Saldo utama tidak cukup.");
      }
      const updated = await client.query(
        `UPDATE public.customer_accounts
         SET main_balance = main_balance - $2, updated_at = now()
         WHERE user_id = $1
         RETURNING main_balance`,
        [request.customer.id, amount],
      );
      const withdrawal = await client.query(
        `INSERT INTO public.customer_withdrawals
           (user_id, bank_ciphertext, account_ciphertext, amount)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [request.customer.id, encryptPrivate(bank), encryptPrivate(account), amount],
      );
      await client.query(
        `INSERT INTO public.customer_ledger_entries
           (user_id, entry_type, bucket, amount, balance_after, source_type, source_id)
         VALUES ($1, 'withdrawal_reserve', 'main', $2, $3, 'withdrawal', $4)`,
        [request.customer.id, amount, updated.rows[0].main_balance, withdrawal.rows[0].id],
      );
      await client.query("COMMIT");
      return response.status(201).json({ ok: true, id: withdrawal.rows[0].id, status: "Menunggu" });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }));

  router.post("/account/transfer-deposit", requireCustomer(pool), asyncRoute(async (request, response) => {
    if (request.customer.status !== "Aktif") return apiError(response, 403, "Akun harus aktif untuk memindahkan saldo.");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const settings = await client.query(
        "SELECT enabled FROM public.customer_compound_settings WHERE singleton = true FOR UPDATE",
      );
      if (!settings.rows[0]?.enabled) {
        await client.query("ROLLBACK");
        return apiError(response, 409, "Compounding sedang dinonaktifkan admin.");
      }
      const account = await client.query(
        `SELECT deposit_balance, main_balance
         FROM public.customer_accounts WHERE user_id = $1 FOR UPDATE`,
        [request.customer.id],
      );
      const moved = Number(account.rows[0]?.deposit_balance ?? 0);
      if (moved <= 0) {
        await client.query("ROLLBACK");
        return apiError(response, 409, "Tidak ada saldo deposit yang dapat dipindahkan.");
      }
      const mainBalance = Math.round((Number(account.rows[0].main_balance) + moved) * 100) / 100;
      await client.query(
        `UPDATE public.customer_accounts
         SET deposit_balance = 0, main_balance = $2, updated_at = now()
         WHERE user_id = $1`,
        [request.customer.id, mainBalance],
      );
      await client.query(
        `INSERT INTO public.customer_ledger_entries
           (user_id, entry_type, bucket, amount, balance_after, source_type, source_id)
         VALUES ($1, 'deposit_to_main', 'main', $2, $3, 'transfer', $4)`,
        [request.customer.id, moved, mainBalance, `${request.customer.id}:${Date.now()}`],
      );
      await client.query("COMMIT");
      return response.json({ ok: true, moved });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }));

  router.use("/admin", adminAuth);

  router.get("/admin/state", asyncRoute(async (request, response) => {
    return response.json(await makeState(pool, null, true));
  }));

  router.get("/admin/deposits/:id/proof", asyncRoute(async (request, response) => {
    const result = await pool.query(
      "SELECT proof_ciphertext FROM public.customer_deposits WHERE id = $1",
      [request.params.id],
    );
    if (!result.rowCount) return apiError(response, 404, "Bukti deposit tidak ditemukan.");
    return response.json({ proof: decryptPrivate(result.rows[0].proof_ciphertext) });
  }));

  router.post("/admin/deposits/:id/review", asyncRoute(async (request, response) => {
    const approved = request.body?.approved === true;
    const note = typeof request.body?.note === "string" ? request.body.note.trim().slice(0, 500) : "";
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const requestResult = await client.query(
        `SELECT d.id, d.user_id, d.amount, d.status, u.status AS user_status
         FROM public.customer_deposits d
         JOIN public.customer_users u ON u.id = d.user_id
         WHERE d.id = $1 FOR UPDATE OF d`,
        [request.params.id],
      );
      if (!requestResult.rowCount) {
        await client.query("ROLLBACK");
        return apiError(response, 404, "Permintaan deposit tidak ditemukan.");
      }
      const deposit = requestResult.rows[0];
      if (deposit.status !== "Menunggu") {
        await client.query("ROLLBACK");
        return apiError(response, 409, "Permintaan deposit ini sudah ditinjau.");
      }
      if (approved && deposit.user_status !== "Aktif") {
        await client.query("ROLLBACK");
        return apiError(response, 409, "Aktifkan dan verifikasi akun pengguna sebelum menyetujui deposit.");
      }
      await client.query(
        `UPDATE public.customer_deposits
         SET status = $2, note = $3, reviewed_by = $4, reviewed_at = now()
         WHERE id = $1`,
        [deposit.id, approved ? "Disetujui" : "Ditolak", note, request.adminName],
      );
      if (approved) {
        const balance = await client.query(
          `UPDATE public.customer_accounts
           SET deposit_balance = deposit_balance + $2, updated_at = now()
           WHERE user_id = $1
           RETURNING deposit_balance`,
          [deposit.user_id, deposit.amount],
        );
        await client.query(
          `INSERT INTO public.customer_ledger_entries
             (user_id, entry_type, bucket, amount, balance_after, source_type, source_id, details)
           VALUES ($1, 'deposit_credit', 'deposit', $2, $3, 'deposit', $4, $5::jsonb)`,
          [deposit.user_id, deposit.amount, balance.rows[0].deposit_balance, deposit.id, JSON.stringify({ verifiedBy: request.adminName })],
        );
      }
      await client.query(
        `INSERT INTO public.customer_admin_audit
           (admin_name, action, target_type, target_id, details)
         VALUES ($1, $2, 'deposit', $3, $4::jsonb)`,
        [request.adminName, approved ? "deposit_approved" : "deposit_rejected", deposit.id, JSON.stringify({ note })],
      );
      await client.query("COMMIT");
      return response.json({ ok: true, status: approved ? "Disetujui" : "Ditolak" });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }));

  router.post("/admin/withdrawals/:id/review", asyncRoute(async (request, response) => {
    const status = request.body?.status;
    const note = typeof request.body?.note === "string" ? request.body.note.trim().slice(0, 500) : "";
    if (!["Diproses", "Berhasil", "Ditolak"].includes(status)) {
      return apiError(response, 400, "Status penarikan tidak valid.");
    }
    if (status === "Berhasil" && request.body?.confirmPayout !== true) {
      return apiError(response, 400, "Konfirmasi bahwa transfer bank sudah benar-benar dikirim.");
    }
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query(
        `SELECT id, user_id, amount, status
         FROM public.customer_withdrawals WHERE id = $1 FOR UPDATE`,
        [request.params.id],
      );
      if (!result.rowCount) {
        await client.query("ROLLBACK");
        return apiError(response, 404, "Permintaan penarikan tidak ditemukan.");
      }
      const withdrawal = result.rows[0];
      if (!["Menunggu", "Diproses"].includes(withdrawal.status)) {
        await client.query("ROLLBACK");
        return apiError(response, 409, "Permintaan penarikan ini sudah ditutup.");
      }
      if (status === "Ditolak") {
        const balance = await client.query(
          `UPDATE public.customer_accounts
           SET main_balance = main_balance + $2, updated_at = now()
           WHERE user_id = $1
           RETURNING main_balance`,
          [withdrawal.user_id, withdrawal.amount],
        );
        await client.query(
          `INSERT INTO public.customer_ledger_entries
             (user_id, entry_type, bucket, amount, balance_after, source_type, source_id, details)
           VALUES ($1, 'withdrawal_refund', 'main', $2, $3, 'withdrawal', $4, $5::jsonb)`,
          [withdrawal.user_id, withdrawal.amount, balance.rows[0].main_balance, withdrawal.id, JSON.stringify({ reason: note })],
        );
      }
      await client.query(
        `UPDATE public.customer_withdrawals
         SET status = $2, note = $3, reviewed_by = $4, reviewed_at = now()
         WHERE id = $1`,
        [withdrawal.id, status, note, request.adminName],
      );
      await client.query(
        `INSERT INTO public.customer_admin_audit
           (admin_name, action, target_type, target_id, details)
         VALUES ($1, $2, 'withdrawal', $3, $4::jsonb)`,
        [request.adminName, `withdrawal_${status.toLowerCase()}`, withdrawal.id, JSON.stringify({ note })],
      );
      await client.query("COMMIT");
      return response.json({ ok: true, status });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }));

  router.patch("/admin/users/:id", asyncRoute(async (request, response) => {
    const patch = request.body ?? {};
    const allowed = {};
    if (patch.name !== undefined) {
      const name = String(patch.name).trim();
      if (name.length < 2 || name.length > 120) return apiError(response, 400, "Nama tidak valid.");
      allowed.name = name;
    }
    if (patch.email !== undefined) {
      const email = normalizeEmail(patch.email);
      if (!validEmail(email)) return apiError(response, 400, "Email tidak valid.");
      allowed.email = email;
    }
    if (patch.phone !== undefined) {
      const phone = normalizeIndonesianPhone(patch.phone);
      if (!phone) return apiError(response, 400, "Nomor telepon Indonesia tidak valid.");
      allowed.phone = phone;
    }
    if (patch.status !== undefined) {
      if (!["Aktif", "Belum Verifikasi", "Diblokir"].includes(patch.status)) {
        return apiError(response, 400, "Status akun tidak valid.");
      }
      allowed.status = patch.status;
    }
    if (patch.rate !== undefined) {
      if (patch.rate !== null && (!Number.isFinite(Number(patch.rate)) || Number(patch.rate) < 0 || Number(patch.rate) > 100)) {
        return apiError(response, 400, "Tarif harian harus antara 0 dan 100 persen.");
      }
      allowed.daily_rate_override = patch.rate === null ? null : Number(patch.rate);
    }
    const entries = Object.entries(allowed);
    if (!entries.length) return apiError(response, 400, "Tidak ada perubahan yang valid.");
    const assignments = entries.map(([key], index) => `${key} = $${index + 2}`).join(", ");
    const values = entries.map(([, value]) => value);
    try {
      const updated = await pool.query(
        `UPDATE public.customer_users
         SET ${assignments}, updated_at = now()
         WHERE id = $1
         RETURNING id`,
        [request.params.id, ...values],
      );
      if (!updated.rowCount) return apiError(response, 404, "Pengguna tidak ditemukan.");
    } catch (error) {
      if (error?.code === "23505") return apiError(response, 409, "Email atau nomor telepon sudah dipakai akun lain.");
      throw error;
    }
    await addAudit(pool, request.adminName, "user_updated", "user", request.params.id, { fields: entries.map(([key]) => key) });
    return response.json({ ok: true });
  }));

  router.patch("/admin/compound/settings", asyncRoute(async (request, response) => {
    const globalRate = Number(request.body?.globalRate);
    const enabled = request.body?.enabled;
    if (!Number.isFinite(globalRate) || globalRate < 0 || globalRate > 100 || typeof enabled !== "boolean") {
      return apiError(response, 400, "Tarif harus antara 0 dan 100 persen dan status harus berupa aktif/nonaktif.");
    }
    await pool.query(
      `UPDATE public.customer_compound_settings
       SET global_rate_percent = $1, enabled = $2, updated_at = now()
       WHERE singleton = true`,
      [globalRate, enabled],
    );
    await addAudit(pool, request.adminName, "compound_settings_updated", "compound_settings", "global", { globalRate, enabled });
    return response.json({ ok: true });
  }));

  router.post("/admin/compound/run", asyncRoute(async (request, response) => {
    const result = await runDueCompounding(pool);
    await addAudit(pool, request.adminName, "compound_run_requested", "compound_settings", result.date, result);
    return response.json({ ok: true, ...result });
  }));

  router.post("/admin/referrals/credit", asyncRoute(async (request, response) => {
    const userId = String(request.body?.userId ?? "");
    const referralId = String(request.body?.referralId ?? "").trim();
    const amount = money(request.body?.amount);
    if (!userId || !referralId || referralId.length > 150 || !amount) {
      return apiError(response, 400, "Data kredit referral tidak valid.");
    }
    const sourceId = `${userId}:${referralId}`;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const account = await client.query(
        `SELECT a.deposit_balance, u.status
         FROM public.customer_accounts a
         JOIN public.customer_users u ON u.id = a.user_id
         WHERE a.user_id = $1 FOR UPDATE OF a`,
        [userId],
      );
      if (!account.rowCount || account.rows[0].status !== "Aktif") {
        await client.query("ROLLBACK");
        return apiError(response, 409, "Akun referral tidak ditemukan atau belum aktif.");
      }
      const newBalance = Math.round((Number(account.rows[0].deposit_balance) + amount) * 100) / 100;
      const inserted = await client.query(
        `INSERT INTO public.customer_ledger_entries
           (user_id, entry_type, bucket, amount, balance_after, source_type, source_id, details)
         VALUES ($1, 'referral_credit', 'deposit', $2, $3, 'referral', $4, $5::jsonb)
         ON CONFLICT (entry_type, source_type, source_id) DO NOTHING
         RETURNING id`,
        [userId, amount, newBalance, sourceId, JSON.stringify({ referralId })],
      );
      if (!inserted.rowCount) {
        await client.query("ROLLBACK");
        return apiError(response, 409, "Kredit referral ini sudah pernah diberikan.");
      }
      await client.query(
        `UPDATE public.customer_accounts
         SET deposit_balance = $2, updated_at = now()
         WHERE user_id = $1`,
        [userId, newBalance],
      );
      await addAudit(client, request.adminName, "referral_credit", "user", userId, { referralId, amount });
      await client.query("COMMIT");
      return response.json({ ok: true });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }));

  router.put("/admin/site-settings", asyncRoute(async (request, response) => {
    const entries = [];
    if (request.body?.depositContent !== undefined) {
      if (!validateDepositContent(request.body.depositContent)) return apiError(response, 400, "Pengaturan halaman deposit tidak valid.");
      entries.push(["depositContent", request.body.depositContent]);
    }
    if (request.body?.bankAccounts !== undefined) {
      if (!validateBankAccounts(request.body.bankAccounts)) return apiError(response, 400, "Daftar rekening tujuan tidak valid.");
      entries.push(["bankAccounts", request.body.bankAccounts]);
    }
    if (!entries.length) return apiError(response, 400, "Tidak ada pengaturan yang valid.");
    for (const [key, value] of entries) {
      await pool.query(
        `INSERT INTO public.customer_site_settings (setting_key, setting_value)
         VALUES ($1, $2::jsonb)
         ON CONFLICT (setting_key)
         DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = now()`,
        [key, JSON.stringify(value)],
      );
    }
    await addAudit(pool, request.adminName, "deposit_settings_updated", "site_settings", "deposit", { updated: entries.map(([key]) => key) });
    return response.json({ ok: true });
  }));

  router.use((_request, response) => apiError(response, 404, "API route not found."));
  router.use((error, request, response, _next) => {
    if (error instanceof ConfigurationError) {
      return apiError(response, 503, "Enkripsi data keuangan belum dikonfigurasi. Atur SESSION_SECRET di lingkungan server.");
    }
    console.error(`API request failed: ${request.method} ${request.path} (${error?.name ?? "Error"}).`);
    return apiError(response, 500, "Permintaan gagal diproses.");
  });
  return router;
}
