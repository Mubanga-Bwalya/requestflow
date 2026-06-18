/**
 * Verifies skeleton loading states and layout at key viewports (production builds).
 * Usage: node scripts/loading-polish-audit.mjs
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const VIEWPORTS = [
  { name: "320", width: 320, height: 568 },
  { name: "375", width: 375, height: 667 },
  { name: "768", width: 768, height: 1024 },
  { name: "1024", width: 1024, height: 768 },
  { name: "1440", width: 1440, height: 900 },
];

const OUT_DIR = path.join("C:", "Projects", "RequestFlow", "scripts", "loading-polish-output");

const USER_PAGES = ["/dashboard", "/requests", "/tasks"];
const ADMIN_PAGES = ["/dashboard", "/users", "/departments", "/templates", "/reports", "/settings"];

const API = "http://127.0.0.1:4000";

const ROUTE_READY = {
  admin: {
    "/dashboard": "[data-rf-page='admin-dashboard']",
  },
};

async function apiLogin(email, portal) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "requestflow" }),
  });
  if (!res.ok) throw new Error(`Login failed for ${email}: ${res.status}`);
  const data = await res.json();
  const base = {
    accessToken: data.accessToken,
    expiresAt: Date.now() + data.expiresIn * 1000,
    userId: data.user.id,
    email: data.user.email,
    fullName: data.user.fullName,
    roleName: data.user.roleName,
  };
  if (portal === "user") {
    return {
      ...base,
      jobTitle: data.user.jobTitle ?? null,
      departmentName: data.user.departmentName,
      inboxDepartmentName: data.user.inboxDepartmentName ?? null,
      managedDepartmentNames: data.user.managedDepartmentNames ?? [],
    };
  }
  return base;
}

async function waitForAppReady(page, portal, route) {
  const readySelector = ROUTE_READY[portal]?.[route];
  await page.waitForSelector("header", { state: "visible", timeout: 60_000 });
  await page.waitForSelector("main", { state: "visible", timeout: 30_000 });

  const shellMarker = page.locator("[data-rf-shell]");
  if ((await shellMarker.count()) > 0) {
    await shellMarker.waitFor({ state: "visible", timeout: 10_000 });
  }

  if (readySelector) {
    await page.waitForSelector(readySelector, { state: "visible", timeout: 12_000 }).catch(() => {});
  }

  await page.waitForFunction(
    () => {
      const main = document.querySelector("main");
      if (!main || (main.textContent?.trim().length ?? 0) < 12) return false;
      const fullScreenLoading = document.querySelector("body > div[aria-label='Loading']");
      return !fullScreenLoading;
    },
    { timeout: 30_000 },
  );

  await page.waitForLoadState("networkidle", { timeout: 12_000 }).catch(() => {});

  let stable = 0;
  let lastWidth = 0;
  for (let i = 0; i < 6; i++) {
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    if (width === lastWidth) stable += 1;
    else stable = 0;
    lastWidth = width;
    if (stable >= 2) break;
    await page.waitForTimeout(200);
  }
}

async function auditLoadedPage(page, label) {
  return page.evaluate((pageLabel) => {
    const vw = document.documentElement.clientWidth;
    const scrollW = document.documentElement.scrollWidth;
    const plainLoading = Array.from(document.querySelectorAll("p, span, div"))
      .filter((el) => {
        const t = el.textContent?.trim() ?? "";
        return /^(Loading(\.\.\.|…)|Loading [a-z][a-z\s]+…)$/i.test(t) && el.children.length === 0;
      })
      .map((el) => el.textContent?.trim());

    const skeletons = document.querySelectorAll(
      '[aria-label="Loading list"], [role="status"][aria-label*="Loading"]',
    );
    const pulseEls = document.querySelectorAll(".animate-pulse");

    return {
      label: pageLabel,
      viewport: vw,
      horizontalScroll: scrollW > vw + 1,
      scrollWidth: scrollW,
      plainLoadingTexts: [...new Set(plainLoading)].slice(0, 5),
      skeletonRegions: skeletons.length,
      pulseElements: pulseEls.length,
      hasShell: !!(
        document.querySelector("[data-rf-shell]") ||
        (document.querySelector("header") && document.querySelector("main"))
      ),
      bodyTextLen: document.body.innerText.length,
    };
  }, label);
}

async function runPortal(browser, { baseUrl, email, pages, portal, storageKey }) {
  const session = await apiLogin(email, portal);
  const context = await browser.newContext();
  await context.addInitScript(
    ({ key, value }) => {
      localStorage.setItem(key, JSON.stringify(value));
    },
    { key: storageKey, value: session },
  );
  const page = await context.newPage();
  const results = [];

  page.on("console", (msg) => {
    if (msg.type() === "warning" && msg.text().includes("Cannot update a component")) {
      results.push({ portal, type: "react-warning", detail: msg.text().slice(0, 200) });
    }
  });

  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await waitForAppReady(page, portal, "/dashboard");

  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });

    for (const route of pages) {
      await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      try {
        await waitForAppReady(page, portal, route);
      } catch (err) {
        results.push({
          portal,
          route,
          viewportName: vp.name,
          type: "bootstrap-timeout",
          detail: err instanceof Error ? err.message : String(err),
          hasShell: false,
          horizontalScroll: true,
        });
        continue;
      }
      const audit = await auditLoadedPage(page, `${portal}${route}@${vp.name}`);
      results.push({ ...audit, portal, route, viewportName: vp.name });
    }
  }

  await context.close();
  return results;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  const userResults = await runPortal(browser, {
    baseUrl: "http://localhost:3000",
    email: "musa@requestflow.local",
    pages: USER_PAGES,
    portal: "user",
    storageKey: "requestflow_session",
  });

  const adminResults = await runPortal(browser, {
    baseUrl: "http://localhost:3001",
    email: "admin@requestflow.local",
    pages: ADMIN_PAGES,
    portal: "admin",
    storageKey: "requestflow_admin_session",
  });

  await browser.close();

  const all = [...userResults, ...adminResults];
  const summary = {
    testedAt: new Date().toISOString(),
    totalChecks: all.length,
    horizontalScrollIssues: all.filter((r) => r.horizontalScroll),
    plainLoadingOnLoadedPages: all.filter((r) => r.plainLoadingTexts?.length),
    reactWarnings: all.filter((r) => r.type === "react-warning"),
    bootstrapTimeouts: all.filter((r) => r.type === "bootstrap-timeout"),
    missingShell: all.filter((r) => r.hasShell === false),
    results: all,
  };

  await writeFile(path.join(OUT_DIR, "report.json"), JSON.stringify(summary, null, 2));
  console.log(
    JSON.stringify(
      {
        totalChecks: summary.totalChecks,
        horizontalScroll: summary.horizontalScrollIssues.length,
        plainLoading: summary.plainLoadingOnLoadedPages.length,
        reactWarnings: summary.reactWarnings.length,
        bootstrapTimeouts: summary.bootstrapTimeouts.length,
        missingShell: summary.missingShell.length,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
