import { test, expect } from "./fixtures";
test("RSVP collects optional permission, protects households, and makes opt out available", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect((await page.request.post("/api/demo")).ok()).toBeTruthy();
  const [wedding] = await (await page.request.get("/api/weddings")).json();
  const studio = await (
    await page.request.get(`/api/studio?wedding=${wedding.id}`)
  ).json();
  const invitation = await (
    await page.request.post(`/api/studio/invitations?wedding=${wedding.id}`, {
      data: { household_id: studio.households[0].id },
    })
  ).json();
  const token = invitation.url.split("/").at(-1);
  const endpoint = `/api/guest?token=${token}`;
  const guest = await (await page.request.get(endpoint)).json();
  for (const g of guest.guests) {
    expect(
      (
        await page.request.post(`/api/guest/contact?token=${token}`, {
          data: {
            guest_id: g.id,
            email: "",
            phone: "",
            address: g.address || "",
            consent: false,
          },
        })
      ).ok(),
    ).toBeTruthy();
  }
  await page.goto(new URL(invitation.url).pathname);
  await page.getByRole("button", { name: "Open your invitation" }).click();
  await page
    .locator(".guest-dock")
    .getByRole("button", { name: /Your RSVP|Update our response/ })
    .click();
  await page.getByRole("button", { name: "A few little details" }).click();
  for (const meal of await page.getByLabel("What should we prepare?").all())
    await meal.selectOption("Garden risotto");
  const choices = page.locator(".wedding-updates-person");
  for (const checkbox of await choices.getByRole("checkbox").all())
    await expect(checkbox).not.toBeChecked();
  await choices.first().getByRole("checkbox").check();
  await choices
    .first()
    .getByLabel("Email for wedding updates", { exact: true })
    .fill("guest-updates@example.test");
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await choices.first().scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    await page.screenshot({ path: `artifacts/rsvp-updates-${width}.png` });
  }
  await page.getByRole("button", { name: "Save our response" }).click();
  await expect(
    page.getByRole("dialog", { name: "A place in our story." }),
  ).toBeVisible();
  let saved = await (await page.request.get(endpoint)).json();
  const subscribed = saved.guests.find(
    (g: { email: string }) => g.email === "guest-updates@example.test",
  );
  expect(subscribed?.consent).toBe(true);
  expect(subscribed.status).toBe("attending");
  for (const g of saved.guests.filter(
    (g: { id: string }) => g.id !== subscribed.id,
  ))
    expect(g.consent).toBe(false);
  const other = studio.guests.find(
    (g: { household_id: string }) => g.household_id !== studio.households[0].id,
  );
  const invalid = await page.request.post(`/api/guest/rsvp?token=${token}`, {
    data: {
      responses: saved.responses,
      contacts: [
        {
          guest_id: other.id,
          consent: true,
          email: "bad@example.test",
          phone: "",
        },
      ],
    },
  });
  expect(invalid.status()).toBe(403);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Contact & wedding updates" })
    .click();
  await page.getByLabel("Guest", { exact: true }).selectOption(subscribed.id);
  await page.getByRole("dialog").getByRole("checkbox").uncheck();
  await page.getByRole("button", { name: "Save details" }).click();
  await expect(
    page.getByText("Contact details saved.", { exact: true }),
  ).toBeVisible();
  saved = await (await page.request.get(endpoint)).json();
  expect(
    saved.guests.find((g: { id: string }) => g.id === subscribed.id).consent,
  ).toBe(false);
  expect(
    saved.guests.find((g: { id: string }) => g.id === subscribed.id).status,
  ).toBe("attending");
  await page.goto(`/studio/messages?wid=${wedding.id}`);
  await expect(
    page.getByRole("heading", { name: "Guests choose updates in their RSVP." }),
  ).toBeVisible();
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    await page.screenshot({
      path: `artifacts/messages-readiness-${width}.png`,
      fullPage: true,
    });
  }
  await page
    .getByRole("button", { name: "Write an invitation update" })
    .click();
  await expect(page.getByLabel("Channel", { exact: true })).toHaveValue(
    "invitation",
  );
  await expect(
    page
      .getByRole("dialog")
      .getByText(/guests can receive this invitation update/),
  ).toBeVisible();
});
