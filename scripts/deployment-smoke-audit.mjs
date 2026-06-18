/**
 * RequestFlow deployment smoke audit (Playwright).
 * Short, deployment-focused checks after build/start.
 * Usage: npm run audit:deployment-smoke
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "scripts", "deployment-smoke-output");

const USER_URL = "http://localhost:3000";
const ADMIN_URL = "http://localhost:3001";
const API_URL = "http://127.0.0.1:4000";
const PASSWORD = "requestflow";

const VIEWPORTS = [
  { name: "375", width: 375, height: 667 },
  { name: "1440", width: 1440, height: 900 },
];

const KNOWN_RSC_NOISE = /Failed to fetch RSC payload|Load failed|AbortError|prefetch/i;
const EXPECTED_AUTH_401 = new Set();

const report = {
  safetyConfirmation:
    "No reseed, prisma db seed, migrate reset, truncate, delete, recreate, or direct database edit was performed. RF-2026-0008 was not modified.",
  testedAt: null,
  environment: {},
  flows: [],
  layoutChecks: [],
  collectors: {
    reactWarnings: [],
    consoleErrors: [],
    apiErrors: [],
    chunkErrors: [],
    corsErrors: [],
    failedRequests: [],
  },
  finalVerdict: null,
};

function pushFlow(flow, result, notes = "") {
  report.flows.push({ flow, result, notes, at: new Date().toISOString() });
}

function attachObservers(page) {
  page.on("console", (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (type === "warning" && text.includes("Cannot update a component")) {
      report.collectors.reactWarnings.push({ text: text.slice(0, 200), url: page.url() });
    }
    if (type === "error" && !KNOWN_RSC_NOISE.test(text)) {
      if (/CORS|blocked by CORS/i.test(text)) {
        report.collectors.corsErrors.push({ text: text.slice(0, 200), url: page.url() });
      } else {
        report.collectors.consoleErrors.push({ text: text.slice(0, 200), url: page.url() });
      }
    }
  });

  page.on("requestfailed", (req) => {
    const url = req.url();
    const failure = req.failure()?.errorText ?? "failed";
    if (KNOWN_RSC_NOISE.test(failure)) return;
    if (url.includes("localhost:4000") || url.includes("/_next/data/")) {
      report.collectors.failedRequests.push({ url, failure, pageUrl: page.url() });
    }
  });

  page.on("response", (res) => {
    const url = res.url();
    const status = res.status();
    if (status >= 400 && url.includes("localhost:4000")) {
      const key = `${url}:${status}`;
      if (status === 401 && EXPECTED_AUTH_401.has(key)) return;
      report.collectors.apiErrors.push({ url, status, pageUrl: page.url() });
    }
    if (status >= 400 && url.includes("/_next/static/")) {
      report.collectors.chunkErrors.push({ url, status, pageUrl: page.url() });
    }
  });
}

async function waitForLoginForm(page) {
  await page.waitForFunction(
    () => document.querySelector("#login-email") || location.pathname.includes("/dashboard"),
    { timeout: 60_000 },
  );
  if (page.url().includes("/dashboard")) return;
  await page.waitForSelector("#login-email", { state: "visible", timeout: 15_000 });
}

async function loginPortal(page, baseUrl, email, storageKey) {
  await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await waitForLoginForm(page);
  if (page.url().includes("/dashboard")) return;
  await page.fill("#login-email", email);
  await page.fill("#login-password", PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((u) => !u.pathname.endsWith("/login"), { timeout: 30_000 });
  const session = await page.evaluate((key) => localStorage.getItem(key), storageKey);
  if (!session) throw new Error(`No session in ${storageKey}`);
}

async function checkRoute(page, label, route, expectSelector) {
  try {
    await page.goto(route.startsWith("http") ? route : `${page.url().split("/").slice(0, 3).join("/")}${route}`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForSelector("main", { state: "visible", timeout: 30_000 });
    await page.waitForFunction(
      () => (document.querySelector("main")?.textContent?.trim().length ?? 0) > 15,
      { timeout: 20_000 },
    ).catch(() => {});
    const blank = await page.evaluate(() => {
      const main = document.querySelector("main");
      return !main || (main.textContent?.trim().length ?? 0) < 10;
    });
    let selectorOk = true;
    if (expectSelector) {
      selectorOk = (await page.locator(expectSelector).count()) > 0;
    }
    const ok = !blank && selectorOk;
    pushFlow(label, ok ? "pass" : "fail", blank ? "Blank main content" : selectorOk ? route : `Missing ${expectSelector}`);
    return ok;
  } catch (err) {
    pushFlow(label, "fail", String(err).slice(0, 160));
    return false;
  }
}

async function checkHorizontalScroll(page, portal, route, viewport) {
  const base = portal === "admin" ? ADMIN_URL : USER_URL;
  await page.setViewportSize(viewport);
  await page.goto(`${base}${route}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("main", { timeout: 30_000 }).catch(() => {});
  const layout = await page.evaluate((vp) => {
    const vw = document.documentElement.clientWidth;
    const scrollW = document.documentElement.scrollWidth;
    return { viewport: vp, clientWidth: vw, scrollWidth: scrollW, horizontalScroll: scrollW > vw + 1 };
  }, viewport.name);
  report.layoutChecks.push({ portal, route, ...layout, result: layout.horizontalScroll ? "fail" : "pass" });
}

async function probeEnvironment() {
  const env = {
    userUrl: USER_URL,
    adminUrl: ADMIN_URL,
    apiUrl: API_URL,
    node: process.version,
    browser: "chromium (playwright)",
  };
  try {
    const health = await fetch(`${API_URL}/health`);
    env.apiHealth = health.ok ? await health.json() : { status: health.status };
  } catch (e) {
    env.apiHealth = { error: String(e) };
  }
  return env;
}

function computeVerdict() {
  const flowFails = report.flows.filter((f) => f.result === "fail").length;
  const layoutFails = report.layoutChecks.filter((l) => l.result === "fail").length;
  const staleChunks = report.collectors.chunkErrors.length > 0;
  const critical =
    report.collectors.corsErrors.length > 0 ||
    report.collectors.reactWarnings.length > 0 ||
    report.collectors.apiErrors.filter((e) => e.status >= 500).length > 0;

  if (flowFails > 0 || layoutFails > 0 || critical) {
    report.finalVerdict = staleChunks && flowFails === 0 && !critical ? "pass-with-warnings" : "fail";
    if (staleChunks) report.staleChunkWarning = "Restart next start processes after npm run build";
    return;
  }
  const partial = report.collectors.apiErrors.length > 0 || report.collectors.consoleErrors.length > 0;
  report.finalVerdict = partial ? "pass-with-warnings" : "pass";
}

function buildMarkdown() {
  const lines = [
    "# RequestFlow Deployment Smoke Report",
    "",
    `**Tested:** ${report.testedAt}`,
    `**Script:** \`scripts/deployment-smoke-audit.mjs\``,
    `**Verdict:** ${report.finalVerdict}`,
    "",
    "## Safety",
    report.safetyConfirmation,
    "",
    "## Environment",
    "```json",
    JSON.stringify(report.environment, null, 2),
    "```",
    "",
    "## Flow results",
    "| Flow | Result | Notes |",
    "|------|--------|-------|",
    ...report.flows.map((f) => `| ${f.flow} | ${f.result} | ${f.notes.replace(/\|/g, "\\|")} |`),
    "",
    "## Layout (horizontal scroll)",
    "| Portal | Route | Viewport | Result | scrollWidth |",
    "|--------|-------|----------|--------|-------------|",
    ...report.layoutChecks.map(
      (l) => `| ${l.portal} | ${l.route} | ${l.viewport} | ${l.result} | ${l.scrollWidth} |`,
    ),
    "",
    "## Issues",
    `- React warnings: ${report.collectors.reactWarnings.length}`,
    `- API errors (4xx/5xx): ${report.collectors.apiErrors.length}`,
    `- Chunk errors: ${report.collectors.chunkErrors.length}`,
    `- CORS errors: ${report.collectors.corsErrors.length}`,
    `- Critical failed requests: ${report.collectors.failedRequests.length}`,
    "",
    "**Re-run:** `npm run audit:deployment-smoke`",
    "**Requires:** API :4000, user :3000, admin :3001 (use localhost in browser).",
  ];
  return lines.join("\n");
}

async function main() {
  report.testedAt = new Date().toISOString();
  report.environment = await probeEnvironment();

  if (report.environment.apiHealth?.error) {
    console.error("API not reachable at", API_URL);
    pushFlow("api-health", "fail", String(report.environment.apiHealth.error));
    computeVerdict();
    await mkdir(OUT_DIR, { recursive: true });
    await writeFile(path.join(OUT_DIR, "report.json"), JSON.stringify(report, null, 2));
    await writeFile(path.join(OUT_DIR, "deployment-smoke-report.md"), buildMarkdown());
    process.exit(1);
  }
  pushFlow("api-health", "pass", "GET /health OK");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: VIEWPORTS[0] });
  const page = await context.newPage();
  attachObservers(page);

  try {
    await loginPortal(page, USER_URL, "musa@requestflow.local", "requestflow_session");
    pushFlow("user-login", "pass", "Redirected after login");

    await checkRoute(page, "user-dashboard", `${USER_URL}/dashboard`, "header");
    await checkRoute(page, "user-requests", `${USER_URL}/requests`, "main");
    await checkRoute(page, "user-create-request", `${USER_URL}/requests/create`, "main");

    await page.goto(`${USER_URL}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.locator("button[aria-label='User menu']").click();
    await page.getByRole("menuitem", { name: /log out/i }).click();
    await page.waitForURL((u) => u.pathname.includes("/login"), { timeout: 15_000 }).catch(() => {});
    const userLogoutOk = page.url().includes("/login");
    pushFlow("user-logout-redirect", userLogoutOk ? "pass" : "partial", page.url());

    await page.evaluate(() => localStorage.removeItem("requestflow_session"));
    await loginPortal(page, ADMIN_URL, "admin@requestflow.local", "requestflow_admin_session");
    pushFlow("admin-login", "pass", "Admin session established");

    await checkRoute(page, "admin-dashboard", `${ADMIN_URL}/dashboard`, "[data-rf-page='admin-dashboard']");
    await checkRoute(page, "admin-users", `${ADMIN_URL}/users`, "table, [role='table']");
    await checkRoute(page, "admin-settings", `${ADMIN_URL}/settings`, "main");
    await checkRoute(page, "admin-logs", `${ADMIN_URL}/logs`, "main");

    await page.evaluate(() => localStorage.removeItem("requestflow_admin_session"));
    await page.goto(`${ADMIN_URL}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    const adminProtected = page.url().includes("/login");
    pushFlow("admin-protected-redirect", adminProtected ? "pass" : "fail", `Landed on ${page.url()}`);

    for (const vp of VIEWPORTS) {
      await checkHorizontalScroll(page, "user", "/dashboard", vp);
      await checkHorizontalScroll(page, "admin", "/dashboard", vp);
    }
  } catch (err) {
    pushFlow("smoke-exception", "fail", String(err).slice(0, 200));
    console.error(err);
  } finally {
    await browser.close();
  }

  computeVerdict();
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(path.join(OUT_DIR, "report.json"), JSON.stringify(report, null, 2));
  await writeFile(path.join(OUT_DIR, "deployment-smoke-report.md"), buildMarkdown());

  console.log(`Deployment smoke: ${report.finalVerdict}`);
  console.log(`Report: ${path.join(OUT_DIR, "deployment-smoke-report.md")}`);
  process.exit(report.finalVerdict === "fail" ? 1 : 0);
}

main();
