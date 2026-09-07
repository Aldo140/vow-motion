import { test, expect } from "@playwright/test";
test("marketing, private demo, guest RSVP, seating, and CSV export", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Your entire wedding. Beautifully shared.",
    }),
  ).toBeVisible();
  await page.waitForTimeout(1400);
  await page.screenshot({
    path: "artifacts/marketing-desktop.png",
    fullPage: true,
  });
  await page.goto("/login");
  await page.getByRole("button", { name: "Try a private demo" }).click();
  await page.waitForURL("**/studio");
  await expect(
    page.getByRole("heading", { name: "A beautiful day in the making." }),
  ).toBeVisible();
  await page.screenshot({
    path: "artifacts/studio-desktop.png",
    fullPage: true,
  });
  const info = await (await page.request.get("/api/weddings")).json();
  const wid = info[0].id;
  await page.goto("/studio/guests?wid=" + wid);
  await expect(
    page.getByRole("heading", { name: "Your people, together." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add guest", exact: true }).click();
  await page
    .getByLabel("Full name", { exact: true })
    .fill("Browser Test Guest");
  await page
    .getByLabel("Email", { exact: true })
    .fill("browser-test@example.com");
  await page
    .getByLabel("Household", { exact: true })
    .fill("Browser test household");
  await page.getByRole("button", { name: "Save guest" }).click();
  await expect(
    page.getByText("Browser Test Guest", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "artifacts/guests-desktop.png",
    fullPage: true,
  });
  const studio = await (
    await page.request.get("/api/studio?wedding=" + wid)
  ).json();
  const household = studio.households.find(
    (h: { name: string }) => h.name === "Williams household",
  );
  const invitation = await (
    await page.request.post("/api/studio/invitations?wedding=" + wid, {
      data: { household_id: household.id },
    })
  ).json();
  await page.goto(invitation.url);
  await page.getByRole("button", { name: "Open your invitation" }).click();
  await expect(
    page.getByRole("heading", { name: "A weekend to remember." }),
  ).toBeVisible();
  await page.screenshot({
    path: "artifacts/guest-desktop.png",
    fullPage: true,
  });
  await page
    .locator(".guest-dock")
    .getByRole("button", { name: "Your RSVP" })
    .click();
  await page.getByRole("button", { name: "A few little details" }).click();
  const meals = page.getByLabel("What should we prepare?");
  for (let i = 0; i < (await meals.count()); i++)
    await meals.nth(i).selectOption("Garden risotto");
  await page.getByRole("button", { name: "Save our response" }).click();
  await expect(
    page.getByRole("heading", { name: "A place in our story." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Back to the celebration" }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Open your invitation" }),
  ).toHaveCount(0);
  await expect(
    page
      .locator(".guest-dock")
      .getByRole("button", { name: "Update our response" }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "artifacts/guest-mobile.png", fullPage: true });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.goto("/studio/seating?wid=" + wid);
  await expect(
    page.getByRole("heading", { name: "A place for everyone." }),
  ).toBeVisible();
  await page
    .getByLabel("Table for Jessica Williams")
    .selectOption({ label: "Olivo" });
  await expect(page.getByText("A place at the table, saved.")).toBeVisible();
  await page.goto("/studio?wid=" + wid);
  await expect(
    page.getByRole("heading", { name: "A beautiful day in the making." }),
  ).toBeVisible();
  await page.screenshot({
    path: "artifacts/studio-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  const csv = await page.request.get("/api/studio/export?wedding=" + wid);
  expect(csv.ok()).toBeTruthy();
  expect(await csv.text()).toContain("Browser Test Guest");
  await page.goto("/");
  await page.screenshot({
    path: "artifacts/marketing-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  expect(errors).toEqual([]);
});
test("tenant isolation, event privacy, invalid RSVP, and durable household response", async ({
  request,
  browser,
}) => {
  const first = await browser.newContext();
  await first.request.post("/api/demo");
  const weddings = await (await first.request.get("/api/weddings")).json();
  const wid = weddings[0].id;
  const studio = await (
    await first.request.get("/api/studio?wedding=" + wid)
  ).json();
  expect((await request.get("/api/studio?wedding=" + wid)).status()).toBe(401);
  const second = await browser.newContext();
  await second.request.post("/api/demo");
  expect(
    (await second.request.get("/api/studio?wedding=" + wid)).status(),
  ).toBe(404);
  const publicHousehold = studio.households.at(-1);
  const invite = await (
    await first.request.post("/api/studio/invitations?wedding=" + wid, {
      data: { household_id: publicHousehold.id },
    })
  ).json();
  const token = invite.url.split("/").at(-1);
  const guest = await (await request.get("/api/guest?token=" + token)).json();
  expect(
    guest.events.every((e: { visibility: string }) => e.visibility === "all"),
  ).toBeTruthy();
  expect(
    guest.guests.every(
      (g: { household_id: string }) => g.household_id === publicHousehold.id,
    ),
  ).toBeTruthy();
  expect(guest.wedding.owner_id).toBeUndefined();
  const forbidden = studio.events.find(
    (e: { visibility: string }) => e.visibility === "private",
  );
  const invalid = await request.post("/api/guest/rsvp?token=" + token, {
    data: {
      // A complete set for this household, with one event swapped for a
      // private one it was never invited to, so authorization is what
      // rejects the response rather than the completeness check.
      responses: guest.guests.flatMap((g: { id: string }) =>
        guest.events.map((e: { id: string }, index: number) => ({
          guest_id: g.id,
          event_id: index === 0 ? forbidden.id : e.id,
          attending: true,
          meal: "Sea bass",
        })),
      ),
    },
  });
  expect(invalid.status()).toBe(403);
  const valid = await request.post("/api/guest/rsvp?token=" + token, {
    data: {
      responses: guest.guests.flatMap((g: { id: string }) =>
        guest.events.map((e: { id: string }) => ({
          guest_id: g.id,
          event_id: e.id,
          attending: false,
          meal: "",
        })),
      ),
    },
  });
  expect(valid.ok()).toBeTruthy();
  const saved = await (await request.get("/api/guest?token=" + token)).json();
  expect(
    saved.guests.every((g: { status: string }) => g.status === "declined"),
  ).toBeTruthy();
  await first.request.post("/api/studio/invitations?wedding=" + wid, {
    data: { household_id: publicHousehold.id, revoke: true },
  });
  expect((await request.get("/api/guest?token=" + token)).status()).toBe(404);
  await first.close();
  await second.close();
});
