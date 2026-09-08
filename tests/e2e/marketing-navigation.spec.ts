import { test, expect, type Page } from "./fixtures";

async function scrollPage(page: Page, browserName: string) {
  // Playwright's mobile WebKit does not expose mouse-wheel input.
  if (browserName === "webkit") await page.keyboard.press("PageDown");
  else await page.mouse.wheel(0, 400);
}

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});

test("mobile menu supports touch dismissal, keyboard focus and background scroll restoration", async ({
  page,
  browserName,
}) => {
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Open menu", exact: true });
  const menu = page.getByRole("dialog", { name: "Explore Vow Motion" });
  await toggle.tap();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(menu.getByRole("button", { name: "Close menu" })).toBeFocused();
  for (let index = 0; index < 36; index++) {
    await page.keyboard.press(index < 18 ? "Tab" : "Shift+Tab");
    expect(
      await menu.evaluate((el) => el.contains(document.activeElement)),
    ).toBe(true);
  }

  const heroTop = await page
    .locator(".immersive-landing-hero")
    .evaluate((el) => el.getBoundingClientRect().top);
  await page.mouse.move(190, 720);
  await scrollPage(page, browserName);
  await page.waitForTimeout(250);
  expect(
    await page
      .locator(".immersive-landing-hero")
      .evaluate((el) => el.getBoundingClientRect().top),
  ).toBe(heroTop);
  await page.touchscreen.tap(190, 720);
  await expect(menu).toBeHidden();
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");

  await page.evaluate(() => window.scrollTo({ top: 180, behavior: "instant" }));
  await toggle.evaluate((el: HTMLButtonElement) =>
    el.focus({ preventScroll: true }),
  );
  await page.keyboard.press("Enter");
  await expect(menu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(toggle).toBeFocused();
  expect(await page.evaluate(() => window.scrollY)).toBe(180);

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  for (let index = 0; index < 3; index++) {
    await toggle.tap();
    await menu.getByRole("button", { name: "Close menu" }).tap();
    await expect(menu).toBeHidden();
  }
  await scrollPage(page, browserName);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(0);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await toggle.tap();
  await menu.getByRole("link", { name: "Vow Motion home" }).tap();
  await expect(menu).toBeHidden();
});

test("menu destinations, short screens, reduced motion and desktop resizing remain usable", async ({
  page,
  browserName,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const toggle = page.getByRole("button", { name: "Open menu", exact: true });
  const menu = page.getByRole("dialog", { name: "Explore Vow Motion" });
  for (const [width, height] of [
    [320, 568],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    for (const [name, id] of [
      ["The design collection", "worlds"],
      ["How it works", "experience"],
      ["Pricing", "pricing"],
    ]) {
      await page.evaluate(() =>
        window.scrollTo({ top: 0, behavior: "instant" }),
      );
      await toggle.tap();
      expect(
        await menu
          .locator(".marketing-menu-sheet")
          .evaluate((el) => el.getAnimations().length),
      ).toBe(0);
      await menu.getByRole("link", { name, exact: true }).tap();
      await expect(menu).toBeHidden();
      await expect(page).toHaveURL(new RegExp(`#${id}$`));
      await expect(page.locator(`#${id}`)).toBeFocused();
      await expect
        .poll(() =>
          page
            .locator(`#${id}`)
            .evaluate((el) => Math.round(el.getBoundingClientRect().top)),
        )
        .toBe(90);
    }
    // "For planners" is a page of its own, not a section of this one.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await toggle.tap();
    await menu.getByRole("link", { name: "For planners", exact: true }).tap();
    await expect(page).toHaveURL(/\/planners$/);
    await expect(
      page.getByRole("heading", { level: 1, name: /worth remembering twice/ }),
    ).toBeVisible();
    await page.goto("/");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }

  await page.goto("/");
  await toggle.tap();
  await page.setViewportSize({ width: 1200, height: 900 });
  await expect(menu).toBeHidden();
  await expect(toggle).toBeHidden();
  await expect(
    page.getByRole("navigation", { name: "Main navigation", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .locator(".marketing-nav")
      .getByRole("link", { name: "Vow Motion home" }),
  ).toBeFocused();
  await scrollPage(page, browserName);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await toggle.tap();
  await menu.getByRole("link", { name: "Sign in", exact: true }).tap();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/");
  await toggle.tap();
  await menu.getByRole("link", { name: "Begin your story", exact: true }).tap();
  await expect(page).toHaveURL(/\/start$/);
});
