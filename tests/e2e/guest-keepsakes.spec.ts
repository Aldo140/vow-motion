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
  await page.getByRole("button", { name: "Replay invitation" }).click();
  await expect(open).toBeFocused();
  await expect(open).toBeInViewport();
  await page.keyboard.press("Enter");
  await expect(page.locator(".guest-hero h1")).toBeFocused();
  await expect(page.locator(".guest-hero h1")).toBeInViewport();
  await page.reload();
  await expect(open).toHaveCount(0);
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
  const row = pass.locator(".day-pass-event").filter({ hasText: event.title });
  const local = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-GB", {
      timeZone: event.timezone,
      ...options,
    }).format(new Date(event.starts_at));
  // The pass reads in the venue's local time, whatever the visitor's own zone.
  await expect(row.locator("time")).toContainText(
    local({ day: "numeric", month: "short" }),
  );
  await expect(row.locator("time")).toContainText(
    local({ hour: "numeric", minute: "2-digit" }),
  );
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

// The guest dock floats over the bottom of the viewport and the keepsakes rest
// on the print's mount. Both hid parts of the invitation before they were
// spaced apart, so assert the resting composition rather than the CSS.
test("the save-the-date action clears the floating dock and the print caption stays legible", async ({
  page,
}) => {
  // Maison positions the keepsake itself, so it exercises the world override.
  await page.goto("/demo/maison");
  const open = page.getByRole("button", { name: "Open your invitation" });
  if (await open.count()) await open.click();
  await expect(page.locator(".date-keepsake-action")).toBeVisible();

  // What a guest can actually tap where the invitation first comes to rest.
  const reachable = (selector: string) =>
    page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return false;
      const box = el.getBoundingClientRect();
      const atCentre = document.elementFromPoint(
        box.x + box.width / 2,
        box.y + box.height / 2,
      );
      return !!atCentre && el.contains(atCentre);
    }, selector);

  expect(await reachable(".date-keepsake-action")).toBe(true);
  for (const span of await page.locator(".atelier-photo-caption span").all())
    await expect(span).toBeVisible();
  expect(
    await page.locator(".atelier-photo-caption span").evaluateAll((spans) =>
      spans.every((span) => {
        const box = span.getBoundingClientRect();
        const atCentre = document.elementFromPoint(
          box.x + box.width / 2,
          box.y + box.height / 2,
        );
        return !!atCentre && span.contains(atCentre);
      }),
    ),
  ).toBe(true);

  // The layered hero re-lays itself after a viewport change, and a tween can
  // hold one value briefly, so require the position to stay put for a while
  // rather than merely match the previous sample.
  const settled = async () => {
    let previous = -1,
      stable = 0;
    for (let attempt = 0; attempt < 60 && stable < 4; attempt++) {
      const top = await page
        .locator(".date-keepsake-action")
        .evaluate((el) => Math.round(el.getBoundingClientRect().top));
      stable = top === previous ? stable + 1 : 0;
      previous = top;
      await page.waitForTimeout(120);
    }
  };

  await page.setViewportSize({ width: 390, height: 844 });
  await settled();
  expect(await reachable(".date-keepsake-action")).toBe(true);

  // The dock is fixed to the foot of the viewport while the invitation sits at
  // a fixed place in the document, so for a narrow band of window heights the
  // two meet. That is inherent to a floating dock; what must hold everywhere is
  // that a small scroll frees the action rather than it being lost behind.
  for (const height of [850, 900, 950, 1000]) {
    await page.setViewportSize({ width: 1440, height });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await settled();
    let cleared = await reachable(".date-keepsake-action");
    for (const top of [40, 80, 120, 200]) {
      if (cleared) break;
      await page.evaluate(
        (y) => window.scrollTo({ top: y, behavior: "instant" }),
        top,
      );
      await page.waitForTimeout(150);
      cleared = await reachable(".date-keepsake-action");
    }
    expect(cleared, `calendar unreachable at ${height}px tall`).toBe(true);
  }
});
