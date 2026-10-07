import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const configuredBaseUrl = process.env.E2E_BASE_URL;
const port = Number(process.env.E2E_PORT) || 5101;
const baseUrl = configuredBaseUrl || `http://127.0.0.1:${port}`;
const adminUsername = configuredBaseUrl ? process.env.E2E_ADMIN_USERNAME : "smoke-test";
const adminPassword = configuredBaseUrl ? process.env.E2E_ADMIN_PASSWORD : "smoke-test-only";
const browserPath =
  process.env.CHROMIUM_PATH ||
  (existsSync("/repl/tools/bin/chromium") ? "/repl/tools/bin/chromium" : undefined);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function getRoutePaths() {
  const routesDirectory = path.join(projectRoot, "src/routes");
  const files = await readdir(routesDirectory);
  const paths = new Set();

  for (const file of files.filter((name) => name.endsWith(".tsx"))) {
    const source = await readFile(path.join(routesDirectory, file), "utf8");
    for (const match of source.matchAll(/createFileRoute\(\s*(['"])([^'"]+)\1\s*\)/g)) {
      const route = match[2];
      if (route) {
        paths.add(route.replace(/\$id/g, "1").replace(/\$symbol/g, "EURUSD"));
      }
    }
  }

  return [...paths].sort();
}

async function waitForDatabase() {
  const deadline = Date.now() + 45_000;
  let lastStatus = "server not ready";

  while (Date.now() < deadline) {
    try {
      const response = await fetch(new URL("/api/health", baseUrl));
      const health = await response.json();
      if (response.ok && health.database === "connected") return health;
      lastStatus = `HTTP ${response.status}: ${JSON.stringify(health)}`;
    } catch {
      lastStatus = "waiting for Express";
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Production server/PostgreSQL health check failed: ${lastStatus}`);
}

let serverProcess;
let browser;

try {
  assert(
    adminUsername && adminPassword,
    "Set E2E_ADMIN_USERNAME and E2E_ADMIN_PASSWORD when testing an external deployment.",
  );

  const productionAssetsDirectory = path.join(projectRoot, "dist", "assets");
  const productionScripts = (await readdir(productionAssetsDirectory))
    .filter((name) => name.endsWith(".js"))
    .map((name) => path.join(productionAssetsDirectory, name));
  const productionBundle = (
    await Promise.all(productionScripts.map((file) => readFile(file, "utf8")))
  ).join("\n");
  for (const demoCredential of ["admin@demo.test", "Demo@1234", "Admin@123"]) {
    assert(
      !productionBundle.includes(demoCredential),
      `Development-only demo credential ${demoCredential} was included in the production bundle.`,
    );
  }

  if (!configuredBaseUrl) {
    serverProcess = spawn(process.execPath, ["server/index.js"], {
      cwd: projectRoot,
      env: {
        ...process.env,
        NODE_ENV: "production",
        PORT: String(port),
        ADMIN_USERNAME: adminUsername,
        ADMIN_PASSWORD: adminPassword,
      },
      stdio: "inherit",
    });
  }

  const health = await waitForDatabase();
  console.log(`PostgreSQL: ${health.database}`);

  const marketCatalogResponse = await fetch(new URL("/api/market", baseUrl));
  assert(marketCatalogResponse.status === 200, "The public market catalog API did not respond.");
  const marketCatalog = await marketCatalogResponse.json();
  assert(
    marketCatalog.quoteMode === "illustrative" &&
      marketCatalog.groups.includes("Metal") &&
      marketCatalog.products.some((product) => product.symbol === "XAUUSD"),
    "The PostgreSQL market catalog or its illustrative-price label is missing.",
  );
  const brokerOrdersResponse = await fetch(new URL("/api/market/orders", baseUrl));
  assert(
    brokerOrdersResponse.status === 404,
    "A broker order endpoint was unexpectedly exposed under the market API.",
  );

  const adminUrl = new URL("/admin", baseUrl);
  const anonymousAdminResponse = await fetch(adminUrl);
  assert(
    anonymousAdminResponse.status === 401,
    "Production admin page was accessible without credentials.",
  );
  const adminAuthorization = Buffer.from(`${adminUsername}:${adminPassword}`).toString("base64");
  const authenticatedAdminResponse = await fetch(adminUrl, {
    headers: { Authorization: `Basic ${adminAuthorization}` },
  });
  assert(authenticatedAdminResponse.status === 200, "Configured admin credentials were rejected.");

  browser = await chromium.launch({
    headless: true,
    ...(browserPath ? { executablePath: browserPath } : {}),
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 850 },
    httpCredentials: { username: adminUsername, password: adminPassword },
  });
  const page = await context.newPage();
  const browserErrors = [];

  page.on("pageerror", (error) => browserErrors.push(`Page error: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(`Console error: ${message.text()}`);
  });

  const routes = await getRoutePaths();
  assert(routes.length > 0, "No TanStack file routes were found.");

  for (const route of routes) {
    const errorCountBeforeNavigation = browserErrors.length;
    const response = await page.goto(new URL(route, baseUrl).href, {
      waitUntil: "domcontentloaded",
      timeout: 20_000,
    });
    assert(
      response?.status() === 200,
      `${route} returned HTTP ${response?.status() ?? "no response"}.`,
    );
    await page.locator("#root main").first().waitFor({ state: "visible", timeout: 10_000 });

    const content = await page.locator("#root").innerText();
    assert(content.trim().length > 0, `${route} rendered an empty page.`);
    assert(
      !/Page not found|This page didn't load/.test(content),
      `${route} rendered an error page.`,
    );
    assert(
      browserErrors.length === errorCountBeforeNavigation,
      `${route} produced a browser error: ${browserErrors.slice(errorCountBeforeNavigation).join("; ")}`,
    );
  }
  console.log(`Pages: ${routes.length}/${routes.length} routes rendered without browser errors.`);

  await page.goto(new URL("/", baseUrl).href);
  await page.getByRole("button", { name: "Slide 2: Belajar dengan akun demo" }).click();
  assert(
    /Akun Demo/i.test(await page.locator("h1").innerText()),
    "Welcome carousel did not change slides.",
  );

  await page.goto(new URL("/login", baseUrl).href);
  assert(
    (await page.getByRole("tab", { name: "MT5" }).count()) === 0,
    "The removed MT5 login tab is still visible.",
  );
  assert(
    (await page.getByRole("heading", { name: "Akun Demo" }).count()) === 0,
    "Development demo credentials were exposed in the production login page.",
  );
  await page.getByRole("tab", { name: "Email" }).click();
  assert(
    await page.getByRole("textbox", { name: "Email" }).isVisible(),
    "Email login tab did not switch.",
  );
  await page.getByRole("button", { name: "Lupa Kata Sandi" }).click();
  assert(await page.getByRole("dialog").isVisible(), "Forgot-password dialog did not open.");
  await page.getByRole("button", { name: "Kembali", exact: true }).click();

  await page.goto(new URL("/register", baseUrl).href);
  const registerButton = page.getByRole("button", { name: "Daftar", exact: true });
  assert(
    await registerButton.isDisabled(),
    "Registration was enabled before required fields were complete.",
  );

  await page.goto(new URL("/pasar/", baseUrl).href);
  await page.locator(".market-row").first().waitFor({ state: "visible", timeout: 10_000 });
  assert(
    (await page.locator(".market-quote-notice").innerText()).includes(
      "bukan kuotasi pasar langsung",
    ),
    "The market's illustrative-price disclosure is missing.",
  );
  await page.getByRole("tab", { name: "Metal" }).click();
  assert(
    (await page.locator(".market-row").filter({ hasText: "XAUUSD" }).count()) === 1,
    "Market category selection failed.",
  );
  const favoriteButton = page
    .locator(".market-row")
    .filter({ hasText: "XAUUSD" })
    .locator("button.market-star");
  const favoriteBefore = await favoriteButton.getAttribute("aria-pressed");
  await favoriteButton.click();
  assert(
    (await favoriteButton.getAttribute("aria-pressed")) !== favoriteBefore,
    "Market favorite toggle failed.",
  );

  await page
    .locator(".market-row")
    .filter({ hasText: "XAUUSD" })
    .locator("a.market-product-link")
    .click();
  await page.waitForURL("**/pasar/XAUUSD");
  assert(
    (await page.getByRole("button", { name: "Beli", exact: true }).count()) === 0 &&
      (await page.getByRole("button", { name: "Jual", exact: true }).count()) === 0 &&
      (await page.getByRole("tab", { name: "Signals", exact: true }).count()) === 0 &&
      (await page.getByRole("tab", { name: "Pesanan", exact: true }).count()) === 0,
    "The market detail page exposed broker-trading controls.",
  );

  await page.goto(new URL("/cari-produk", baseUrl).href);
  const search = page.getByRole("textbox", { name: "Pencarian Cepat" });
  await search.fill("XAUUSD");
  await page
    .locator(".market-row")
    .filter({ hasText: "XAUUSD" })
    .waitFor({ state: "visible", timeout: 10_000 });
  assert(
    (await page.locator(".market-row").count()) === 1,
    "Market search did not filter to the requested product.",
  );
  await page.getByRole("button", { name: "Hapus pencarian" }).click();
  assert(
    (await page.locator(".market-row").count()) > 1,
    "Clearing market search did not restore the product list.",
  );

  await page.goto(new URL("/admin", baseUrl).href);
  await page.getByRole("link", { name: "Kelola Pasar" }).click();
  await page.waitForURL("**/admin/pasar");
  assert(
    (await page.locator("#root").innerText()).includes("Kelola Pasar"),
    "Admin navigation did not open market management.",
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(new URL("/beranda", baseUrl).href);
  const mobileNavigation = page.getByRole("navigation", { name: "Navigasi utama" });
  await mobileNavigation.waitFor({ state: "visible", timeout: 10_000 });
  assert(
    await mobileNavigation.isVisible(),
    "Primary navigation is not visible at a mobile viewport.",
  );

  await page.goto(new URL("/bahasa", baseUrl).href);
  await page.getByRole("radio", { name: "English" }).click();
  await page.waitForFunction(() => localStorage.getItem("hsb-language") === "en");
  await page.goto(new URL("/beranda", baseUrl).href);
  const englishHomeHeading = page.getByRole("heading", { name: "Trading Signals" });
  await englishHomeHeading.waitFor({ state: "visible", timeout: 10_000 });
  assert(
    await englishHomeHeading.isVisible(),
    "English language selection did not translate the home screen.",
  );
  await page.goto(new URL("/pasar", baseUrl).href);
  const englishMarketHeading = page.getByRole("heading", { name: "Markets" });
  await englishMarketHeading.waitFor({ state: "visible", timeout: 10_000 });
  assert(
    await englishMarketHeading.isVisible(),
    "English language selection did not translate the market screen.",
  );
  await page.goto(new URL("/login", baseUrl).href);
  const englishLoginHeading = page.getByRole("heading", { name: "Sign in" });
  await englishLoginHeading.waitFor({ state: "visible", timeout: 10_000 });
  assert(
    await englishLoginHeading.isVisible(),
    "The selected language was not retained on the login screen.",
  );

  await page.goto(new URL("/bahasa", baseUrl).href);
  await page.getByRole("radio", { name: "汉语" }).click();
  await page.waitForFunction(() => localStorage.getItem("hsb-language") === "zh");
  await page.goto(new URL("/beranda", baseUrl).href);
  const chineseHomeHeading = page.getByRole("heading", { name: "交易信号" });
  await chineseHomeHeading.waitFor({ state: "visible", timeout: 10_000 });
  assert(
    await chineseHomeHeading.isVisible(),
    "Chinese language selection did not translate the home screen.",
  );

  await page.goto(new URL("/bahasa", baseUrl).href);
  await page.getByRole("radio", { name: "Bahasa Indonesia" }).click();
  await page.waitForFunction(() => localStorage.getItem("hsb-language") === "id");
  await page.goto(new URL("/profil", baseUrl).href);
  await page.getByRole("button", { name: "Aktifkan mode gelap" }).click();
  await page.waitForFunction(() => document.documentElement.classList.contains("dark"));
  await page.waitForFunction(() => localStorage.getItem("hsb-theme") === "dark");
  await page.reload();
  await page.waitForFunction(() => document.documentElement.classList.contains("dark"));
  assert(
    await page.locator("html").evaluate((element) => element.classList.contains("dark")),
    "Dark mode did not persist after reload.",
  );
  await page.getByRole("button", { name: "Aktifkan mode terang" }).click();
  await page.waitForFunction(() => !document.documentElement.classList.contains("dark"));

  assert(browserErrors.length === 0, `Browser reported errors: ${browserErrors.join("; ")}`);

  console.log(
    "Interactions: carousel, login UI, registration validation, market tabs/favorites/search, admin navigation, mobile navigation, language switching, and dark mode passed.",
  );
  console.log("Note: this smoke test did not create a customer account or financial transaction.");
} finally {
  await browser?.close();
  if (serverProcess && serverProcess.exitCode === null) {
    const exit = new Promise((resolve) => serverProcess.once("exit", resolve));
    serverProcess.kill();
    await exit;
  }
}
