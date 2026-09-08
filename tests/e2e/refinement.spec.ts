import { test, expect } from "./fixtures";

test("couples edit venue times, review message audiences, and navigate without a document reload", async ({
  page,
}) => {
  await page.request.post("/api/demo");
  const weddings = await (await page.request.get("/api/weddings")).json();
  const wid = weddings[0].id;
  await page.goto(`/studio?wid=${wid}`);
  await expect(
    page.getByRole("region", { name: "Planning priorities" }),
  ).toBeVisible();
  await page.screenshot({
    path: "artifacts/refined-overview.png",
    fullPage: true,
  });
  await page.evaluate(() => {
    (window as unknown as { navigationMarker: string }).navigationMarker =
      "retained";
  });
  await page
    .getByRole("navigation", { name: "Studio navigation" })
    .getByRole("link", { name: "Events", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Every moment, considered." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { navigationMarker: string }).navigationMarker,
    ),
  ).toBe("retained");
  await page.getByRole("button", { name: "Add an event" }).click();
  await page
    .getByLabel("Event title", { exact: true })
    .fill("Midnight in New York");
  await page.getByLabel("Starts", { exact: true }).fill("2027-06-19T23:30");
  await page.getByLabel("Ends", { exact: true }).fill("2027-06-20T01:00");
  await page
    .getByLabel("Venue timezone", { exact: true })
    .fill("America/New_York");
  await page.getByLabel("Venue", { exact: true }).fill("The Drawing Room");
  await page.screenshot({ path: "artifacts/refined-event-editor.png" });
  await page.getByRole("button", { name: "Save event" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const data = await (
    await page.request.get(`/api/studio?wedding=${wid}`)
  ).json();
  const event = data.events.find(
    (e: { title: string }) => e.title === "Midnight in New York",
  );
  expect(new Date(event.starts_at).toISOString()).toBe(
    "2027-06-20T03:30:00.000Z",
  );
  await page
    .locator(".event-studio")
    .filter({ hasText: "Midnight in New York" })
    .getByRole("button", { name: "Edit event" })
    .click();
  await expect(page.getByLabel("Starts", { exact: true })).toHaveValue(
    "2027-06-19T23:30",
  );
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page
    .getByRole("navigation", { name: "Studio navigation" })
    .getByRole("link", { name: "Messages", exact: true })
    .click();
  await page.getByRole("button", { name: "Write a message" }).click();
  await page
    .getByRole("button", { name: "RSVP reminder", exact: true })
    .click();
  await expect(page.getByLabel("For whom?")).toHaveValue("pending");
  const expected = data.guests.filter(
    (g: { status: string; consent: boolean; email: string }) =>
      g.status === "pending" && g.consent && g.email,
  ).length;
  await expect(page.locator(".audience-preview strong")).toHaveText(
    `${expected} ${expected === 1 ? "guest" : "guests"} can receive this email`,
  );
  expect(await page.getByLabel("Your message").inputValue()).toContain(
    data.wedding.names,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "artifacts/refined-message-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("heading", {
      name: `A little reminder · ${data.wedding.names}`,
    }),
  ).toBeVisible();
});

test("photo retry skips completed files after a partial failure", async ({
  page,
}) => {
  await page.goto("/demo/riviera");
  await page.getByRole("button", { name: "Open your invitation" }).click();
  await page
    .getByRole("button", { name: "Share a memory", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Share a memory" });
  const sharp = (await import("sharp")).default;
  const buffer = await sharp({
    create: { width: 20, height: 20, channels: 3, background: "#71816a" },
  })
    .png()
    .toBuffer();
  await page.getByLabel("Choose your photos", { exact: true }).setInputFiles([
    { name: "first.png", mimeType: "image/png", buffer },
    { name: "second.png", mimeType: "image/png", buffer },
  ]);
  let requests = 0;
  await page.route("**/api/guest/photos?*", async (route) => {
    requests++;
    if (requests === 2)
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "Please try again." }),
      });
    else await route.continue();
  });
  await dialog.getByRole("button", { name: "Share a memory" }).click();
  await expect(dialog.getByRole("alert")).toContainText("Please try again.");
  await dialog.getByRole("button", { name: "Share a memory" }).click();
  await expect(dialog.getByRole("status")).toContainText("ready for review");
  expect(requests).toBe(3);
  expect(
    await page
      .getByLabel("Choose your photos", { exact: true })
      .evaluate((input: HTMLInputElement) => input.files?.length),
  ).toBe(0);
});

test("travel edits keep the original record and cannot cross weddings", async ({
  page,
}) => {
  await page.request.post("/api/demo");
  const weddings = await (await page.request.get("/api/weddings")).json();
  const wid = weddings[0].id;
  const initial = await (
    await page.request.get(`/api/studio?wedding=${wid}`)
  ).json();
  const detail = initial.travel[0];
  await page.goto(`/studio/travel?wid=${wid}`);
  await page
    .getByRole("button", { name: `Edit ${detail.title}`, exact: true })
    .click();
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue(
    detail.title,
  );
  await page
    .getByLabel("Description", { exact: true })
    .fill(
      "Our shuttle leaves the hotel at 3:30 pm. Please arrive ten minutes early.",
    );
  await page.getByRole("button", { name: "Save detail" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByText(
      "Our shuttle leaves the hotel at 3:30 pm. Please arrive ten minutes early.",
      { exact: true },
    ),
  ).toBeVisible();
  const updated = await (
    await page.request.get(`/api/studio?wedding=${wid}`)
  ).json();
  expect(updated.travel.length).toBe(initial.travel.length);
  expect(
    updated.travel.find((t: { id: string }) => t.id === detail.id).description,
  ).toContain("3:30 pm");
  const wrongWedding = await page.request.patch(
    `/api/studio/travel/${detail.id}?wedding=${weddings[1].id}`,
    { data: detail },
  );
  expect(wrongWedding.status()).toBe(404);
});
