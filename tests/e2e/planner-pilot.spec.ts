import { test, expect } from "./fixtures";
import type { StudioData } from "../../src/lib/types";

test("household previews preserve private access and reject guest writes", async ({
  page,
}) => {
  await page.request.post("/api/demo");
  const weddings = await (await page.request.get("/api/weddings")).json();
  const wid = weddings[0].id;
  const data: StudioData = await (
    await page.request.get(`/api/studio?wedding=${wid}`)
  ).json();
  const household = data.households[1];
  const response = await page.request.post(
    `/api/studio/preview?wedding=${wid}`,
    { data: { household_id: household.id } },
  );
  expect(response.ok()).toBeTruthy();
  const { url } = await response.json();
  const token = url.split("/").at(-1);
  const guest = await (
    await page.request.get(`/api/guest?token=${token}`)
  ).json();
  expect(guest.preview).toBe(true);
  expect(
    guest.guests.every(
      (g: { household_id: string }) => g.household_id === household.id,
    ),
  ).toBe(true);
  expect(guest.events.map((e: { id: string }) => e.id).sort()).toEqual(
    data.events
      .filter(
        (e) =>
          e.visibility === "all" || e.household_ids?.includes(household.id),
      )
      .map((e) => e.id)
      .sort(),
  );
  for (const action of ["rsvp", "contact", "requests", "photos"]) {
    expect(
      (
        await page.request.post(`/api/guest/${action}?token=${token}`, {
          data: {},
        })
      ).status(),
    ).toBe(403);
  }
  await page.goto(url);
  await expect(page.locator(".guest-preview-banner")).toContainText(
    household.name,
  );
  expect(
    (
      await page.request.post(`/api/studio/preview?wedding=${wid}`, {
        data: { household_id: "foreign-household" },
      })
    ).status(),
  ).toBe(404);
});

test("pilot notes, guest answers and identity persist with wedding isolation", async ({
  page,
}) => {
  await page.request.post("/api/demo");
  const weddings = await (await page.request.get("/api/weddings")).json();
  const wid = weddings[0].id;
  const data: StudioData = await (
    await page.request.get(`/api/studio?wedding=${wid}`)
  ).json();
  expect(
    (
      await page.request.patch(`/api/studio/identity?wedding=${wid}`, {
        data: {
          monogram: "A+S",
          typography: "modern",
          accent: "blue",
          imagePosition: 70,
          plannerName: "Test Events",
          showPlanner: true,
        },
      })
    ).ok(),
  ).toBeTruthy();
  expect(
    (
      await page.request.patch(`/api/studio/identity?wedding=${wid}`, {
        data: { accent: "invalid" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await page.request.post(`/api/studio/feedback?wedding=${wid}`, {
        data: {
          screen: "/studio/guests",
          body: "Please make household grouping easier to scan.",
        },
      })
    ).ok(),
  ).toBeTruthy();
  let updated: StudioData = await (
    await page.request.get(`/api/studio?wedding=${wid}`)
  ).json();
  const feedback = updated.feedback![0];
  expect(
    (
      await page.request.patch(
        `/api/studio/feedback/${feedback.id}?wedding=${wid}`,
        { data: { status: "in-progress" } },
      )
    ).ok(),
  ).toBeTruthy();
  const tokens: string[] = [];
  for (const h of data.households.slice(0, 2)) {
    const { url } = await (
      await page.request.post(`/api/studio/invitations?wedding=${wid}`, {
        data: { household_id: h.id },
      })
    ).json();
    tokens.push(url.split("/").at(-1));
  }
  expect(
    (
      await page.request.post(`/api/guest/requests?token=${tokens[0]}`, {
        data: { question: "Can we leave our car overnight?" },
      })
    ).ok(),
  ).toBeTruthy();
  updated = await (await page.request.get(`/api/studio?wedding=${wid}`)).json();
  const question = updated.guestRequests![0];
  expect(
    (
      await page.request.patch(
        `/api/studio/requests/${question.id}?wedding=${wid}`,
        { data: { answer: "Yes, use the west car park." } },
      )
    ).ok(),
  ).toBeTruthy();
  const own = await (
    await page.request.get(`/api/guest?token=${tokens[0]}`)
  ).json();
  const other = await (
    await page.request.get(`/api/guest?token=${tokens[1]}`)
  ).json();
  expect(own.guestRequests[0].answer).toContain("west car park");
  expect(other.guestRequests).toHaveLength(0);
  expect(own.wedding.settings.identity.monogram).toBe("A+S");
  const newWedding = await (
    await page.request.post("/api/weddings", {
      data: {
        names: "Other & Couple",
        date: "2027-08-01",
        location: "Calgary",
        world: "garden",
      },
    })
  ).json();
  expect(
    (
      await page.request.patch(
        `/api/studio/feedback/${feedback.id}?wedding=${newWedding.id}`,
        { data: { status: "resolved" } },
      )
    ).status(),
  ).toBe(404);
  expect(
    (
      await page.request.post(`/api/studio/publish?wedding=${newWedding.id}`, {
        data: {},
      })
    ).status(),
  ).toBe(400);
  await page.goto(`/studio/experience?wid=${wid}`);
  await expect(page.getByLabel("Couple monogram")).toHaveValue("A+S");
  await expect(page.locator(".identity-suite article")).toHaveCount(4);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("CSV review identifies duplicates and imports selected households", async ({
  page,
}) => {
  await page.request.post("/api/demo");
  const weddings = await (await page.request.get("/api/weddings")).json();
  const wid = weddings[0].id;
  await page.goto(`/studio/guests?wid=${wid}`);
  await page.getByRole("button", { name: "Import guests" }).click();
  await page.getByLabel("Choose a CSV file").setInputFiles({
    name: "guests.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "Name,Email,Household\nPilot One,pilot@example.com,Pilot family\nPilot Two,pilot@example.com,Pilot family\n",
    ),
  });
  await expect(
    page.getByText("Possible duplicate", { exact: true }),
  ).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Import selected guests" }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Exclude possible duplicates" })
    .click();
  await page.getByRole("button", { name: "Import selected guests" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const data: StudioData = await (
    await page.request.get(`/api/studio?wedding=${wid}`)
  ).json();
  const added = data.guests.filter((g) => g.email === "pilot@example.com");
  expect(added).toHaveLength(1);
  expect(
    data.households.find((h) => h.id === added[0].household_id)?.name,
  ).toBe("Pilot family");
});

test("guided setup saves reviews and feedback from the active screen", async ({
  page,
}, testInfo) => {
  await page.request.post("/api/demo");
  const weddings = await (await page.request.get("/api/weddings")).json();
  const wid = weddings[0].id;
  const data = await (
    await page.request.get(`/api/studio?wedding=${wid}`)
  ).json();
  await page.request.patch(`/api/studio/settings?wedding=${wid}`, {
    data: { ...data.wedding, status: "draft" },
  });
  await page.goto(`/studio/setup?wid=${wid}`);
  await expect(
    page.getByRole("button", { name: "Publish wedding", exact: true }),
  ).toBeDisabled();
  for (let i = 0; i < 4; i++) {
    await page
      .getByRole("button", {
        name:
          i === 0
            ? "Save your experience and continue"
            : i === 1
              ? "Save settings and continue"
              : "Mark reviewed and continue",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("region", { name: "Wedding setup" }),
    ).toContainText(`${i + 1} of 5 reviewed`);
  }
  await page
    .getByRole("button", { name: "Guest preview", exact: true })
    .last()
    .click();
  await page
    .getByLabel("Household", { exact: true })
    .selectOption(data.households[1].id);
  await expect(page.getByRole("dialog")).toContainText("Events they will see");
  await page
    .getByRole("button", { name: "Open household preview", exact: true })
    .click();
  await expect(page.locator(".guest-preview-banner")).toContainText(
    data.households[1].name,
  );
  await page.getByRole("link", { name: "Return to Studio" }).click();
  await page
    .getByRole("button", { name: "Mark reviewed", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Publish wedding", exact: true })
    .click();
  await expect(page.locator(".publish-state")).toContainText("Published");
  await page
    .getByRole("button", { name: "Pilot feedback", exact: true })
    .click();
  await page
    .getByLabel("What happened, or what would help?")
    .fill("A useful first walkthrough with our wedding team.");
  await page
    .getByRole("button", { name: "Save feedback", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goto(`/studio/feedback?wid=${wid}`);
  const note = page
    .locator("article")
    .filter({ hasText: "A useful first walkthrough" });
  await expect(note).toContainText("/studio/setup");
  await note.getByLabel("Progress").selectOption("resolved");
  await expect(page.locator(".toast")).toHaveCount(0);
  await expect
    .poll(async () => {
      const saved = await (
        await page.request.get(`/api/studio?wedding=${wid}`)
      ).json();
      return saved.feedback.find((f: { body: string }) =>
        f.body.startsWith("A useful first walkthrough"),
      ).status;
    })
    .toBe("resolved");
  await page.goto(`/studio/experience?wid=${wid}`);
  await expect(page.locator(".identity-suite")).toBeVisible();
  await page
    .locator(".identity-editor")
    .screenshot({ path: testInfo.outputPath("identity-desktop.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .locator(".identity-editor")
    .screenshot({ path: testInfo.outputPath("identity-mobile.png") });
  await page.goto(`/studio?wid=${wid}`);
  await expect(
    page.getByRole("region", { name: "Your action list" }),
  ).toBeVisible();
  await page
    .getByRole("region", { name: "Your action list" })
    .screenshot({ path: testInfo.outputPath("actions-mobile.png") });
});
