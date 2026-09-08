import { test, expect } from "./fixtures";

test("the hero seal reveals an accessible invitation and the selected mood opens the matching wedding", async ({
  page,
}) => {
  await page.goto("/");
  const seal = page.getByRole("button", {
    name: "Break the seal to open the sample invitation",
  });
  await expect(page.getByRole("link", { name: "Step inside" })).toHaveCount(0);
  await seal.focus();
  await page.keyboard.press("Enter");
  const visit = page.getByRole("link", { name: "Step inside" });
  await expect(visit).toBeFocused();
  await page
    .getByRole("group", { name: "Invitation mood" })
    .getByRole("button", { name: "Notte" })
    .click();
  await expect(visit).toHaveAttribute("href", "/demo/notte");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", {
      name: "Break the seal to open the sample invitation",
    }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(visit).toBeFocused();
  await visit.click();
  await page.waitForURL("**/i/**");
  await expect(page.locator(".guest-experience")).toHaveClass(/world-notte/);
  await expect(
    page.getByRole("button", { name: "Open your invitation" }),
  ).toBeVisible();
});

test("hero scroll depth respects reduced motion and touch controls remain usable at narrow widths", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForTimeout(1500);
  const layer = page.locator(".suite-photo-drift");
  const before = await layer.evaluate((e) => getComputedStyle(e).transform);
  await page.evaluate(() => window.scrollTo({ top: 360, behavior: "instant" }));
  await expect
    .poll(() => layer.evaluate((e) => getComputedStyle(e).transform))
    .not.toBe(before);
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    const reduced = await layer.evaluate((e) => getComputedStyle(e).transform);
    await page
      .getByRole("button", {
        name: "Break the seal to open the sample invitation",
      })
      .click();
    const link = page.getByRole("link", { name: "Step inside" });
    await expect(link).toBeFocused();
    expect(
      await link.evaluate((el) => {
        const box = el.getBoundingClientRect();
        const target = document.elementFromPoint(
          box.x + box.width / 2,
          box.y + box.height / 2,
        );
        return el === target || el.contains(target);
      }),
    ).toBe(true);
    await page.evaluate(() =>
      window.scrollTo({ top: 180, behavior: "instant" }),
    );
    expect(await layer.evaluate((e) => getComputedStyle(e).transform)).toBe(
      reduced,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
