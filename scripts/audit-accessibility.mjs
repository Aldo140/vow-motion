import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

await mkdir("artifacts", { recursive: true });
const axePath = path.join(process.cwd(), "node_modules", "axe-core", "axe.min.js");

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ baseURL: "http://localhost:3000" });
const page = await context.newPage();
const consoleErrors = [];
page.on("pageerror", (e) => consoleErrors.push(e.message));

async function scan(label, url, { reduceMotion = false } = {}) {
  if (reduceMotion) await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(url);
  await page.waitForTimeout(500);
  await page.addScriptTag({ path: axePath });
  const results = await page.evaluate(async () => {
    // Reflowing/duplicate-id checks over third-party widgets we don't control
    // (map iframes, etc.) are out of scope for this pass.
    return await window.axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
      },
    });
  });
  if (reduceMotion) await page.emulateMedia({ reducedMotion: "no-preference" });
  return {
    label,
    url,
    violations: results.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.length,
      details: v.nodes.slice(0, 8).map((n) => ({
        target: n.target.join(" "),
        summary: n.failureSummary,
        html: n.html.slice(0, 200),
      })),
    })),
  };
}

// Build a real dataset: a demo wedding plus a guest invitation link.
await page.request.post("/api/demo");
const weddings = await (await page.request.get("/api/weddings")).json();
const weddingId = weddings[0].id;
const studio = await (
  await page.request.get(`/api/studio?wedding=${weddingId}`)
).json();
const householdId = studio.households[0].id;
const invite = await (
  await page.request.post(`/api/studio/invitations?wedding=${weddingId}`, {
    data: { household_id: householdId },
  })
).json();

const reports = [];
reports.push(await scan("marketing homepage", "/"));
reports.push(await scan("login", "/login"));
reports.push(await scan("privacy page", "/privacy"));
reports.push(await scan("studio overview", `/studio?wid=${weddingId}`));
reports.push(await scan("studio settings", `/studio/settings?wid=${weddingId}`));
reports.push(await scan("studio invitations", `/studio/invitations?wid=${weddingId}`));
reports.push(await scan("guest invitation gate", invite.url));
reports.push(
  await scan("guest invitation gate, reduced motion", invite.url, {
    reduceMotion: true,
  }),
);

await writeFile(
  "artifacts/accessibility-report.json",
  JSON.stringify({ reports, consoleErrors }, null, 2),
);
let totalViolations = 0;
for (const r of reports) {
  totalViolations += r.violations.length;
  console.log(`\n=== ${r.label} (${r.url}) ===`);
  if (!r.violations.length) console.log("no automated violations found");
  for (const v of r.violations) {
    console.log(`[${v.impact}] ${v.id}: ${v.help} (${v.nodes} nodes)`);
    for (const d of v.details) console.log(`  ${d.target}\n  ${d.summary}\n  ${d.html}`);
  }
}
console.log(`\nTotal violations across ${reports.length} pages: ${totalViolations}`);
console.log("Console errors:", consoleErrors.length);
await browser.close();
