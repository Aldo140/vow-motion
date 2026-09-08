import { test, expect } from "./fixtures";

test("the weekend reads as an order of the day and the wait counts down", async ({
  page,
}) => {
  await page.goto("/demo/riviera");
  const open = page.getByRole("button", { name: "Open your invitation" });
  if (await open.count()) await open.click();
  await page.locator("#programme").scrollIntoViewIfNeeded();

  // Moments group under the day they fall on, in the venue's own timezone.
  const days = page.locator(".order-day");
  expect(await days.count()).toBeGreaterThan(1);
  const labels = await page.locator(".order-day-label").allInnerTexts();
  expect(labels).toEqual([...new Set(labels)]);
  expect(labels[0]).toMatch(/friday/i);

  // Every moment carries a time, a name and a way to get there.
  for (const moment of await page.locator(".order-moment").all()) {
    await expect(moment.locator(".order-time")).toHaveText(/^\d{1,2}:\d{2}$/);
    await expect(moment.locator("h3")).toBeVisible();
    await expect(
      moment.getByRole("link", { name: /Find your way/ }),
    ).toBeVisible();
  }
  // The dress note must not run into the link that follows it.
  const dress = page.locator(".programme-dress").first();
  const link = page
    .locator(".order-moment")
    .first()
    .getByRole("link", { name: /Find your way/ });
  const dressBox = (await dress.boundingBox())!;
  const linkBox = (await link.boundingBox())!;
  expect(linkBox.y).toBeGreaterThanOrEqual(dressBox.y + dressBox.height - 1);

  await page.locator(".guest-wait").scrollIntoViewIfNeeded();
  const figures = page.locator(".countdown-figures b");
  await expect(figures).toHaveCount(4);
  const seconds = figures.nth(3);
  const first = await seconds.innerText();
  // It is a clock, so it must actually move.
  await expect
    .poll(async () => seconds.innerText(), { timeout: 5000 })
    .not.toBe(first);
  // Screen readers get one settled sentence rather than a stream of seconds.
  await expect(page.locator(".guest-wait .sr-only")).toHaveText(
    /\d+ days until the wedding\./,
  );
});

test("the crest and its drawing respect reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/demo/riviera");
  const open = page.getByRole("button", { name: "Open your invitation" });
  if (await open.count()) await open.click();
  await page.locator("#programme").scrollIntoViewIfNeeded();
  const crest = page.locator(".programme-crest");
  await expect(crest).toBeVisible();
  // With motion reduced the crest is simply there, initials and all.
  await expect(crest.locator(".crest-initials")).toBeVisible();
  expect(
    await crest
      .locator(".crest-initials")
      .evaluate((el) => Number(getComputedStyle(el).opacity)),
  ).toBe(1);
  await expect(crest.locator("svg")).toHaveAttribute("aria-hidden", "true");
});

test("the ceremonial layer holds together on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/demo/riviera");
  const open = page.getByRole("button", { name: "Open your invitation" });
  if (await open.count()) await open.click();
  await page.locator(".guest-wait").scrollIntoViewIfNeeded();
  // The four figures pair up two by two rather than overflowing the screen.
  const boxes = await page
    .locator(".countdown-figures > span")
    .evaluateAll((spans) =>
      spans.map((span) => Math.round(span.getBoundingClientRect().y)),
    );
  expect(new Set(boxes).size).toBe(2);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/ceremony-mobile.png",
    fullPage: true,
  });
});
