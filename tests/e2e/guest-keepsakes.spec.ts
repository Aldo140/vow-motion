import { test, expect } from "@playwright/test";

test("the invitation opens by keyboard and the keepsake leads to the authorized plans", async ({
  page,
}) => {
  await page.goto("/demo/riviera");
  const open = page.getByRole("button", { name: "Open your invitation" });
  await open.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".guest-hero h1")).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  const front = page.getByRole("button", {
    name: "Turn the keepsake over for your first gathering",
  });
  await front.click();
  const back = page.getByRole("button", {
    name: "Turn the keepsake back",
    exact: true,
  });
  await expect(back).toBeFocused();
  await expect(front).toHaveCount(0);
  const plans = page.getByRole("link", { name: "See the plans" });
  await expect(plans).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(front).toBeFocused();
  await expect(plans).toHaveCount(0);
  await front.click();
  await plans.click();
  await expect(page).toHaveURL(/#programme$/);
  await expect(page.locator("#programme")).toBeFocused();
  await page.reload();
  await expect(open).toHaveCount(0);
  await expect(page.locator(".guest-hero h1")).toBeVisible();
});

test("the guest pass includes local dates and maps, retains its close control and restores scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/demo/notte");
  const open = page.getByRole("button", { name: "Open your invitation" });
  await expect(open).toBeInViewport();
  await open.click();
  const token = new URL(page.url()).pathname.split("/").at(-1);
  const data = await (
    await page.request.get(`/api/guest?token=${token}`)
  ).json();
  await page.evaluate(() => window.scrollTo({ top: 340, behavior: "instant" }));
  const before = await page.evaluate(() => window.scrollY);
  const passButton = page
    .locator(".guest-dock")
    .getByRole("button", { name: "Your wedding pass" });
  await passButton.click();
  const pass = page.getByRole("dialog", { name: "Your wedding pass" });
  await expect(pass).toBeVisible();
  await expect(pass.locator(".day-pass-event")).toHaveCount(data.events.length);
  const event = data.events[0];
  expect(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: event.timezone,
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(event.starts_at)),
  ).toBe("12:00");
  const row = pass.locator(".day-pass-event").filter({ hasText: event.title });
  const date = new Intl.DateTimeFormat("en-GB", {
    timeZone: event.timezone,
    day: "numeric",
    month: "short",
  }).format(new Date(event.starts_at));
  await expect(row.locator("time")).toContainText(date);
  const directions = row.getByRole("link", {
    name: `Directions to ${event.venue || event.title}`,
  });
  expect(
    new URL((await directions.getAttribute("href"))!).searchParams.get("query"),
  ).toBe(`${event.venue} ${event.address}`);
  await expect(directions).toHaveAttribute("target", "_blank");
  await pass.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  const close = pass.getByRole("button", { name: "Close dialog" });
  await expect(close).toBeInViewport();
  await expect(
    pass.getByRole("link", { name: "Add to calendar" }),
  ).toBeInViewport();
  const calendar = await page.request.get(
    (await pass
      .getByRole("link", { name: "Add to calendar" })
      .getAttribute("href"))!,
  );
  expect(calendar.ok()).toBe(true);
  expect(await calendar.text()).toContain("BEGIN:VCALENDAR");
  const qr = await page.request.get(
    (await pass.locator(".pass-qr").getAttribute("src"))!,
  );
  expect(qr.ok()).toBe(true);
  await close.click();
  await expect(passButton).toBeFocused();
  expect(await page.evaluate(() => window.scrollY)).toBe(before);
  await page.getByRole("button", { name: "Add the first memory" }).click();
  await expect(
    page.getByRole("dialog", { name: "Share a memory" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.locator(".language-switch").click();
  await page
    .locator(".guest-dock")
    .getByRole("button", { name: "Tu pase de boda" })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Tu pase de boda" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Tu celebración, de un vistazo." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
