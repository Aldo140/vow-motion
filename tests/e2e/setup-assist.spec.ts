import { test, expect } from "./fixtures";

test("setup saves and advances, suggests dates and finds venue timezones", async ({
  page,
}, testInfo) => {
  await page.request.post("/api/demo");
  const weddings = await (await page.request.get("/api/weddings")).json();
  const wid = weddings[0].id;
  await page.goto(`/studio/setup?wid=${wid}`);
  await page
    .getByRole("button", { name: "Save your experience and continue" })
    .click();
  await expect(
    page.getByRole("progressbar", { name: "Wedding setup progress" }),
  ).toHaveAttribute("value", "1");
  await expect(page.locator(".setup-reward")).toContainText("point of view");
  await page.getByLabel("Date", { exact: true }).fill("2028-04-11");
  await page.getByRole("button", { name: "6 weeks before" }).click();
  await expect(page.getByLabel("Custom domain")).toHaveCount(0);
  await expect(page.getByLabel("RSVP deadline", { exact: true })).toHaveValue(
    "2028-02-29",
  );
  await page
    .getByRole("searchbox", { name: "Search timezone by city" })
    .fill("Banff");
  await page
    .getByLabel("Timezone", { exact: true })
    .selectOption("America/Edmonton");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: testInfo.outputPath("setup-mobile.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Save settings and continue" })
    .click();
  await expect(
    page.getByRole("progressbar", { name: "Wedding setup progress" }),
  ).toHaveAttribute("value", "2");
  await expect(
    page.getByRole("heading", { name: "Every moment, considered." }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("progressbar", { name: "Wedding setup progress" }),
  ).toHaveAttribute("value", "2");
  const saved = await (
    await page.request.get(`/api/studio?wedding=${wid}`)
  ).json();
  expect(saved.wedding.timezone).toBe("America/Edmonton");
  expect(saved.wedding.rsvp_deadline).toBe("2028-02-29");
});

test("declining receives a warm saved confirmation without a celebration animation", async ({
  page,
}) => {
  await page.goto("/demo/riviera");
  await page.getByRole("button", { name: "Open your invitation" }).click();
  await page
    .locator(".guest-dock")
    .getByRole("button", { name: /RSVP|response/i })
    .click();
  const declines = page.locator(
    ".attendance-person label:nth-of-type(2) input",
  );
  for (let i = 0; i < (await declines.count()); i++)
    await declines.nth(i).check();
  await page.getByRole("button", { name: "A few little details" }).click();
  await page.getByRole("button", { name: "Save our response" }).click();
  await expect(page.locator(".reply-declined")).toContainText(
    "Received with understanding",
  );
  await expect(page.locator(".reply-saved-note")).toContainText(
    "Your reply is saved",
  );
  await expect(page.locator(".reply-accepted")).toHaveCount(0);
});
