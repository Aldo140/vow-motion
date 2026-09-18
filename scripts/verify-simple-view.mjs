import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
await mkdir("artifacts", { recursive: true });
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

await page.goto(invite.url);
await page.locator(".invitation-gate").waitFor();
await page.screenshot({ path: "artifacts/simple-view-1-immersive-gate.png" });

await page.getByRole("button", { name: /simpler view/i }).click();
await page.locator(".guest-simple-view").waitFor();
await page.screenshot({
  path: "artifacts/simple-view-2-desktop.png",
  fullPage: true,
});

const metrics = await page.evaluate(() => {
  const header = document.querySelector(".simple-header");
  const intro = document.querySelector(".simple-intro h1");
  const events = document.querySelectorAll(".simple-events > li");
  return {
    headerBorder: header ? getComputedStyle(header).borderBottomWidth : null,
    introFont: intro ? getComputedStyle(intro).fontFamily : null,
    introSize: intro ? getComputedStyle(intro).fontSize : null,
    eventCount: events.length,
    eventBorder: events[0] ? getComputedStyle(events[0]).borderStyle : null,
    overflowX: document.documentElement.scrollWidth > window.innerWidth,
  };
});

// Mobile viewport, same page.
await page.setViewportSize({ width: 390, height: 844 });
const mobileOverflow = await page.evaluate(
  () => document.documentElement.scrollWidth > window.innerWidth,
);
await page.screenshot({
  path: "artifacts/simple-view-3-mobile.png",
  fullPage: true,
});

// Toggle back to the full experience and confirm it still opens cleanly.
await page
  .getByRole("button", { name: "Full experience", exact: true })
  .click();
await page.waitForTimeout(300);
const backToImmersive = await page.evaluate(
  () =>
    !!document.querySelector(
      ".invitation-gate, .guest-navigation, .invitation-navigation",
    ),
);

console.log(
  JSON.stringify({ metrics, mobileOverflow, backToImmersive, errors }, null, 2),
);
await browser.close();
