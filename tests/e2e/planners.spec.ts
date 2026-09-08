import { test, expect } from "./fixtures";

test("the planner page pairs each Studio capability with its guest outcome", async ({
  page,
}) => {
  await page.goto("/planners");
  await expect(
    page.getByRole("heading", { level: 1, name: /worth remembering twice/ }),
  ).toBeVisible();

  // The ledger is the argument of the page: every row must carry both sides.
  const rows = page.locator(".ledger-row");
  await expect(rows).toHaveCount(7);
  for (const row of await rows.all()) {
    await expect(row.locator(".ledger-studio h3")).toBeVisible();
    await expect(row.locator(".ledger-guest h3")).toBeVisible();
  }
  // Side by side on a desktop, so the pairing reads across rather than down.
  const first = rows.first();
  const studio = (await first.locator(".ledger-studio").boundingBox())!;
  const guest = (await first.locator(".ledger-guest").boundingBox())!;
  expect(guest.x).toBeGreaterThan(studio.x + studio.width);

  await expect(
    page.getByRole("heading", { name: /one wedding/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /See what a guest receives/ }),
  ).toHaveAttribute("href", "/demo/riviera");

  await page.screenshot({
    path: "artifacts/planners-desktop.png",
    fullPage: true,
  });
});

test("the planner ledger stacks and stays labelled on a phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/planners");
  const first = page.locator(".ledger-row").first();
  const studio = (await first.locator(".ledger-studio").boundingBox())!;
  const guest = (await first.locator(".ledger-guest").boundingBox())!;
  // Stacked, with the guest half below and each half naming its side.
  expect(guest.y).toBeGreaterThan(studio.y + studio.height);
  await expect(first.locator(".ledger-studio .ledger-label")).toHaveText(
    "In your Studio",
  );
  await expect(first.locator(".ledger-guest .ledger-label")).toHaveText(
    "In their invitation",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/planners-mobile.png",
    fullPage: true,
  });
});
