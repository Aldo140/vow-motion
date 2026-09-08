import { test, expect } from "@playwright/test";

test("the invitation contents lead through the celebration, RSVP and wedding pass", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/demo/notte");
  await page.getByRole("button", { name: "Open your invitation" }).click();
  const contents = page.getByRole("button", {
    name: "Invitation contents",
    exact: true,
  });
  const menu = page.locator(".invitation-contents");
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await contents.focus();
    await page.keyboard.press("Enter");
    await expect(menu).toBeVisible();
    await expect(
      menu.getByRole("link", { name: "Travel & stay" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).not.toBeVisible();
    await expect(contents).toBeFocused();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await contents.click();
  await menu.getByRole("link", { name: "The celebration" }).click();
  await expect(menu).not.toBeVisible();
  await expect(page.locator("#programme")).toBeFocused();
  await expect(page).toHaveURL(/#programme$/);
  await contents.click();
  await menu.getByRole("button", { name: "Your RSVP" }).click();
  await expect(
    page.getByRole("dialog", { name: "Will you join us?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "A few little details" }).click();
  for (const meal of await page.getByLabel("What should we prepare?").all())
    await meal.selectOption("Garden risotto");
  await page.getByRole("button", { name: "Save our response" }).click();
  const confirmation = page.getByRole("dialog", {
    name: "A place in our story.",
  });
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole("button", { name: "Your wedding pass" }).click();
  const pass = page.getByRole("dialog", { name: "Your wedding pass" });
  await expect(pass).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await expect
    .poll(() =>
      pass
        .locator(".pass-qr")
        .evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBeGreaterThan(0);
  await page.keyboard.press("Escape");
  await expect(contents).toBeFocused();
  await expect(page.locator("#reply-title")).toHaveText(
    "Your reply is with us.",
  );
  await page.locator(".language-switch").click();
  await page
    .getByRole("button", { name: "Contenido de la invitación" })
    .click();
  await menu.getByRole("button", { name: "Tu pase de boda" }).click();
  await expect(
    page.getByRole("dialog", { name: "Tu pase de boda" }),
  ).toBeVisible();
});
