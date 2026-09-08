import { test, expect } from "./fixtures";

test("invitation layers respond to scroll, reduce motion, and keep the calendar and RSVP accessible", async ({
  page,
}) => {
  await page.goto("/demo/riviera");
  await page.getByRole("button", { name: "Open your invitation" }).click();
  await expect(page.locator(".guest-hero h1")).toBeFocused();
  await page.waitForTimeout(1500);
  const photo = page.locator(".guest-hero-photo > img");
  const before = await photo.evaluate((el) => getComputedStyle(el).transform);
  await page.evaluate(() => window.scrollTo({ top: 420, behavior: "instant" }));
  await expect
    .poll(() => photo.evaluate((el) => getComputedStyle(el).transform))
    .not.toBe(before);
  const calendarUrl = await page.locator(".date-keepsake").getAttribute("href");
  const calendar = await page.request.get(calendarUrl!);
  expect(calendar.status()).toBe(200);
  expect(await calendar.text()).toContain("BEGIN:VCALENDAR");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.reload();
  await expect(page.locator(".guest-hero h1")).toBeVisible();
  const reducedBefore = await photo.evaluate(
    (el) => getComputedStyle(el).transform,
  );
  await page.evaluate(() => window.scrollTo({ top: 300, behavior: "instant" }));
  await page.waitForTimeout(300);
  expect(await photo.evaluate((el) => getComputedStyle(el).transform)).toBe(
    reducedBefore,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const rsvp = page
    .locator(".guest-dock")
    .getByRole("button", { name: "Your RSVP" });
  await rsvp.click();
  await expect(
    page.getByRole("dialog", { name: "Will you join us?" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(rsvp).toBeFocused();
});
