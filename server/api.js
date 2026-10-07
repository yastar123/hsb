import express from "express";
import { randomUUID } from "node:crypto";
import {
  clearSessionCookie,
  ConfigurationError,
  createAdminSession,
  decryptPrivate,
  destroyAdminSession,
  encryptPrivate,
  getAdminPhone,
  getPrimaryAdminEmail,
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
  verifyAdminCredentials,
  verifyAdminSession,
  verifyPassword,
} from "./auth.js";
import { requireAdminAuthentication, requireRole, ROLES } from "./rbac.js";

const MAX_MONEY = 1_000_000_000;
const BUSINESS_TIME_ZONE = "Asia/Jakarta";
const rateBuckets = new Map();

const DEFAULT_MARKET_GROUPS = ["Metal", "Forex", "Energy", "Index"];
const DEFAULT_MARKET_PRODUCTS = [
  {
    symbol: "AUDJPY",
    name: "Australian Dollar / Japanese Yen",
    group: "Forex",
    ask: 110.401,
    spread: 28,
    decimals: 3,
    change: 0.3,
  },
  {
    symbol: "AUDNZD",
    name: "Australian Dollar / New Zealand Dollar",
    group: "Forex",
    ask: 1.24284,
    spread: 31,
    decimals: 5,
    change: -0.11,
  },
  {
    symbol: "AUDUSD",
    name: "Australian Dollar / US Dollar",
    group: "Forex",
    ask: 0.69828,
    spread: 23,
    decimals: 5,
    change: 0.14,
  },
  {
    symbol: "EURAUD",
    name: "Euro / Australian Dollar",
    group: "Forex",
    ask: 1.61279,
    spread: 44,
    decimals: 5,
    change: 0.22,
  },
  {
    symbol: "EURCHF",
    name: "Euro / Swiss Franc",
    group: "Forex",
    ask: 0.93549,
    spread: 30,
    decimals: 5,
    change: 0.34,
  },
  {
    symbol: "EURGBP",
    name: "Euro / British Pound",
    group: "Forex",
    ask: 0.84837,
    spread: 22,
    decimals: 5,
    change: -0.04,
  },
  {
    symbol: "EURJPY",
    name: "Euro / Japanese Yen",
    group: "Forex",
    ask: 178.016,
    spread: 26,
    decimals: 3,
    change: 0.46,
  },
  {
    symbol: "EURUSD",
    name: "Euro / US Dollar",
    group: "Forex",
    ask: 1.12593,
    spread: 20,
    decimals: 5,
    change: 0.33,
  },
  {
    symbol: "GBPAUD",
    name: "British Pound / Australian Dollar",
    group: "Forex",
    ask: 1.90125,
    spread: 40,
    decimals: 5,
    change: 0.27,
  },
  {
    symbol: "GBPCHF",
    name: "British Pound / Swiss Franc",
    group: "Forex",
    ask: 1.10287,
    spread: 42,
    decimals: 5,
    change: 0.4,
  },
  {
    symbol: "GBPJPY",
    name: "British Pound / Japanese Yen",
    group: "Forex",
    ask: 209.845,
    spread: 35,
    decimals: 3,
    change: 0.53,
  },
  {
    symbol: "GBPUSD",
    name: "British Pound / US Dollar",
    group: "Forex",
    ask: 1.32737,
    spread: 22,
    decimals: 5,
    change: 0.4,
  },
  {
    symbol: "USDJPY",
    name: "US Dollar / Japanese Yen",
    group: "Forex",
    ask: 158.124,
    spread: 24,
    decimals: 3,
    change: 0.14,
  },
  {
    symbol: "XAUUSD",
    name: "Gold / US Dollar",
    group: "Metal",
    ask: 4168.26,
    spread: 32,
    decimals: 2,
    change: 0.69,
  },
  {
    symbol: "XAGUSD",
    name: "Silver / US Dollar",
    group: "Metal",
    ask: 48.325,
    spread: 25,
    decimals: 3,
    change: 0.82,
  },
  {
    symbol: "USOIL",
    name: "West Texas Intermediate",
    group: "Energy",
    ask: 87.61,
    spread: 3,
    decimals: 2,
    change: -1.86,
  },
  {
    symbol: "UKOIL",
    name: "Brent Crude Oil",
    group: "Energy",
    ask: 91.24,
    spread: 4,
    decimals: 2,
    change: -1.24,
  },
  {
    symbol: "US30",
    name: "Dow Jones Industrial Average",
    group: "Index",
    ask: 42852.4,
    spread: 20,
    decimals: 1,
    change: 0.42,
  },
  {
    symbol: "NAS100",
    name: "Nasdaq 100",
    group: "Index",
    ask: 21345.6,
    spread: 15,
    decimals: 1,
    change: 0.76,
  },
];

const DEFAULT_BANK_ACCOUNTS = [
  {
    id: "bca-1",
    bank: "BCA",
    holder: "PT HSB INVESTASI MANDIRI",
    number: "1234567890",
    active: true,
  },
  {
    id: "mandiri-1",
    bank: "Mandiri",
    holder: "PT HSB INVESTASI MANDIRI",
    number: "0987654321",
    active: true,
  },
  {
    id: "bni-1",
    bank: "BNI",
    holder: "PT HSB INVESTASI MANDIRI",
    number: "1122334455",
    active: true,
  },
  {
    id: "bri-1",
    bank: "BRI",
    holder: "PT HSB INVESTASI MANDIRI",
    number: "5544332211",
    active: true,
  },
  {
    id: "bsi-1",
    bank: "BSI",
    holder: "PT HSB INVESTASI MANDIRI",
    number: "6677889900",
    active: true,
  },
  {
    id: "cimb-1",
    bank: "CIMB",
    holder: "PT HSB INVESTASI MANDIRI",
    number: "7788990011",
    active: true,
  },
  {
    id: "permata-1",
    bank: "Permata",
    holder: "PT HSB INVESTASI MANDIRI",
    number: "8899001122",
    active: true,
  },
];

const DEFAULT_DEPOSIT_CONTENT = {
  title: "Deposit",
  methodPlaceholder: "Pilih Metode Pembayaran",
  currency: "USD",
  rateLabel: "USD / IDR",
  rate: 16250,
  minimum: 200,
  minimumText: "Minimal deposit $200",
  button: "Deposit Sekarang",
  securityText: "Transaksi Aman oleh",
  securityBrand: "HSB Security",
  notice: "Permintaan deposit menunggu pencocokan mutasi rekening oleh admin.",
  sheetTitle: "Pilih Metode Pembayaran",
  methods: ["BCA", "BNI", "Mandiri", "BRI", "BSI", "CIMB", "Permata"].map((b) => ({
    id: b,
    label: `Transfer Bank ${b}`,
    badge: b,
    bank: b,
  })),
};

const inMemoryStore = {
  settings: new Map([
    ["depositContent", DEFAULT_DEPOSIT_CONTENT],
    ["bankAccounts", DEFAULT_BANK_ACCOUNTS],
  ]),
  marketGroups: [...DEFAULT_MARKET_GROUPS],
  marketProducts: DEFAULT_MARKET_PRODUCTS.map((p) => ({ ...p })),
  users: new Map(),
  usersById: new Map(),
  sessions: new Map(),
  deposits: [],
  withdrawals: [],
  notifications: [],
  audit: [],
};

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
    const requestHost = request.get("x-forwarded-host") || request.get("host") || "";
    const requestHostname = request.hostname || requestHost.split(":")[0];
    const hostMatches =
      parsed.host === requestHost ||
      parsed.hostname === requestHostname ||
      parsed.hostname === requestHost.split(":")[0];
    if (!hostMatches) {
      return apiError(response, 403, "Asal permintaan tidak sesuai.");
    }
  } catch {
    return apiError(response, 403, "Asal permintaan tidak valid.");
  }
  return next();
}

function requireDatabase(_pool) {
  return (_request, _response, next) => next();
}

const adminAuth = requireAdminAuthentication;
async function issueSession(pool, response, userId) {
  const token = newSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = sessionExpiry();
  if (pool) {
    try {
      await pool.query("DELETE FROM public.customer_sessions WHERE expires_at <= now()");
      await pool.query(
        `INSERT INTO public.customer_sessions (token_hash, user_id, expires_at)
         VALUES ($1, $2, $3)`,
        [tokenHash, userId, expiresAt],
      );
    } catch {
      // In-memory fallback
    }
  }
  inMemoryStore.sessions.set(tokenHash, { userId, expiresAt });
  response.setHeader("Set-Cookie", sessionCookie(token));
}

function requireCustomer(pool) {
  return asyncRoute(async (request, response, next) => {
    const token = readSessionToken(request);
    if (!token) return apiError(response, 401, "Silakan masuk untuk melanjutkan.");
    const tokenHash = hashSessionToken(token);
    if (pool) {
      try {
        const result = await pool.query(
          `SELECT u.id, u.name, u.email, u.phone, u.status, u.created_at
           FROM public.customer_sessions s
           JOIN public.customer_users u ON u.id = s.user_id
           WHERE s.token_hash = $1 AND s.expires_at > now()`,
          [tokenHash],
        );
        if (result.rowCount) {
          request.customer = result.rows[0];
          request.auth = { role: ROLES.CUSTOMER, subject: request.customer.id };
          if (request.customer.status === "Diblokir") {
            response.setHeader("Set-Cookie", clearSessionCookie());
            return apiError(response, 403, "Akun ini diblokir. Hubungi administrator.");
          }
          return requireRole(ROLES.CUSTOMER)(request, response, next);
        }
      } catch {
        // Fallback to in-memory check
      }
    }
    const inMem = inMemoryStore.sessions.get(tokenHash);
    if (inMem && new Date(inMem.expiresAt) > new Date()) {
      const user = inMemoryStore.usersById.get(inMem.userId);
      if (user) {
        request.customer = user;
        request.auth = { role: ROLES.CUSTOMER, subject: user.id };
        if (user.status === "Diblokir") {
          response.setHeader("Set-Cookie", clearSessionCookie());
          return apiError(response, 403, "Akun ini diblokir. Hubungi administrator.");
        }
        return requireRole(ROLES.CUSTOMER)(request, response, next);
      }
    }
    response.setHeader("Set-Cookie", clearSessionCookie());
    return apiError(response, 401, "Sesi berakhir. Silakan masuk kembali.");
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
    rate:
      row.daily_rate_override === null || row.daily_rate_override === undefined
        ? null
        : Number(row.daily_rate_override),
    status: row.status,
    effectiveRate:
      row.daily_rate_override === null || row.daily_rate_override === undefined
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
  if (pool) {
    try {
      const result = await pool.query(
        `SELECT global_rate_percent, enabled
         FROM public.customer_compound_settings WHERE singleton = true`,
      );
      const row = result.rows[0] ?? { global_rate_percent: 0, enabled: false };
      return { globalRate: Number(row.global_rate_percent), enabled: Boolean(row.enabled) };
    } catch {
      // In-memory
    }
  }
  return { globalRate: 0, enabled: false };
}

async function getSiteSettings(pool) {
  if (pool) {
    try {
      const result = await pool.query(
        `SELECT setting_key, setting_value
         FROM public.customer_site_settings
         WHERE setting_key IN ('depositContent', 'bankAccounts')`,
      );
      const values = Object.fromEntries(
        result.rows.map((row) => [row.setting_key, row.setting_value]),
      );
      return {
        depositContent:
          values.depositContent ??
          (inMemoryStore.settings.get("depositContent") || DEFAULT_DEPOSIT_CONTENT),
        bankAccounts: Array.isArray(values.bankAccounts)
          ? values.bankAccounts
          : inMemoryStore.settings.get("bankAccounts") || DEFAULT_BANK_ACCOUNTS,
      };
    } catch {
      // In-memory
    }
  }
  return {
    depositContent: inMemoryStore.settings.get("depositContent") || DEFAULT_DEPOSIT_CONTENT,
    bankAccounts: inMemoryStore.settings.get("bankAccounts") || DEFAULT_BANK_ACCOUNTS,
  };
}

async function addAudit(pool, adminName, action, targetType, targetId, details = {}) {
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO public.customer_admin_audit
           (admin_name, action, target_type, target_id, details)
         VALUES ($1, $2, $3, $4, $5::jsonb)`,
        [adminName, action, targetType, String(targetId), JSON.stringify(details)],
      );
    } catch {
      // In-memory
    }
  }
  inMemoryStore.audit.push({
    adminName,
    action,
    targetType,
    targetId,
    details,
    createdAt: new Date().toISOString(),
  });
}

async function runDueCompounding(pool) {
  if (!pool) return { applied: 0, date: businessDate() };
  let client = null;
  try {
    client = await pool.connect();
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
        const rate =
          account.daily_rate_override === null
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
              [
                account.id,
                accrual,
                balance,
                `${account.id}:${nextDate}`,
                JSON.stringify({ ratePercent: rate, date: nextDate }),
              ],
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
    if (client) await client.query("ROLLBACK").catch(() => {});
    return { applied: 0, date: businessDate() };
  } finally {
    if (client) client.release();
  }
}

async function loadUserRows(pool, userId) {
  if (pool) {
    try {
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
    } catch {
      // In-memory
    }
  }
  const inMem = inMemoryStore.usersById.get(userId);
  return inMem ? [inMem] : [];
}

async function loadDeposits(pool, userId, includeProof = false) {
  if (pool) {
    try {
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
    } catch {
      // In-memory
    }
  }
  return inMemoryStore.deposits
    .filter((d) => !userId || d.userId === userId)
    .map((d) => ({
      ...d,
      date: typeof d.date === "string" ? d.date : new Date(d.date).toISOString(),
    }));
}

async function loadWithdrawals(pool, userId) {
  if (pool) {
    try {
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
    } catch {
      // In-memory
    }
  }
  return inMemoryStore.withdrawals
    .filter((w) => !userId || w.userId === userId)
    .map((w) => ({
      ...w,
      date: typeof w.date === "string" ? w.date : new Date(w.date).toISOString(),
    }));
}

async function makeState(pool, userId, admin = false) {
  try {
    await runDueCompounding(pool);
  } catch {
    // In-memory
  }
  const compound = await getCompoundSettings(pool);
  const settings = admin ? await getSiteSettings(pool) : undefined;
  let userRows = [];
  if (pool) {
    try {
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
      userRows = usersResult.rows || usersResult;
    } catch {
      userRows = admin
        ? [...inMemoryStore.usersById.values()]
        : userId
          ? [inMemoryStore.usersById.get(userId)].filter(Boolean)
          : [];
    }
  } else {
    userRows = admin
      ? [...inMemoryStore.usersById.values()]
      : userId
        ? [inMemoryStore.usersById.get(userId)].filter(Boolean)
        : [];
  }
  const [deposits, withdrawals] = await Promise.all([
    loadDeposits(pool, admin ? null : userId, false),
    loadWithdrawals(pool, admin ? null : userId),
  ]);
  return {
    users: userRows.map((row) => serializeUser(row, compound.globalRate)),
    deposits,
    withdrawals,
    compound,
    ...(settings ?? {}),
  };
}

function validateDepositContent(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const stringKeys = [
    "title",
    "methodPlaceholder",
    "currency",
    "rateLabel",
    "minimumText",
    "button",
    "securityText",
    "securityBrand",
    "notice",
    "sheetTitle",
  ];
  if (stringKeys.some((key) => typeof value[key] !== "string" || value[key].length > 500))
    return false;
  if (
    !Number.isFinite(Number(value.rate)) ||
    Number(value.rate) <= 0 ||
    Number(value.rate) > 100_000_000
  )
    return false;
  if (
    !Number.isFinite(Number(value.minimum)) ||
    Number(value.minimum) < 0 ||
    Number(value.minimum) > MAX_MONEY
  )
    return false;
  if (!Array.isArray(value.methods) || value.methods.length > 30) return false;
  return value.methods.every(
    (method) =>
      method &&
      typeof method.id === "string" &&
      method.id.length <= 100 &&
      typeof method.label === "string" &&
      method.label.length <= 200 &&
      typeof method.badge === "string" &&
      method.badge.length <= 60 &&
      typeof method.bank === "string" &&
      method.bank.length <= 100,
  );
}

function validateBankAccounts(value) {
  return (
    Array.isArray(value) &&
    value.length <= 100 &&
    value.every(
      (account) =>
        account &&
        typeof account.id === "string" &&
        account.id.length <= 100 &&
        typeof account.bank === "string" &&
        account.bank.length <= 100 &&
        typeof account.holder === "string" &&
        account.holder.length <= 120 &&
        typeof account.number === "string" &&
        account.number.length <= 60 &&
        typeof account.active === "boolean",
    )
  );
}

function validateMarketCatalog(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const { groups, products } = value;
  if (
    !Array.isArray(groups) ||
    groups.length > 30 ||
    groups.some(
      (group) =>
        typeof group !== "string" ||
        group !== group.trim() ||
        group.length < 1 ||
        group.length > 60,
    ) ||
    new Set(groups).size !== groups.length ||
    !Array.isArray(products) ||
    products.length > 500
  )
    return false;

  const symbols = new Set();
  return products.every((product) => {
    if (!product || typeof product !== "object" || Array.isArray(product)) return false;
    const valid =
      typeof product.symbol === "string" &&
      /^[A-Z0-9._-]{1,20}$/.test(product.symbol) &&
      !symbols.has(product.symbol) &&
      typeof product.name === "string" &&
      product.name === product.name.trim() &&
      product.name.length >= 1 &&
      product.name.length <= 120 &&
      groups.includes(product.group) &&
      Number.isFinite(product.ask) &&
      product.ask > 0 &&
      product.ask <= 1_000_000_000_000 &&
      Number.isInteger(product.spread) &&
      product.spread >= 0 &&
      product.spread <= 1_000_000 &&
      Number.isInteger(product.decimals) &&
      product.decimals >= 0 &&
      product.decimals <= 8 &&
      Number.isFinite(product.change) &&
      product.change >= -100 &&
      product.change <= 100;
    if (valid) symbols.add(product.symbol);
    return valid;
  });
}

const SITE_CONTENT_KEYS = new Set([
  "home",
  "faq",
  "calendar",
  "customer-service",
  "news",
  "referral-program",
]);

const DEFAULT_REFERRAL_PROGRAM = {
  title: "Ajak Teman, Dapatkan Hadiah",
  subtitle:
    "Bagikan kode referral Anda. Setiap teman yang mendaftar dan deposit, Anda dan teman sama-sama mendapat hadiah.",
  bonusPerInvite: 10,
  friendBonus: 5,
  minDeposit: 25,
  defaultRate: 10,
  terms:
    "Hadiah diberikan setelah teman melakukan deposit pertama minimal sesuai ketentuan. S&K berlaku.",
  tiers: [
    { id: "t1", invites: 5, reward: 25, label: "Bronze" },
    { id: "t2", invites: 15, reward: 100, label: "Silver" },
    { id: "t3", invites: 50, reward: 500, label: "Gold" },
  ],
};

function validReferralProgram(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  for (const key of ["title", "subtitle", "terms"]) {
    if (typeof value[key] !== "string" || value[key].length > 2000) return false;
  }
  for (const key of ["bonusPerInvite", "friendBonus", "minDeposit"]) {
    if (
      !Number.isFinite(Number(value[key])) ||
      Number(value[key]) < 0 ||
      Number(value[key]) > MAX_MONEY
    )
      return false;
  }
  if (
    !Number.isFinite(Number(value.defaultRate)) ||
    Number(value.defaultRate) < 0 ||
    Number(value.defaultRate) > 100
  )
    return false;
  return (
    Array.isArray(value.tiers) &&
    value.tiers.length <= 50 &&
    value.tiers.every(
      (tier) =>
        tier &&
        typeof tier.id === "string" &&
        tier.id.length <= 100 &&
        typeof tier.label === "string" &&
        tier.label.length <= 100 &&
        Number.isInteger(Number(tier.invites)) &&
        Number(tier.invites) >= 0 &&
        Number(tier.invites) <= 1_000_000 &&
        Number.isFinite(Number(tier.reward)) &&
        Number(tier.reward) >= 0 &&
        Number(tier.reward) <= MAX_MONEY,
    )
  );
}

function validSiteContent(value) {
  if (value === null || value === undefined) return false;
  if (typeof value !== "object") return false;
  try {
    return JSON.stringify(value).length <= 1_500_000;
  } catch {
    return false;
  }
}

async function getReferralProgram(pool) {
  if (pool) {
    try {
      const result = await pool.query(
        "SELECT value FROM public.app_settings WHERE setting_key = $1",
        ["site-content:referral-program"],
      );
      const saved = result.rows[0]?.value;
      if (saved && typeof saved === "object" && !Array.isArray(saved))
        return { ...DEFAULT_REFERRAL_PROGRAM, ...saved };
      return { ...DEFAULT_REFERRAL_PROGRAM };
    } catch {
      // In-memory
    }
  }
  const saved = inMemoryStore.settings.get("site-content:referral-program");
  if (saved && typeof saved === "object" && !Array.isArray(saved))
    return { ...DEFAULT_REFERRAL_PROGRAM, ...saved };
  return { ...DEFAULT_REFERRAL_PROGRAM };
}

async function listReferralRows(pool, ownerId = null, program = DEFAULT_REFERRAL_PROGRAM) {
  if (!pool) return [];
  try {
    const result = await pool.query(
      `SELECT referred.id, referred.name, referred.email, referred.created_at, referred.status,
              owner.id AS referrer_id, owner.referral_code AS referrer_code,
              COALESCE(owner.referral_commission_rate, $2)::numeric AS commission_rate,
              COALESCE(SUM(d.amount) FILTER (WHERE d.status = 'Disetujui'), 0)::numeric AS approved_deposit,
              COALESCE((
                SELECT 1 FROM public.customer_ledger_entries le
                WHERE le.user_id = owner.id
                  AND le.entry_type = 'referral_credit'
                  AND le.source_type = 'referral'
                  AND le.source_id = owner.id::text || ':' || referred.id::text
                LIMIT 1
              ), 0)::numeric AS commission_paid,
              COALESCE((
                SELECT le.amount FROM public.customer_ledger_entries le
                WHERE le.user_id = owner.id
                  AND le.entry_type = 'referral_credit'
                  AND le.source_type = 'referral'
                  AND le.source_id = owner.id::text || ':' || referred.id::text
                LIMIT 1
              ), 0)::numeric AS paid_amount
       FROM public.customer_users referred
       JOIN public.customer_users owner ON owner.id = referred.referred_by
       LEFT JOIN public.customer_deposits d ON d.user_id = referred.id
       WHERE ($1::uuid IS NULL OR owner.id = $1::uuid)
       GROUP BY referred.id, referred.name, referred.email, referred.created_at, referred.status,
                owner.id, owner.referral_code, owner.referral_commission_rate
       ORDER BY referred.created_at DESC`,
      [ownerId, Number(program.defaultRate) || 0],
    );
    return result.rows.map((row) => ({
      id: row.id,
      referrerId: row.referrer_id,
      name: row.name,
      email: row.email,
      joined: row.created_at,
      deposit: Number(row.approved_deposit) || 0,
      status: Number(row.approved_deposit) > 0 ? "Deposit" : "Terdaftar",
      commissionPaid: Number(row.commission_paid) > 0,
      commissionRate: Number(row.commission_rate) || 0,
      paidAmount: Number(row.paid_amount) || 0,
    }));
  } catch {
    return [];
  }
}

async function creditDepositBalance(client, userId, amount, sourceId, details) {
  const credit = money(amount);
  if (!credit || typeof sourceId !== "string" || sourceId.length > 150) return false;
  const account = await client.query(
    `SELECT a.deposit_balance, u.status
     FROM public.customer_accounts a
     JOIN public.customer_users u ON u.id = a.user_id
     WHERE a.user_id = $1
     FOR UPDATE OF a`,
    [userId],
  );
  if (!account.rowCount || account.rows[0].status !== "Aktif") return false;
  const newBalance = Math.round((Number(account.rows[0].deposit_balance) + credit) * 100) / 100;
  if (newBalance > MAX_MONEY)
    throw new Error("Referral credit would exceed the supported account balance.");
  const inserted = await client.query(
    `INSERT INTO public.customer_ledger_entries
       (user_id, entry_type, bucket, amount, balance_after, source_type, source_id, details)
     VALUES ($1, 'referral_credit', 'deposit', $2, $3, 'referral', $4, $5::jsonb)
     ON CONFLICT (entry_type, source_type, source_id) DO NOTHING
     RETURNING id`,
    [userId, credit, newBalance, sourceId, JSON.stringify(details)],
  );
  if (!inserted.rowCount) return false;
  await client.query(
    `UPDATE public.customer_accounts
     SET deposit_balance = $2, updated_at = now()
     WHERE user_id = $1`,
    [userId, newBalance],
  );
  return true;
}

async function creditReferralCommission(client, referrerId, referredId, program) {
  const result = await client.query(
    `SELECT owner.status AS owner_status, owner.referral_enabled,
            COALESCE(owner.referral_commission_rate, $3)::numeric AS commission_rate,
            COALESCE(SUM(d.amount) FILTER (WHERE d.status = 'Disetujui'), 0)::numeric AS approved_deposit
     FROM public.customer_users referred
     JOIN public.customer_users owner ON owner.id = referred.referred_by
     LEFT JOIN public.customer_deposits d ON d.user_id = referred.id
     WHERE owner.id = $1 AND referred.id = $2
     GROUP BY owner.status, owner.referral_enabled, owner.referral_commission_rate`,
    [referrerId, referredId, Number(program.defaultRate) || 0],
  );
  if (!result.rowCount) return { eligible: false, credited: false, amount: 0 };
  const row = result.rows[0];
  const deposit = Number(row.approved_deposit) || 0;
  if (
    row.owner_status !== "Aktif" ||
    !row.referral_enabled ||
    deposit < Number(program.minDeposit)
  ) {
    return { eligible: false, credited: false, amount: 0 };
  }
  const amount = money(
    Number(program.bonusPerInvite) + (deposit * Number(row.commission_rate)) / 100,
  );
  if (!amount) return { eligible: false, credited: false, amount: 0 };
  const credited = await creditDepositBalance(
    client,
    referrerId,
    amount,
    `${referrerId}:${referredId}`,
    {
      role: "referrer",
      referralId: referredId,
      approvedDeposit: deposit,
      commissionRate: Number(row.commission_rate),
    },
  );
  return { eligible: true, credited, amount };
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

  router.get(
    "/market",
    asyncRoute(async (_request, response) => {
      if (pool) {
        try {
          const [groupResult, productResult] = await Promise.all([
            pool.query("SELECT name FROM public.market_groups ORDER BY position, name"),
            pool.query(
              `SELECT p.symbol, p.name, p.group_name, p.ask, p.spread, p.decimals, p.change
             FROM public.market_products p
             JOIN public.market_groups g ON g.name = p.group_name
             ORDER BY g.position, p.position, p.symbol`,
            ),
          ]);
          return response.json({
            groups: groupResult.rows.map((row) => row.name),
            products: productResult.rows.map((row) => ({
              symbol: row.symbol,
              name: row.name,
              group: row.group_name,
              ask: Number(row.ask),
              spread: Number(row.spread),
              decimals: Number(row.decimals),
              change: Number(row.change),
            })),
            quoteMode: "illustrative",
          });
        } catch {
          // Fallback below
        }
      }
      return response.json({
        groups: [...inMemoryStore.marketGroups],
        products: inMemoryStore.marketProducts.map((p) => ({ ...p })),
        quoteMode: "illustrative",
      });
    }),
  );

  router.get(
    "/auth/me",
    asyncRoute(async (request, response) => {
      const token = readSessionToken(request);
      if (!token) return response.json({ user: null });
      const adminSession = await verifyAdminSession(token, pool);
      if (adminSession) {
        return response.json({
          user: {
            id: "admin",
            name: "Administrator",
            email: getPrimaryAdminEmail(),
            phone: getAdminPhone() || "",
            status: "Aktif",
            role: ROLES.ADMIN,
            isAdmin: true,
          },
        });
      }
      const tokenHash = hashSessionToken(token);
      if (pool) {
        try {
          const result = await pool.query(
            `SELECT u.id, u.name, u.email, u.phone, u.status, u.created_at
           FROM public.customer_sessions s
           JOIN public.customer_users u ON u.id = s.user_id
           WHERE s.token_hash = $1 AND s.expires_at > now()`,
            [tokenHash],
          );
          const user = result.rows[0];
          if (user) return response.json({ user: { ...user, role: ROLES.CUSTOMER } });
        } catch {
          // Fallback below
        }
      }
      const inMem = inMemoryStore.sessions.get(tokenHash);
      if (inMem && new Date(inMem.expiresAt) > new Date()) {
        const user = inMemoryStore.usersById.get(inMem.userId);
        if (user) return response.json({ user: { ...user, role: ROLES.CUSTOMER } });
      }
      return response.json({ user: null });
    }),
  );

  router.post(
    "/auth/register",
    rateLimit("register", 6),
    asyncRoute(async (request, response) => {
      const name = typeof request.body?.name === "string" ? request.body.name.trim() : "";
      const email = normalizeEmail(request.body?.email);
      const phone = normalizeIndonesianPhone(request.body?.phone);
      const password = request.body?.password;
      const referralCode =
        typeof request.body?.referralCode === "string"
          ? request.body.referralCode.trim().toUpperCase()
          : "";
      if (name.length < 2 || name.length > 120)
        return apiError(response, 400, "Nama harus terdiri dari 2–120 karakter.");
      if (!validEmail(email)) return apiError(response, 400, "Alamat email tidak valid.");
      if (!phone) return apiError(response, 400, "Nomor telepon Indonesia tidak valid.");
      if (!validPassword(password))
        return apiError(response, 400, "Password harus mengikuti semua aturan yang ditampilkan.");
      if (referralCode.length > 32) return apiError(response, 400, "Kode referral tidak valid.");

      const passwordHash = await hashPassword(password);
      if (!pool) {
        const existing = inMemoryStore.users.get(email) || inMemoryStore.users.get(phone);
        if (existing) return apiError(response, 409, "Email atau nomor telepon sudah terdaftar.");
        const id = randomUUID();
        const user = {
          id,
          name,
          email,
          phone,
          password_hash: passwordHash,
          status: "Aktif",
          referral_code: "REF" + id.slice(0, 8).toUpperCase(),
          referred_by: null,
          referral_commission_rate: 10,
          referral_enabled: true,
          created_at: new Date().toISOString(),
          main_balance: 0,
          deposit_balance: 0,
          total_accrual: 0,
          daily_accrual: 0,
          daily_accrual_date: null,
          last_compound_date: null,
          daily_rate_override: null,
        };
        inMemoryStore.users.set(email, user);
        inMemoryStore.users.set(phone, user);
        inMemoryStore.usersById.set(id, user);
        await issueSession(null, response, id);
        const { password_hash: _, ...safeUser } = user;
        return response.status(201).json({ user: { ...safeUser, role: ROLES.CUSTOMER } });
      }
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        let referrerId = null;
        if (referralCode) {
          const referrer = await client.query(
            `SELECT id, status, referral_enabled
           FROM public.customer_users
           WHERE referral_code = $1
           FOR SHARE`,
            [referralCode],
          );
          if (
            !referrer.rowCount ||
            referrer.rows[0].status !== "Aktif" ||
            !referrer.rows[0].referral_enabled
          ) {
            await client.query("ROLLBACK");
            return apiError(response, 400, "Kode referral tidak tersedia.");
          }
          referrerId = referrer.rows[0].id;
        }
        const userResult = await client.query(
          `INSERT INTO public.customer_users (name, email, phone, password_hash, referred_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, email, phone, status, created_at`,
          [name, email, phone, passwordHash, referrerId],
        );
        const user = userResult.rows[0];
        await client.query(`INSERT INTO public.customer_accounts (user_id) VALUES ($1)`, [user.id]);
        await client.query("COMMIT");
        await issueSession(pool, response, user.id);
        return response.status(201).json({ user: { ...user, role: ROLES.CUSTOMER } });
      } catch (error) {
        await client.query("ROLLBACK");
        if (error?.code === "23505")
          return apiError(response, 409, "Email atau nomor telepon sudah terdaftar.");
        throw error;
      } finally {
        client.release();
      }
    }),
  );

  router.post(
    "/auth/login",
    rateLimit("login", 10),
    asyncRoute(async (request, response) => {
      const identity = String(request.body?.identity ?? "").trim();
      const password = request.body?.password;
      if (!identity || typeof password !== "string" || password.length > 128) {
        return apiError(response, 400, "Email/nomor telepon dan password wajib diisi.");
      }
      if (verifyAdminCredentials(identity, password)) {
        const adminEmail = getPrimaryAdminEmail();
        const { token } = await createAdminSession(identity, pool);
        response.setHeader("Set-Cookie", sessionCookie(token));
        return response.json({
          user: {
            id: "admin",
            name: "Administrator",
            email: adminEmail,
            phone: getAdminPhone() || "",
            status: "Aktif",
            role: ROLES.ADMIN,
            isAdmin: true,
          },
          isAdmin: true,
          redirectTo: "/admin",
        });
      }
      const lookup = identity.includes("@")
        ? ["email", normalizeEmail(identity)]
        : ["phone", normalizeIndonesianPhone(identity)];
      if (!lookup[1]) return apiError(response, 401, "Kredensial tidak valid.");
      if (!pool) {
        const user = inMemoryStore.users.get(lookup[1]);
        if (!user) return apiError(response, 401, "Kredensial tidak valid.");
        const matches = await verifyPassword(password, user.password_hash);
        if (!matches) return apiError(response, 401, "Kredensial tidak valid.");
        if (user.status === "Diblokir")
          return apiError(response, 403, "Akun ini diblokir. Hubungi administrator.");
        await issueSession(null, response, user.id);
        const { password_hash: _passwordHash, ...safeUser } = user;
        return response.json({ user: { ...safeUser, role: ROLES.CUSTOMER } });
      }
      const result = await pool.query(
        `SELECT id, name, email, phone, status, created_at, password_hash
       FROM public.customer_users WHERE ${lookup[0]} = $1`,
        [lookup[1]],
      );
      const user = result.rows[0];
      const matches = await verifyPassword(password, user?.password_hash);
      if (!matches || !user) return apiError(response, 401, "Kredensial tidak valid.");
      if (user.status === "Diblokir")
        return apiError(response, 403, "Akun ini diblokir. Hubungi administrator.");
      await issueSession(pool, response, user.id);
      const { password_hash: _passwordHash, ...safeUser } = user;
      return response.json({ user: { ...safeUser, role: ROLES.CUSTOMER } });
    }),
  );

  router.post(
    "/auth/logout",
    asyncRoute(async (request, response) => {
      const token = readSessionToken(request);
      if (token) {
        await destroyAdminSession(token, pool);
        if (pool) {
          await pool
            .query("DELETE FROM public.customer_sessions WHERE token_hash = $1", [
              hashSessionToken(token),
            ])
            .catch(() => {});
        }
        inMemoryStore.sessions.delete(hashSessionToken(token));
      }
      response.setHeader("Set-Cookie", clearSessionCookie());
      return response.json({ ok: true });
    }),
  );

  router.get(
    "/site/deposit-settings",
    asyncRoute(async (_request, response) => {
      return response.json(await getSiteSettings(pool));
    }),
  );

  router.get(
    "/content/:key",
    asyncRoute(async (request, response) => {
      const key = String(request.params.key ?? "");
      if (!SITE_CONTENT_KEYS.has(key)) return apiError(response, 404, "Konten tidak ditemukan.");
      if (pool) {
        try {
          const result = await pool.query(
            "SELECT value FROM public.app_settings WHERE setting_key = $1",
            [`site-content:${key}`],
          );
          return response.json({
            value:
              result.rows[0]?.value ?? inMemoryStore.settings.get(`site-content:${key}`) ?? null,
          });
        } catch {
          // Fallback
        }
      }
      return response.json({ value: inMemoryStore.settings.get(`site-content:${key}`) ?? null });
    }),
  );

  router.get(
    "/referral/state",
    asyncRoute(async (request, response) => {
      const program = await getReferralProgram(pool);
      const token = readSessionToken(request);
      if (!token) {
        return response.json({
          program,
          currentUserCode: "",
          referrers: [],
          referrals: [],
          friendBonusClaimable: false,
          friendBonusAmount: 0,
        });
      }
      const tokenHash = hashSessionToken(token);
      let user = null;
      if (pool) {
        try {
          const userResult = await pool.query(
            `SELECT u.id, u.name, u.email, u.status, u.referral_code, u.referral_commission_rate,
                  u.referral_enabled, u.referred_by
           FROM public.customer_sessions s
           JOIN public.customer_users u ON u.id = s.user_id
           WHERE s.token_hash = $1 AND s.expires_at > now()`,
            [tokenHash],
          );
          user = userResult.rows[0];
        } catch {
          // Fallback
        }
      }
      if (!user) {
        const inMem = inMemoryStore.sessions.get(tokenHash);
        if (inMem && new Date(inMem.expiresAt) > new Date()) {
          user = inMemoryStore.usersById.get(inMem.userId);
        }
      }
      if (!user) {
        return response.json({
          program,
          currentUserCode: "",
          referrers: [],
          referrals: [],
          friendBonusClaimable: false,
          friendBonusAmount: 0,
        });
      }
      const rate = Number(user.referral_commission_rate ?? program.defaultRate) || 0;
      const referrals = await listReferralRows(pool, user.id, program);
      let friendEligible = false;
      if (pool) {
        try {
          const friend = await pool.query(
            `SELECT u.status,
                  COALESCE(SUM(d.amount) FILTER (WHERE d.status = 'Disetujui'), 0)::numeric AS approved_deposit,
                  EXISTS (
                    SELECT 1 FROM public.customer_ledger_entries le
                    WHERE le.user_id = u.id AND le.entry_type = 'referral_credit'
                      AND le.source_type = 'referral' AND le.source_id = 'friend:' || u.id::text
                  ) AS bonus_paid
           FROM public.customer_users u
           LEFT JOIN public.customer_deposits d ON d.user_id = u.id
           WHERE u.id = $1 AND u.referred_by IS NOT NULL
           GROUP BY u.id, u.status`,
            [user.id],
          );
          friendEligible = Boolean(
            friend.rowCount &&
            friend.rows[0].status === "Aktif" &&
            Number(friend.rows[0].approved_deposit) >= Number(program.minDeposit) &&
            Number(program.friendBonus) > 0 &&
            !friend.rows[0].bonus_paid,
          );
        } catch {
          friendEligible = false;
        }
      }
      return response.json({
        program,
        currentUserCode: user.referral_code || "REF-USER",
        referrers: [
          {
            id: user.id,
            name: user.name,
            email: user.email,
            code: user.referral_code || "REF-USER",
            commissionRate: rate,
            status: user.referral_enabled ? "Aktif" : "Nonaktif",
          },
        ],
        referrals,
        friendBonusClaimable: friendEligible,
        friendBonusAmount: friendEligible ? Number(program.friendBonus) : 0,
      });
    }),
  );

  router.get(
    "/notifications",
    asyncRoute(async (request, response) => {
      let userId = null;
      const token = readSessionToken(request);
      if (token) {
        if (pool) {
          try {
            const user = await pool.query(
              `SELECT s.user_id
             FROM public.customer_sessions s
             WHERE s.token_hash = $1 AND s.expires_at > now()`,
              [hashSessionToken(token)],
            );
            userId = user.rows[0]?.user_id ?? null;
          } catch {
            userId = null;
          }
        }
        if (!userId) {
          const inMem = inMemoryStore.sessions.get(hashSessionToken(token));
          if (inMem) userId = inMem.userId;
        }
      }
      if (pool) {
        try {
          const result = await pool.query(
            `SELECT id, title, message, created_at
           FROM public.site_notifications
           WHERE target_user_ids IS NULL
              OR ($1::uuid IS NOT NULL AND $1::uuid = ANY(target_user_ids))
           ORDER BY created_at DESC
           LIMIT 100`,
            [userId],
          );
          return response.json({
            notifications: result.rows.map((row) => ({
              id: row.id,
              title: row.title,
              message: row.message,
              target: "all",
              createdAt: row.created_at,
            })),
          });
        } catch {
          // Fallback
        }
      }
      return response.json({
        notifications: inMemoryStore.notifications.map((n) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          target: "all",
          createdAt: n.createdAt,
        })),
      });
    }),
  );

  router.get(
    "/account/state",
    requireCustomer(pool),
    asyncRoute(async (request, response) => {
      return response.json(await makeState(pool, request.customer.id));
    }),
  );

  router.post(
    "/account/referrals/claim",
    requireCustomer(pool),
    rateLimit("referral-claim", 10),
    asyncRoute(async (request, response) => {
      const program = await getReferralProgram(pool);
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const userResult = await client.query(
          `SELECT id, status, referred_by
         FROM public.customer_users
         WHERE id = $1`,
          [request.customer.id],
        );
        const user = userResult.rows[0];
        if (!user || user.status !== "Aktif") {
          await client.query("ROLLBACK");
          return apiError(response, 403, "Akun harus aktif sebelum hadiah referral diklaim.");
        }

        const invitees = await client.query(
          "SELECT id FROM public.customer_users WHERE referred_by = $1 ORDER BY created_at",
          [user.id],
        );
        let credited = 0;
        let rewardCount = 0;
        for (const invitee of invitees.rows) {
          const reward = await creditReferralCommission(client, user.id, invitee.id, program);
          if (reward.credited) {
            credited += reward.amount;
            rewardCount += 1;
          }
        }

        if (user.referred_by && Number(program.friendBonus) > 0) {
          const friend = await client.query(
            `SELECT COALESCE(SUM(d.amount) FILTER (WHERE d.status = 'Disetujui'), 0)::numeric AS approved_deposit
           FROM public.customer_deposits d
           WHERE d.user_id = $1`,
            [user.id],
          );
          if (Number(friend.rows[0]?.approved_deposit) >= Number(program.minDeposit)) {
            const friendCredit = await creditDepositBalance(
              client,
              user.id,
              Number(program.friendBonus),
              `friend:${user.id}`,
              {
                role: "invitee",
                referralId: user.id,
                approvedDeposit: Number(friend.rows[0].approved_deposit),
              },
            );
            if (friendCredit) {
              credited += Number(program.friendBonus);
              rewardCount += 1;
            }
          }
        }

        await client.query("COMMIT");
        return response.json({ ok: true, credited: Math.round(credited * 100) / 100, rewardCount });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    }),
  );

  router.post(
    "/account/deposits",
    requireCustomer(pool),
    rateLimit("deposit", 8),
    asyncRoute(async (request, response) => {
      if (request.customer.status !== "Aktif")
        return apiError(response, 403, "Akun harus diverifikasi admin sebelum mengirim deposit.");
      const name = typeof request.body?.name === "string" ? request.body.name.trim() : "";
      const bankName =
        typeof request.body?.bankName === "string" ? request.body.bankName.trim() : "";
      const accountNumber = String(request.body?.accountNumber ?? "").replace(/\D/g, "");
      const transferredAmountIdr = money(request.body?.transferredAmountIdr);
      const amount = money(request.body?.amount);
      const method = typeof request.body?.method === "string" ? request.body.method.trim() : "";
      const destinationAccountId =
        typeof request.body?.destinationAccountId === "string"
          ? request.body.destinationAccountId
          : "";
      const proof = typeof request.body?.proof === "string" ? request.body.proof : "";
      if (name.length < 2 || name.length > 120 || bankName.length < 2 || bankName.length > 100) {
        return apiError(response, 400, "Nama dan bank pengirim wajib diisi.");
      }
      if (!/^\d{6,30}$/.test(accountNumber))
        return apiError(response, 400, "Nomor rekening pengirim tidak valid.");
      if (!amount || !transferredAmountIdr || !method || !destinationAccountId) {
        return apiError(
          response,
          400,
          "Jumlah, metode, rekening tujuan, dan jumlah transfer aktual wajib diisi.",
        );
      }
      if (
        !/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(proof) ||
        proof.length > 2_000_000
      ) {
        return apiError(
          response,
          400,
          "Bukti transfer harus berupa gambar JPEG, PNG, atau WebP di bawah 1,5 MB.",
        );
      }
      const settings = await getSiteSettings(pool);
      const methodConfig = settings.depositContent?.methods?.find((item) => item.label === method);
      const destination = settings.bankAccounts.find(
        (item) =>
          item.id === destinationAccountId &&
          item.active &&
          item.bank === methodConfig?.bank &&
          item.number.trim() &&
          item.holder.trim(),
      );
      if (!destination)
        return apiError(response, 409, "Rekening tujuan aktif untuk metode ini belum tersedia.");
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
        await addAudit(
          client,
          request.customer.email,
          "deposit_requested",
          "deposit",
          inserted.rows[0].id,
          { amount, currency: "USD" },
        );
        await client.query("COMMIT");
        return response.status(201).json({ ok: true, id: inserted.rows[0].id, status: "Menunggu" });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    }),
  );

  router.post(
    "/account/withdrawals",
    requireCustomer(pool),
    rateLimit("withdrawal", 8),
    asyncRoute(async (request, response) => {
      if (request.customer.status !== "Aktif")
        return apiError(response, 403, "Akun harus aktif untuk mengajukan penarikan.");
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
        return response
          .status(201)
          .json({ ok: true, id: withdrawal.rows[0].id, status: "Menunggu" });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    }),
  );

  router.post(
    "/account/transfer-deposit",
    requireCustomer(pool),
    asyncRoute(async (request, response) => {
      if (request.customer.status !== "Aktif")
        return apiError(response, 403, "Akun harus aktif untuk memindahkan saldo.");
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
    }),
  );

  router.use("/admin", (req, res, next) => Promise.resolve(adminAuth(req, res, next)).catch(next), requireRole(ROLES.ADMIN));

  router.put(
    "/admin/market",
    asyncRoute(async (request, response) => {
      const catalog = request.body;
      if (!validateMarketCatalog(catalog)) {
        return apiError(response, 400, "Daftar kategori atau produk pasar tidak valid.");
      }
      inMemoryStore.marketGroups = [...catalog.groups];
      inMemoryStore.marketProducts = catalog.products.map((p) => ({ ...p }));
      if (!pool) return response.json({ ok: true });

      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query("DELETE FROM public.market_products");
        await client.query("DELETE FROM public.market_groups");

        for (const [position, name] of catalog.groups.entries()) {
          await client.query("INSERT INTO public.market_groups (name, position) VALUES ($1, $2)", [
            name,
            position,
          ]);
        }
        for (const [position, product] of catalog.products.entries()) {
          await client.query(
            `INSERT INTO public.market_products
             (symbol, name, group_name, ask, spread, decimals, change, position)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              product.symbol,
              product.name,
              product.group,
              product.ask,
              product.spread,
              product.decimals,
              product.change,
              position,
            ],
          );
        }
        await client.query(
          `INSERT INTO public.customer_admin_audit
           (admin_name, action, target_type, target_id, details)
         VALUES ($1, 'market_catalog_updated', 'market_catalog', 'global', $2::jsonb)`,
          [
            request.adminName,
            JSON.stringify({ groups: catalog.groups.length, products: catalog.products.length }),
          ],
        );
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }

      return response.json({ ok: true });
    }),
  );

  router.get(
    "/admin/content/:key",
    asyncRoute(async (request, response) => {
      const key = String(request.params.key ?? "");
      if (!SITE_CONTENT_KEYS.has(key)) return apiError(response, 404, "Konten tidak ditemukan.");
      if (pool) {
        try {
          const result = await pool.query(
            "SELECT value FROM public.app_settings WHERE setting_key = $1",
            [`site-content:${key}`],
          );
          return response.json({
            value:
              result.rows[0]?.value ?? inMemoryStore.settings.get(`site-content:${key}`) ?? null,
          });
        } catch {
          // Fallback
        }
      }
      return response.json({ value: inMemoryStore.settings.get(`site-content:${key}`) ?? null });
    }),
  );

  router.put(
    "/admin/content/:key",
    asyncRoute(async (request, response) => {
      const key = String(request.params.key ?? "");
      const value = request.body?.value;
      if (!SITE_CONTENT_KEYS.has(key)) return apiError(response, 404, "Konten tidak ditemukan.");
      if (!validSiteContent(value))
        return apiError(response, 400, "Format konten tidak valid atau ukurannya terlalu besar.");
      if (key === "referral-program" && !validReferralProgram(value)) {
        return apiError(response, 400, "Pengaturan referral tidak valid.");
      }
      inMemoryStore.settings.set(`site-content:${key}`, value);
      if (pool) {
        try {
          await pool.query(
            `INSERT INTO public.app_settings (setting_key, value)
           VALUES ($1, $2::jsonb)
           ON CONFLICT (setting_key)
           DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
            [`site-content:${key}`, JSON.stringify(value)],
          );
          await addAudit(pool, request.adminName, "site_content_updated", key, key, {
            bytes: JSON.stringify(value).length,
          });
        } catch {
          // In-memory updated
        }
      }
      return response.json({ ok: true });
    }),
  );

  router.get(
    "/admin/notifications",
    asyncRoute(async (_request, response) => {
      if (pool) {
        try {
          const result = await pool.query(
            `SELECT id, title, message, target_user_ids, created_at
           FROM public.site_notifications
           ORDER BY created_at DESC
           LIMIT 500`,
          );
          return response.json({
            notifications: result.rows.map((row) => ({
              id: row.id,
              title: row.title,
              message: row.message,
              target: row.target_user_ids === null ? "all" : row.target_user_ids,
              createdAt: row.created_at,
            })),
          });
        } catch {
          // Fallback
        }
      }
      return response.json({
        notifications: inMemoryStore.notifications.map((n) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          target: "all",
          createdAt: n.createdAt,
        })),
      });
    }),
  );

  router.post(
    "/admin/notifications",
    rateLimit("admin-notification", 30),
    asyncRoute(async (request, response) => {
      const title = typeof request.body?.title === "string" ? request.body.title.trim() : "";
      const message = typeof request.body?.message === "string" ? request.body.message.trim() : "";
      const target = request.body?.target;
      if (!title || title.length > 200 || !message || message.length > 3000) {
        return apiError(
          response,
          400,
          "Judul dan isi notifikasi wajib diisi serta tidak melebihi batas.",
        );
      }
      const newNotif = {
        id: randomUUID(),
        title,
        message,
        target: "all",
        createdAt: new Date().toISOString(),
      };
      inMemoryStore.notifications.unshift(newNotif);
      if (!pool) {
        return response.status(201).json({ notification: newNotif });
      }
      let targetUserIds = null;
      if (target !== "all") {
        if (!Array.isArray(target) || target.length < 1 || target.length > 1000) {
          return apiError(response, 400, "Pilih setidaknya satu akun tujuan yang valid.");
        }
        targetUserIds = [...new Set(target.map((id) => String(id)))];
        if (
          targetUserIds.some(
            (id) =>
              !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                id,
              ),
          )
        ) {
          return apiError(response, 400, "Daftar akun tujuan tidak valid.");
        }
        const found = await pool.query(
          "SELECT count(*)::int AS count FROM public.customer_users WHERE id = ANY($1::uuid[])",
          [targetUserIds],
        );
        if (Number(found.rows[0]?.count) !== targetUserIds.length) {
          return apiError(response, 400, "Satu atau beberapa akun tujuan tidak ditemukan.");
        }
      }
      const result = await pool.query(
        `INSERT INTO public.site_notifications (title, message, target_user_ids)
       VALUES ($1, $2, $3::uuid[])
       RETURNING id, title, message, target_user_ids, created_at`,
        [title, message, targetUserIds],
      );
      const row = result.rows[0];
      await addAudit(pool, request.adminName, "notification_created", "notification", row.id, {
        targetCount: targetUserIds?.length ?? "all",
      });
      return response.status(201).json({
        notification: {
          id: row.id,
          title: row.title,
          message: row.message,
          target: row.target_user_ids ?? "all",
          createdAt: row.created_at,
        },
      });
    }),
  );

  router.delete(
    "/admin/notifications/:id",
    asyncRoute(async (request, response) => {
      const result = await pool.query(
        "DELETE FROM public.site_notifications WHERE id = $1 RETURNING id",
        [request.params.id],
      );
      if (!result.rowCount) return apiError(response, 404, "Notifikasi tidak ditemukan.");
      await addAudit(
        pool,
        request.adminName,
        "notification_deleted",
        "notification",
        request.params.id,
        {},
      );
      return response.json({ ok: true });
    }),
  );

  router.get(
    "/admin/referrals",
    asyncRoute(async (_request, response) => {
      const program = await getReferralProgram(pool);
      if (!pool) {
        return response.json({
          program,
          currentUserCode: "",
          referrers: [],
          referrals: [],
        });
      }
      try {
        const [partners, referrals] = await Promise.all([
          pool.query(
            `SELECT id, name, email, referral_code, referral_commission_rate, referral_enabled
           FROM public.customer_users
           ORDER BY created_at DESC`,
          ),
          listReferralRows(pool, null, program),
        ]);
        return response.json({
          program,
          currentUserCode: "",
          referrers: partners.rows.map((row) => ({
            id: row.id,
            name: row.name,
            email: row.email,
            code: row.referral_code,
            commissionRate: Number(row.referral_commission_rate ?? program.defaultRate) || 0,
            status: row.referral_enabled ? "Aktif" : "Nonaktif",
            customCommissionRate:
              row.referral_commission_rate === null ? null : Number(row.referral_commission_rate),
          })),
          referrals,
        });
      } catch {
        return response.json({
          program,
          currentUserCode: "",
          referrers: [],
          referrals: [],
        });
      }
    }),
  );

  router.patch(
    "/admin/referrals/partners/:id",
    asyncRoute(async (request, response) => {
      const id = String(request.params.id ?? "");
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
        return apiError(response, 400, "ID mitra tidak valid.");
      }
      const updates = [];
      const values = [];
      if (request.body?.commissionRate !== undefined) {
        const rate = Number(request.body.commissionRate);
        if (!Number.isFinite(rate) || rate < 0 || rate > 100)
          return apiError(response, 400, "Komisi mitra harus antara 0–100%.");
        values.push(rate);
        updates.push(`referral_commission_rate = $${values.length}`);
      }
      if (request.body?.status !== undefined) {
        if (!["Aktif", "Nonaktif"].includes(request.body.status))
          return apiError(response, 400, "Status mitra tidak valid.");
        values.push(request.body.status === "Aktif");
        updates.push(`referral_enabled = $${values.length}`);
      }
      if (!updates.length) return apiError(response, 400, "Tidak ada perubahan mitra.");
      values.push(id);
      const result = await pool.query(
        `UPDATE public.customer_users SET ${updates.join(", ")}
       WHERE id = $${values.length}
       RETURNING id`,
        values,
      );
      if (!result.rowCount) return apiError(response, 404, "Akun mitra tidak ditemukan.");
      await addAudit(pool, request.adminName, "referral_partner_updated", "user", id, request.body);
      return response.json({ ok: true });
    }),
  );

  router.get(
    "/admin/state",
    asyncRoute(async (request, response) => {
      return response.json(await makeState(pool, null, true));
    }),
  );

  router.get(
    "/admin/deposits/:id/proof",
    asyncRoute(async (request, response) => {
      const result = await pool.query(
        "SELECT proof_ciphertext FROM public.customer_deposits WHERE id = $1",
        [request.params.id],
      );
      if (!result.rowCount) return apiError(response, 404, "Bukti deposit tidak ditemukan.");
      return response.json({ proof: decryptPrivate(result.rows[0].proof_ciphertext) });
    }),
  );

  router.post(
    "/admin/deposits/:id/review",
    asyncRoute(async (request, response) => {
      const approved = request.body?.approved === true;
      const note =
        typeof request.body?.note === "string" ? request.body.note.trim().slice(0, 500) : "";
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
          return apiError(
            response,
            409,
            "Aktifkan dan verifikasi akun pengguna sebelum menyetujui deposit.",
          );
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
            [
              deposit.user_id,
              deposit.amount,
              balance.rows[0].deposit_balance,
              deposit.id,
              JSON.stringify({ verifiedBy: request.adminName }),
            ],
          );
        }
        await client.query(
          `INSERT INTO public.customer_admin_audit
           (admin_name, action, target_type, target_id, details)
         VALUES ($1, $2, 'deposit', $3, $4::jsonb)`,
          [
            request.adminName,
            approved ? "deposit_approved" : "deposit_rejected",
            deposit.id,
            JSON.stringify({ note }),
          ],
        );
        await client.query("COMMIT");
        return response.json({ ok: true, status: approved ? "Disetujui" : "Ditolak" });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    }),
  );

  router.post(
    "/admin/withdrawals/:id/review",
    asyncRoute(async (request, response) => {
      const status = request.body?.status;
      const note =
        typeof request.body?.note === "string" ? request.body.note.trim().slice(0, 500) : "";
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
            [
              withdrawal.user_id,
              withdrawal.amount,
              balance.rows[0].main_balance,
              withdrawal.id,
              JSON.stringify({ reason: note }),
            ],
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
          [
            request.adminName,
            `withdrawal_${status.toLowerCase()}`,
            withdrawal.id,
            JSON.stringify({ note }),
          ],
        );
        await client.query("COMMIT");
        return response.json({ ok: true, status });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    }),
  );

  router.patch(
    "/admin/users/:id",
    asyncRoute(async (request, response) => {
      if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          request.params.id,
        )
      ) {
        return apiError(response, 400, "ID pengguna tidak valid.");
      }
      const patch = request.body ?? {};
      if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
        return apiError(response, 400, "Perubahan pengguna tidak valid.");
      }
      const allowed = {};
      const balances = {};
      if (patch.name !== undefined) {
        const name = String(patch.name).trim();
        if (name.length < 2 || name.length > 120)
          return apiError(response, 400, "Nama tidak valid.");
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
        if (
          patch.rate !== null &&
          (!Number.isFinite(Number(patch.rate)) ||
            Number(patch.rate) < 0 ||
            Number(patch.rate) > 100)
        ) {
          return apiError(response, 400, "Tarif harian harus antara 0 dan 100 persen.");
        }
        allowed.daily_rate_override = patch.rate === null ? null : Number(patch.rate);
      }
      for (const field of ["balance", "deposit", "profit"]) {
        if (patch[field] === undefined) continue;
        const value = Number(patch[field]);
        if (!Number.isFinite(value) || value < 0 || value > MAX_MONEY) {
          return apiError(
            response,
            400,
            "Saldo dan profit harus berada dalam rentang yang didukung.",
          );
        }
        balances[field] = Math.round(value * 100) / 100;
      }
      if (!Object.keys(allowed).length && !Object.keys(balances).length) {
        return apiError(response, 400, "Tidak ada perubahan yang valid.");
      }

      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const current = await client.query(
          `SELECT u.name, u.email, u.phone, u.status, a.main_balance, a.deposit_balance, a.total_accrual
         FROM public.customer_users u
         JOIN public.customer_accounts a ON a.user_id = u.id
         WHERE u.id = $1
         FOR UPDATE OF u, a`,
          [request.params.id],
        );
        if (!current.rowCount) {
          await client.query("ROLLBACK");
          return apiError(response, 404, "Pengguna tidak ditemukan.");
        }

        const account = current.rows[0];
        const oldMain = Number(account.main_balance);
        const oldDeposit = Number(account.deposit_balance);
        const oldProfit = Number(account.total_accrual);
        const newProfit = balances.profit ?? oldProfit;
        const newMain =
          balances.balance ?? Math.round((oldMain + newProfit - oldProfit) * 100) / 100;
        const newDeposit = balances.deposit ?? oldDeposit;
        if ([newMain, newDeposit, newProfit].some((value) => value < 0 || value > MAX_MONEY)) {
          await client.query("ROLLBACK");
          return apiError(response, 400, "Saldo setelah perubahan di luar rentang yang didukung.");
        }

        const userEntries = Object.entries(allowed);
        if (userEntries.length) {
          const assignments = userEntries
            .map(([key], index) => `${key} = $${index + 2}`)
            .join(", ");
          await client.query(
            `UPDATE public.customer_users
           SET ${assignments}, updated_at = now()
           WHERE id = $1`,
            [request.params.id, ...userEntries.map(([, value]) => value)],
          );
        }

        const mainDelta = Math.round((newMain - oldMain) * 100) / 100;
        const depositDelta = Math.round((newDeposit - oldDeposit) * 100) / 100;
        const profitChanged = newProfit !== oldProfit;
        if (mainDelta || depositDelta || profitChanged) {
          await client.query(
            `UPDATE public.customer_accounts
           SET main_balance = $2, deposit_balance = $3, total_accrual = $4, updated_at = now()
           WHERE user_id = $1`,
            [request.params.id, newMain, newDeposit, newProfit],
          );
          for (const adjustment of [
            {
              field:
                balances.balance !== undefined ? "balance" : profitChanged ? "profit" : "balance",
              bucket: "main",
              delta: mainDelta,
              before: oldMain,
              after: newMain,
            },
            {
              field: "deposit",
              bucket: "deposit",
              delta: depositDelta,
              before: oldDeposit,
              after: newDeposit,
            },
          ]) {
            if (!adjustment.delta) continue;
            await client.query(
              `INSERT INTO public.customer_ledger_entries
               (user_id, entry_type, bucket, amount, balance_after, source_type, source_id, details)
             VALUES ($1, 'admin_adjustment', $2, $3, $4, 'admin_adjustment', $5, $6::jsonb)`,
              [
                request.params.id,
                adjustment.bucket,
                Math.abs(adjustment.delta),
                adjustment.after,
                randomUUID(),
                JSON.stringify({
                  field: adjustment.field,
                  delta: adjustment.delta,
                  before: adjustment.before,
                  after: adjustment.after,
                  totalAccrualBefore: oldProfit,
                  totalAccrualAfter: newProfit,
                }),
              ],
            );
          }
          if (profitChanged && !mainDelta) {
            const profitDelta = Math.round((newProfit - oldProfit) * 100) / 100;
            if (profitDelta) {
              await client.query(
                `INSERT INTO public.customer_ledger_entries
                 (user_id, entry_type, bucket, amount, balance_after, source_type, source_id, details)
               VALUES ($1, 'admin_adjustment', 'main', $2, $3, 'admin_adjustment', $4, $5::jsonb)`,
                [
                  request.params.id,
                  Math.abs(profitDelta),
                  newMain,
                  randomUUID(),
                  JSON.stringify({
                    field: "profit",
                    delta: profitDelta,
                    before: oldProfit,
                    after: newProfit,
                  }),
                ],
              );
            }
          }
        }
        if (allowed.status === "Diblokir") {
          await client.query("DELETE FROM public.customer_sessions WHERE user_id = $1", [
            request.params.id,
          ]);
        }
        await addAudit(client, request.adminName, "user_updated", "user", request.params.id, {
          fields: [...userEntries.map(([key]) => key), ...Object.keys(balances)],
          balanceDeltas: {
            main: mainDelta,
            deposit: depositDelta,
            totalAccrual: newProfit - oldProfit,
          },
        });
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        if (error?.code === "23505")
          return apiError(response, 409, "Email atau nomor telepon sudah dipakai akun lain.");
        throw error;
      } finally {
        client.release();
      }
      return response.json({ ok: true });
    }),
  );

  router.patch(
    "/admin/compound/settings",
    asyncRoute(async (request, response) => {
      const globalRate = Number(request.body?.globalRate);
      const enabled = request.body?.enabled;
      if (
        !Number.isFinite(globalRate) ||
        globalRate < 0 ||
        globalRate > 100 ||
        typeof enabled !== "boolean"
      ) {
        return apiError(
          response,
          400,
          "Tarif harus antara 0 dan 100 persen dan status harus berupa aktif/nonaktif.",
        );
      }
      await pool.query(
        `UPDATE public.customer_compound_settings
       SET global_rate_percent = $1, enabled = $2, updated_at = now()
       WHERE singleton = true`,
        [globalRate, enabled],
      );
      await addAudit(
        pool,
        request.adminName,
        "compound_settings_updated",
        "compound_settings",
        "global",
        { globalRate, enabled },
      );
      return response.json({ ok: true });
    }),
  );

  router.post(
    "/admin/compound/run",
    asyncRoute(async (request, response) => {
      const result = await runDueCompounding(pool);
      await addAudit(
        pool,
        request.adminName,
        "compound_run_requested",
        "compound_settings",
        result.date,
        result,
      );
      return response.json({ ok: true, ...result });
    }),
  );

  router.post(
    "/admin/referrals/credit",
    asyncRoute(async (request, response) => {
      const userId = String(request.body?.userId ?? "");
      const referralId = String(request.body?.referralId ?? "").trim();
      const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuid.test(userId) || !uuid.test(referralId)) {
        return apiError(response, 400, "Data kredit referral tidak valid.");
      }
      const program = await getReferralProgram(pool);
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const reward = await creditReferralCommission(client, userId, referralId, program);
        if (!reward.eligible) {
          await client.query("ROLLBACK");
          return apiError(
            response,
            409,
            "Referral belum memenuhi syarat deposit atau mitra tidak aktif.",
          );
        }
        if (!reward.credited) {
          await client.query("ROLLBACK");
          return apiError(response, 409, "Kredit referral ini sudah pernah diberikan.");
        }
        await addAudit(client, request.adminName, "referral_credit", "user", userId, {
          referralId,
          amount: reward.amount,
        });
        await client.query("COMMIT");
        return response.json({ ok: true, amount: reward.amount });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    }),
  );

  router.put(
    "/admin/site-settings",
    asyncRoute(async (request, response) => {
      const entries = [];
      if (request.body?.depositContent !== undefined) {
        if (!validateDepositContent(request.body.depositContent))
          return apiError(response, 400, "Pengaturan halaman deposit tidak valid.");
        entries.push(["depositContent", request.body.depositContent]);
      }
      if (request.body?.bankAccounts !== undefined) {
        if (!validateBankAccounts(request.body.bankAccounts))
          return apiError(response, 400, "Daftar rekening tujuan tidak valid.");
        entries.push(["bankAccounts", request.body.bankAccounts]);
      }
      if (!entries.length) return apiError(response, 400, "Tidak ada pengaturan yang valid.");
      for (const [key, value] of entries) {
        inMemoryStore.settings.set(key, value);
        if (pool) {
          try {
            await pool.query(
              `INSERT INTO public.customer_site_settings (setting_key, setting_value)
             VALUES ($1, $2::jsonb)
             ON CONFLICT (setting_key)
             DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = now()`,
              [key, JSON.stringify(value)],
            );
          } catch {
            // In-memory updated
          }
        }
      }
      await addAudit(
        pool,
        request.adminName,
        "deposit_settings_updated",
        "site_settings",
        "deposit",
        { updated: entries.map(([key]) => key) },
      );
      return response.json({ ok: true });
    }),
  );

  router.use((_request, response) => apiError(response, 404, "API route not found."));
  router.use((error, request, response, _next) => {
    if (error instanceof ConfigurationError) {
      return apiError(
        response,
        503,
        "Enkripsi data keuangan belum dikonfigurasi. Atur SESSION_SECRET di lingkungan server.",
      );
    }
    console.error(
      `API request failed: ${request.method} ${request.path} (${error?.name ?? "Error"}).`,
    );
    return apiError(response, 500, "Permintaan gagal diproses.");
  });
  return router;
}
