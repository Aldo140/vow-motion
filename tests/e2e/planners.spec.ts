import { test, expect } from "./fixtures";

test("the planner page reads as an addition to a planner's system, not a replacement", async ({
  page,
}) => {
  await page.goto("/planners");
  // The positioning has to be legible above the fold, before the ledger can be
  // mistaken for a list of things the planner already owns.
  await expect(
    page.getByRole("heading", { level: 1, name: /Keep the system you run on/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /Your planning system stays\s+exactly where it is/,
    }),
  ).toBeVisible();

  const alongside = page.locator(".planner-alongside");
  await expect(alongside).toContainText(/none of it moves/i);
  await expect(alongside).toContainText(/no live two-way sync/i);
  // The concept has to land without leaning on a competitor's name.
  await expect(page.locator("body")).not.toContainText(/Aisle Planner/i);
  await expect(page.locator("body")).not.toContainText(/Planning Pod/i);

  // The wedge is the paperwork, and it sits above the ledger on the page.
  const sheets = page.locator(".supplier-sheet");
  await expect(sheets).toHaveCount(3);
  await expect(sheets.nth(0)).toContainText("Kitchen sheet");
  await expect(sheets.nth(0)).toContainText(/Covers per table/);
  await expect(sheets.nth(1)).toContainText("Shuttle manifest");
  await expect(sheets.nth(1)).toContainText(/Seats required/);
  await expect(sheets.nth(2)).toContainText("Place cards");
  await expect(sheets.nth(2)).toContainText(/Table, meal and dietary note/);
  const suppliers = (await page.locator(".planner-suppliers").boundingBox())!;
  const ledgerBox = (await page.locator(".planner-ledger").boundingBox())!;
  expect(suppliers.y).toBeLessThan(ledgerBox.y);

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
  // The supplier sheets stack rather than squeeze into three narrow columns.
  const sheets = page.locator(".supplier-sheet");
  const one = (await sheets.nth(0).boundingBox())!;
  const two = (await sheets.nth(1).boundingBox())!;
  expect(two.y).toBeGreaterThan(one.y + one.height - 2);

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

test("the collection leads with the worlds that are actually finished", async ({
  page,
}) => {
  await page.goto("/");
  const tabs = page.getByRole("tab");
  await expect(tabs).toHaveCount(6);
  // The three complete worlds come first; the rest are marked as unfinished.
  await expect(tabs.nth(0)).toHaveText(/Riviera/);
  await expect(tabs.nth(1)).toHaveText(/Maison/);
  await expect(tabs.nth(2)).toHaveText(/Notte/);
  for (const index of [0, 1, 2])
    await expect(tabs.nth(index)).not.toHaveClass(/world-tab-partial/);
  for (const index of [3, 4, 5])
    await expect(tabs.nth(index)).toHaveClass(/world-tab-partial/);

  // Riviera is complete, so it makes no apology.
  await expect(page.locator(".collection-honesty")).toHaveCount(0);
  await tabs.nth(3).click();
  await expect(page.locator(".collection-honesty")).toContainText(
    /photography is still ours/i,
  );
  // And the section never claims six equally finished worlds.
  await expect(page.locator(".collection .section-heading")).toContainText(
    /Three worlds are fully dressed/,
  );
});
