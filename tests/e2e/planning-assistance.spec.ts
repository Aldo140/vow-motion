import { test, expect } from "./fixtures";

test("local setup drafts recover, update the live invitation, and remain wedding scoped", async ({
  page,
}, testInfo) => {
  await page.request.post("/api/demo");
  const weddings = await (await page.request.get("/api/weddings")).json();
  const wid = weddings[0].id;
  await page.goto(`/studio/setup?wid=${wid}`);
  await page.getByRole("button", { name: /2 Confirm the couple/ }).click();
  await page.getByLabel("Names", { exact: true }).fill("Alex & Jordan Draft");
  await page.getByLabel("Location", { exact: true }).fill("Banff, Alberta");
  await page
    .getByRole("button", { name: "Use suggested timezone for Alberta" })
    .click();
  const preview = page.getByRole("complementary", {
    name: "Live invitation preview",
  });
  await expect(preview).toContainText("Alex & Jordan Draft");
  await page.reload();
  await expect(page.getByLabel("Names", { exact: true })).toHaveValue(
    "Alex & Jordan Draft",
  );
  await expect(page.getByLabel("Timezone", { exact: true })).toHaveValue(
    "America/Edmonton",
  );
  await expect(preview).toContainText("Banff, Alberta");
  expect(
    await preview
      .locator(".live-invitation-paper")
      .evaluate((el) => el.getBoundingClientRect().width),
  ).toBeGreaterThan(220);
  const saved = await (
    await page.request.get(`/api/studio?wedding=${wid}`)
  ).json();
  expect(saved.wedding.names).not.toBe("Alex & Jordan Draft");
  await page.screenshot({
    path: testInfo.outputPath("live-setup-desktop.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto(`/studio/settings?wid=${weddings[1].id}`);
  await expect(page.getByLabel("Names", { exact: true })).not.toHaveValue(
    "Alex & Jordan Draft",
  );
  await page.goto(`/studio/setup?wid=${wid}`);
  await page.getByRole("button", { name: "Discard local draft" }).click();
  await expect(page.getByLabel("Names", { exact: true })).toHaveValue(
    saved.wedding.names,
  );
  await expect(preview).toContainText(saved.wedding.names);
});

test("event starters and guest drafts survive reload until explicitly saved", async ({
  page,
}) => {
  await page.request.post("/api/demo");
  const weddings = await (await page.request.get("/api/weddings")).json();
  const wid = weddings[0].id;
  await page.goto(`/studio/events?wid=${wid}`);
  await page.getByRole("button", { name: "Add an event" }).click();
  await page.getByRole("button", { name: /Welcome drinks/ }).click();
  await page.getByLabel("Venue", { exact: true }).fill("The Garden Terrace");
  await page.reload();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByLabel("Event title", { exact: true })).toHaveValue(
    "Welcome drinks",
  );
  await expect(page.getByLabel("Venue", { exact: true })).toHaveValue(
    "The Garden Terrace",
  );
  await page.getByRole("button", { name: "Save event" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goto(`/studio/guests?wid=${wid}`);
  await page.getByRole("button", { name: "Add guest", exact: true }).click();
  await page.getByLabel("Full name", { exact: true }).fill("Recoverable Guest");
  await page.reload();
  await expect(page.getByLabel("Full name", { exact: true })).toHaveValue(
    "Recoverable Guest",
  );
  await page.getByRole("button", { name: "Save guest" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Add guest", exact: true }).click();
  await expect(page.getByLabel("Full name", { exact: true })).toHaveValue("");
});

test("spreadsheet mappings and inline corrections recover without importing early", async ({
  page,
}) => {
  await page.request.post("/api/demo");
  const weddings = await (await page.request.get("/api/weddings")).json();
  const wid = weddings[0].id;
  await page.goto(`/studio/guests?wid=${wid}`);
  await page.getByRole("button", { name: "Import guests" }).click();
  await page.getByLabel("Choose a CSV file").setInputFiles({
    name: "export.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "Guest_Full_Name,E-mail Address,Invitation Group\nCSV Recovery,broken,Recovery family\n",
    ),
  });
  await expect(page.getByLabel("name", { exact: true })).toHaveValue(
    "Guest_Full_Name",
  );
  await expect(page.getByText(/Sheet row 2: Check the email/)).toBeVisible();
  await page.getByLabel("Email for row 1").fill("recovery@example.com");
  await page.reload();
  await expect(page.getByLabel("Email for row 1")).toHaveValue(
    "recovery@example.com",
  );
  await page.getByRole("button", { name: "Import selected guests" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("CSV Recovery", { exact: true })).toBeVisible();
});
