import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  baseURL: "http://localhost:3000",
  extraHTTPHeaders: {
    "x-forwarded-for": `198.19.${process.pid % 256}.${Date.now() % 256}`,
  },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.request.post("/api/demo");
const weddings = await (await page.request.get("/api/weddings")).json();
const result = [];
for (const width of [1440, 390]) {
  await page.setViewportSize({ width, height: 900 });
  for (const section of [
    "",
    "guests",
    "events",
    "experience",
    "invitations",
    "rsvps",
    "messages",
    "seating",
    "travel",
    "photos",
    "analytics",
    "collaborators",
    "settings",
  ]) {
    await page.goto(`/studio/${section}?wid=${weddings[0].id}`);
    await page.locator(".page-heading h1").waitFor();
    const metrics = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      title: document.querySelector(".page-heading h1")?.textContent,
      brokenImages: [...document.images].filter(
        (i) => i.complete && !i.naturalWidth,
      ).length,
    }));
    result.push({ section: section || "overview", width, ...metrics });
    if (["guests", "travel", "experience", "seating"].includes(section))
      await page.screenshot({
        path: `artifacts/refined-${section}-${width}.png`,
        fullPage: true,
      });
  }
}
await writeFile(
  "artifacts/refinement-screen-audit.json",
  JSON.stringify({ screens: result, errors }, null, 2),
);
console.log(
  JSON.stringify({
    screens: result.length,
    issues: result.filter((r) => r.overflow || r.brokenImages),
    errors,
  }),
);
await browser.close();
