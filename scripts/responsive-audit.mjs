import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const VIEWPORTS = [
  { name: "mobile-sm", width: 320, height: 568 },
  { name: "mobile", width: 375, height: 667 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 800 },
  { name: "wide", width: 1920, height: 1080 },
];

const OUT_DIR = path.join("C:", "Projects", "RequestFlow", "scripts", "responsive-audit-output");

async function auditPage(page, label) {
  return page.evaluate((pageLabel) => {
    const vw = document.documentElement.clientWidth;
    const scrollW = document.documentElement.scrollWidth;
    const issues = [];

    if (scrollW > vw + 1) {
      issues.push({
        type: "horizontal-overflow",
        severity: "high",
        detail: `Page scroll width ${scrollW}px exceeds viewport ${vw}px`,
      });
    }

    const offenders = [];
    for (const el of document.querySelectorAll("body *")) {
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) continue;
      if (rect.right > vw + 2) {
        const tag = el.tagName.toLowerCase();
        const id = el.id ? `#${el.id}` : "";
        const cls = el.className && typeof el.className === "string" ? `.${el.className.split(/\s+/).slice(0, 2).join(".")}` : "";
        offenders.push({
          selector: `${tag}${id}${cls}`,
          overflowPx: Math.round(rect.right - vw),
          width: Math.round(rect.width),
        });
      }
    }

    offenders.sort((a, b) => b.overflowPx - a.overflowPx);
    for (const o of offenders.slice(0, 5)) {
      issues.push({
        type: "element-overflow",
        severity: o.overflowPx > 24 ? "high" : "medium",
        detail: `${o.selector} extends ${o.overflowPx}px past viewport (width ${o.width}px)`,
      });
    }

    const smallTargets = [];
    for (const el of document.querySelectorAll("button, a, [role='button'], input[type='checkbox'], input[type='radio']")) {
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) continue;
      if (rect.width < 44 || rect.height < 44) {
        const label = el.getAttribute("aria-label") || el.textContent?.trim().slice(0, 40) || el.tagName;
        smallTargets.push({ label, w: Math.round(rect.width), h: Math.round(rect.height) });
      }
    }

    for (const t of smallTargets.slice(0, 5)) {
      issues.push({
        type: "small-touch-target",
        severity: "medium",
        detail: `"${t.label}" is ${t.w}x${t.h}px (recommended min 44x44)`,
      });
    }

    const menuBtn = document.querySelector("button[aria-label='Open navigation menu']");
    const desktopSidebar = document.querySelector("aside.hidden.md\\:block, aside.hidden.w-64");
    const mobileDrawer = document.querySelector("[aria-label*='navigation menu']");

    return {
      label: pageLabel,
      viewport: { width: vw, height: window.innerHeight },
      scrollWidth: scrollW,
      hasMenuButton: !!menuBtn,
      menuButtonVisible: menuBtn ? window.getComputedStyle(menuBtn).display !== "none" : false,
      desktopSidebarVisible: desktopSidebar ? window.getComputedStyle(desktopSidebar).display !== "none" : null,
      mobileDrawerPresent: !!mobileDrawer,
      issues,
    };
  }, label);
}

async function login(page, baseUrl, email, password) {
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.fill("#login-email", email);
  await page.fill("#login-password", password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((url) => !url.pathname.endsWith("/login"), { timeout: 20000 });
}

async function bootstrapSession(page, baseUrl, email, password, storageKey) {
  const loginRes = await page.request.post("http://localhost:4000/auth/login", {
    data: { email, password },
  });
  if (!loginRes.ok()) {
    throw new Error(`API login failed (${loginRes.status()}): ${await loginRes.text()}`);
  }
  const payload = await loginRes.json();
  const meRes = await page.request.get("http://localhost:4000/auth/me", {
    headers: { Authorization: `Bearer ${payload.accessToken}` },
  });
  if (!meRes.ok()) {
    throw new Error(`API /auth/me failed (${meRes.status()})`);
  }
  const me = await meRes.json();
  const expiresAt = Date.now() + (payload.expiresIn ?? 28_800) * 1000;
  const session =
    storageKey === "requestflow_admin_session"
      ? {
          accessToken: payload.accessToken,
          expiresAt,
          userId: me.id,
          email: me.email,
          fullName: me.fullName,
          roleName: me.roleName ?? null,
        }
      : {
          accessToken: payload.accessToken,
          expiresAt,
          userId: me.id,
          email: me.email,
          fullName: me.fullName,
          roleName: me.roleName ?? null,
          jobTitle: me.jobTitle ?? null,
          departmentName: me.departmentName ?? null,
          inboxDepartmentName: me.inboxDepartmentName ?? null,
          managedDepartmentNames: me.managedDepartmentNames ?? [],
        };

  await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ([key, value]) => localStorage.setItem(key, value),
    [storageKey, JSON.stringify(session)],
  );
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "networkidle" });
}

async function runSuite(browser, suite) {
  const results = [];
  const context = await browser.newContext();
  const page = await context.newPage();
  let authenticated = false;

  try {
    if (suite.login) {
      try {
        await bootstrapSession(
          page,
          suite.baseUrl,
          suite.login.email,
          suite.login.password,
          suite.storageKey,
        );
        authenticated = true;
      } catch (err) {
        results.push({
          suite: suite.name,
          route: "setup",
          viewport: "n/a",
          issues: [
            {
              type: "setup-error",
              severity: "high",
              detail: `Authenticated audit skipped: ${err.message || err}`,
            },
          ],
        });
      }
    }

    for (const route of suite.routes) {
      if (route.authenticated && !authenticated) continue;

      for (const vp of VIEWPORTS) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(`${suite.baseUrl}${route.path}`, { waitUntil: "networkidle" });
        await page.waitForTimeout(500);

        const audit = await auditPage(page, `${suite.name} ${route.name} @ ${vp.name}`);

        if (vp.width < 768) {
          if (!audit.menuButtonVisible && route.authenticated) {
            audit.issues.push({
              type: "missing-mobile-nav",
              severity: "high",
              detail: "Hamburger menu not visible on mobile for authenticated page",
            });
          }
          if (audit.desktopSidebarVisible) {
            audit.issues.push({
              type: "sidebar-on-mobile",
              severity: "high",
              detail: "Desktop sidebar visible on mobile viewport",
            });
          }
        } else if (route.authenticated && audit.menuButtonVisible) {
          audit.issues.push({
            type: "hamburger-on-desktop",
            severity: "low",
            detail: "Hamburger menu visible on desktop viewport",
          });
        }

        if (route.path === "/department-inbox" || route.path === "/users" || route.path === "/reports") {
          const tableOverflow = await page.evaluate(() => {
            const table = document.querySelector("table");
            if (!table) return null;
            const rect = table.getBoundingClientRect();
            const vw = document.documentElement.clientWidth;
            return { tableWidth: Math.round(rect.width), overflows: rect.width > vw };
          });
          if (tableOverflow?.overflows && vp.width < 768) {
            const mobileList = await page.locator("ul[aria-label='List']").count();
            if (mobileList === 0) {
              audit.issues.push({
                type: "table-without-mobile-fallback",
                severity: "high",
                detail: `Table width ${tableOverflow.tableWidth}px overflows mobile viewport without card list fallback`,
              });
            }
          }
        }

        const shotDir = path.join(OUT_DIR, suite.name, vp.name);
        await mkdir(shotDir, { recursive: true });
        const shotName = route.name.replace(/[^a-z0-9_-]+/gi, "-") + ".png";
        await page.screenshot({ path: path.join(shotDir, shotName), fullPage: true });

        results.push({ suite: suite.name, route: route.name, viewport: vp.name, ...audit });
      }
    }
  } finally {
    await context.close();
  }

  return results;
}

const suites = [
  {
    name: "user-portal",
    baseUrl: "http://localhost:3000",
    storageKey: "requestflow_session",
    login: { email: "musa@requestflow.local", password: "requestflow" },
    routes: [
      { name: "login", path: "/login", authenticated: false },
      { name: "dashboard", path: "/dashboard", authenticated: true },
      { name: "requests", path: "/requests", authenticated: true },
      { name: "create-request", path: "/requests/create", authenticated: true },
      { name: "tasks", path: "/tasks", authenticated: true },
    ],
  },
  {
    name: "admin-portal",
    baseUrl: "http://localhost:3001",
    storageKey: "requestflow_admin_session",
    login: { email: "admin@requestflow.local", password: "requestflow" },
    routes: [
      { name: "login", path: "/login", authenticated: false },
      { name: "dashboard", path: "/dashboard", authenticated: true },
      { name: "users", path: "/users", authenticated: true },
      { name: "templates", path: "/templates", authenticated: true },
      { name: "reports", path: "/reports", authenticated: true },
      { name: "settings", path: "/settings", authenticated: true },
    ],
  },
];

const browser = await chromium.launch({ headless: true });
const allResults = [];

for (const suite of suites) {
  try {
    const suiteResults = await runSuite(browser, suite);
    allResults.push(...suiteResults);
  } catch (err) {
    allResults.push({
      suite: suite.name,
      route: "setup",
      viewport: "n/a",
      issues: [{ type: "setup-error", severity: "high", detail: String(err.message || err) }],
    });
  }
}

await browser.close();

const summary = {
  generatedAt: new Date().toISOString(),
  totalChecks: allResults.length,
  pagesWithIssues: allResults.filter((r) => r.issues?.length).length,
  high: allResults.flatMap((r) => (r.issues || []).filter((i) => i.severity === "high").map((i) => ({ ...i, page: r.label || `${r.suite}/${r.route}@${r.viewport}` }))),
  medium: allResults.flatMap((r) => (r.issues || []).filter((i) => i.severity === "medium").map((i) => ({ ...i, page: r.label || `${r.suite}/${r.route}@${r.viewport}` }))),
  low: allResults.flatMap((r) => (r.issues || []).filter((i) => i.severity === "low").map((i) => ({ ...i, page: r.label || `${r.suite}/${r.route}@${r.viewport}` }))),
  results: allResults,
};

await mkdir(OUT_DIR, { recursive: true });
await writeFile(path.join(OUT_DIR, "report.json"), JSON.stringify(summary, null, 2));

console.log("RESPONSIVE AUDIT SUMMARY");
console.log("========================");
console.log(`Checks: ${summary.totalChecks}`);
console.log(`Pages with issues: ${summary.pagesWithIssues}`);
console.log(`High: ${summary.high.length} | Medium: ${summary.medium.length} | Low: ${summary.low.length}`);
console.log("");

if (summary.high.length) {
  console.log("HIGH severity:");
  for (const i of summary.high) console.log(`  - [${i.page}] ${i.type}: ${i.detail}`);
}
if (summary.medium.length) {
  console.log("MEDIUM severity:");
  for (const i of summary.medium.slice(0, 20)) console.log(`  - [${i.page}] ${i.type}: ${i.detail}`);
  if (summary.medium.length > 20) console.log(`  ... and ${summary.medium.length - 20} more`);
}

console.log(`\nFull report: ${path.join(OUT_DIR, "report.json")}`);
console.log(`Screenshots: ${OUT_DIR}`);
