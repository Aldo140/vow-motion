import { chromium } from "@playwright/test";
import sharp from "sharp";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const origin = process.env.RELEASE_URL;
if (!origin)
  throw new Error("Set RELEASE_URL to the candidate deployment origin.");
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  baseURL: origin,
  viewport: { width: 1440, height: 1000 },
  extraHTTPHeaders: process.env.RELEASE_BYPASS
    ? { "x-vercel-protection-bypass": process.env.RELEASE_BYPASS }
    : {},
});
const page = await context.newPage();
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(e.message));
const request = context.request;
async function json(method, path, data) {
  const result = await request.fetch(path, { method, data });
  assert(
    result.ok(),
    `${method} ${path.split("?")[0]} returned ${result.status()}: ${(await result.text()).slice(0, 180)}`,
  );
  return result.json();
}
const report = { origin, checks: [] };
let photoId, weddingId;
try {
  assert.equal((await json("GET", "/api/health")).status, "ok");
  report.checks.push("hosted database readiness");
  await page.goto("/");
  await page
    .getByRole("heading", { name: "Your entire wedding. Beautifully shared." })
    .waitFor();
  await page.screenshot({ path: "artifacts/release-home.png", fullPage: true });
  report.checks.push("desktop homepage hydration");
  await json("POST", "/api/demo", {});
  const weddings = await json("GET", "/api/weddings");
  weddingId = weddings[0].id;
  const studio = await json("GET", `/api/studio?wedding=${weddingId}`);
  const household =
    studio.households.find((h) => h.name === "Williams household") ||
    studio.households[0];
  const invite = await json(
    "POST",
    `/api/studio/invitations?wedding=${weddingId}`,
    { household_id: household.id },
  );
  const raw = invite.url.split("/").at(-1);
  const guest = await json("GET", `/api/guest?token=${raw}`);
  const responses = guest.guests.flatMap((g) =>
    guest.events
      .filter((e) => e.rsvp_required)
      .map((e) => ({
        guest_id: g.id,
        event_id: e.id,
        attending: true,
        meal: "Garden risotto",
        dietary: "",
        answers: {},
      })),
  );
  await json("POST", `/api/guest/rsvp?token=${raw}`, { responses });
  const saved = await json("GET", `/api/guest?token=${raw}`);
  assert.equal(saved.responses.length, responses.length);
  assert(saved.responses.every((r) => r.meal === "Garden risotto"));
  report.checks.push("demo studio and persistent household RSVP");
  const image = await sharp({
    create: { width: 30, height: 30, channels: 3, background: "#71816a" },
  })
    .webp()
    .toBuffer();
  const upload = await request.post(`/api/guest/photos?token=${raw}`, {
    multipart: {
      file: {
        name: "release-check.webp",
        mimeType: "image/webp",
        buffer: image,
      },
      caption: "Automated release verification",
    },
  });
  assert(upload.ok(), `Photo upload failed: ${upload.status()}`);
  const after = await json("GET", `/api/studio?wedding=${weddingId}`);
  photoId = after.photos.find(
    (p) => p.caption === "Automated release verification",
  ).id;
  assert.equal(
    (await request.get(`/api/photos/${photoId}?token=${raw}`)).status(),
    200,
  );
  const anonymous = await browser.newContext({
    baseURL: origin,
    extraHTTPHeaders: process.env.RELEASE_BYPASS
      ? { "x-vercel-protection-bypass": process.env.RELEASE_BYPASS }
      : {},
  });
  assert.equal(
    (await anonymous.request.get(`/api/photos/${photoId}`)).status(),
    401,
  );
  await anonymous.close();
  await json("PATCH", `/api/studio/photos/${photoId}?wedding=${weddingId}`, {
    approved: true,
  });
  report.checks.push(
    "hosted private photo upload, authorized read, moderation, and anonymous denial",
  );
  await page.goto(`/studio?wid=${weddingId}`);
  await page
    .getByRole("heading", { name: "A beautiful day in the making." })
    .waitFor();
  await page.goto(new URL(invite.url).pathname);
  await page.getByRole("button", { name: "Open your invitation" }).click();
  await page.getByRole("heading", { name: "A weekend to remember." }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "artifacts/release-guest-mobile.png",
    fullPage: true,
  });
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  assert.deepEqual(pageErrors, []);
  report.checks.push(
    "hosted Studio and mobile guest rendering without browser errors",
  );
  report.status = "passed";
  console.log(JSON.stringify(report));
} finally {
  if (photoId)
    await request.delete(`/api/studio/photos/${photoId}?wedding=${weddingId}`);
  await writeFile(
    "artifacts/release-smoke.json",
    JSON.stringify(report, null, 2),
  );
  await browser.close();
}
