import { test, expect } from "./fixtures";
test("contact is discoverable and the form adapts for couples and planners", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Main navigation", exact: true })
    .getByRole("link", { name: "Contact", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Tell us what you’re imagining." }),
  ).toBeVisible();
  await expect(page.locator(".contact-direct a")).toHaveAttribute(
    "href",
    "mailto:jorti104@mtroyal.ca",
  );
  await page.getByRole("radio", { name: /We’re getting married/ }).check();
  await expect(page.getByLabel("Wedding date", { exact: false })).toBeVisible();
  await page.getByLabel("Your name", { exact: true }).fill("Alex Example");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("alex@example.test");
  await page.getByRole("radio", { name: /I’m a wedding planner/ }).check();
  await expect(
    page.getByLabel("Business or studio", { exact: false }),
  ).toBeVisible();
  await expect(page.getByLabel("Wedding date", { exact: false })).toHaveCount(
    0,
  );
  await expect(page.getByLabel("Your name", { exact: true })).toHaveValue(
    "Alex Example",
  );
  await page
    .getByLabel("How could we help your business?")
    .fill("I would like to explore invitations for our couples.");
  for (const width of [1440, 1024, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `artifacts/contact-${width}.png`,
      fullPage: true,
    });
  }
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("link", { name: /The design collection/ }),
  ).toHaveAttribute("href", "/#worlds");
  await page.getByRole("button", { name: "Close menu", exact: true }).click();
  // Do not submit real enquiries or launch a mail client from this browser test.
});
