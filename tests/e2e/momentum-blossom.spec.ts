import { test, expect } from "./fixtures";
import { readinessSignature } from "../../src/lib/momentum";

test("momentum resolves household contact exceptions and prepares a scoped reminder", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.request.post("/api/demo");
  const weddings = await (await page.request.get("/api/weddings")).json();
  const wid = weddings[0].id;
  const initial = await (
    await page.request.get(`/api/studio?wedding=${wid}`)
  ).json();
  const h = initial.households[0];
  for (const g of initial.guests.filter(
    (g: { household_id: string }) => g.household_id === h.id,
  ))
    await page.request.patch(`/api/studio/guests/${g.id}?wedding=${wid}`, {
      data: { ...g, email: "" },
    });
  await page.goto(`/studio?wid=${wid}`);
  await expect(
    page.getByRole("navigation", { name: "Wedding chapters" }),
  ).toBeVisible();
  await expect(page.locator(".momentum-command")).toBeVisible();
  const command = await page.locator(".momentum-command").boundingBox();
  const paper = await page.locator(".momentum-specimen-paper").boundingBox();
  expect(command!.height).toBeLessThan(700);
  expect(paper!.width).toBeGreaterThan(240);
  expect(paper!.height).toBeLessThan(500);
  await page.screenshot({
    path: "artifacts/momentum-overview-desktop.png",
    fullPage: true,
  });
  await page.goto(`/studio/guests?wid=${wid}&filter=missing-email`);
  await expect(page.locator("tbody tr")).toHaveCount(2);
  await page
    .getByRole("button", {
      name: `Edit ${initial.guests.find((g: { household_id: string }) => g.household_id === h.id).name}`,
      exact: true,
    })
    .click();
  await page.getByLabel("Email", { exact: true }).fill("household@example.com");
  await page.getByRole("button", { name: "Save guest", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "What changed" }),
  ).toBeVisible();
  await page.request.post(`/api/studio/invitations?wedding=${wid}`, {
    data: { household_id: h.id },
  });
  await page.goto(`/studio/messages?wid=${wid}&intent=rsvp-reminder`);
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByLabel("For whom?", { exact: true })).toHaveValue(
    "invited-pending",
  );
  await expect(page.getByLabel("Subject", { exact: true })).not.toHaveValue("");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/studio?wid=${wid}`);
  await expect(page.locator(".momentum-command")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "artifacts/momentum-overview-mobile.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("botanical drafts publish deliberately and remain composed on phones and reduced motion", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.request.post("/api/demo");
  const weddings = await (await page.request.get("/api/weddings")).json();
  const wid = weddings[0].id;
  const endpoint = `/api/design?wedding=${wid}`;
  let state = await (await page.request.get(endpoint)).json();
  const draft = { ...state.draft, botanical: "cherry-blossom" };
  const save = await page.request.patch(endpoint, {
    data: { revision: state.revision, base: state.draft, draft },
  });
  expect(save.ok(), await save.text()).toBeTruthy();
  state = await save.json();
  let studio = await (
    await page.request.get(`/api/studio?wedding=${wid}`)
  ).json();
  expect(studio.wedding.settings.botanical).not.toBe("cherry-blossom");
  const publish = await page.request.post(
    `/api/design/publish?wedding=${wid}`,
    {
      data: { revision: state.revision, base: state.draft, draft: state.draft },
    },
  );
  expect(publish.ok(), await publish.text()).toBeTruthy();
  studio = await (await page.request.get(`/api/studio?wedding=${wid}`)).json();
  expect(studio.wedding.settings.botanical).toBe("cherry-blossom");
  const invitation = await (
    await page.request.post(`/api/studio/invitations?wedding=${wid}`, {
      data: { household_id: studio.households[0].id },
    })
  ).json();
  await page.goto(invitation.url);
  await expect(page.locator(".opening-bough")).toBeVisible();
  await page.screenshot({ path: "artifacts/blossom-opening-desktop.png" });
  await page
    .getByRole("button", { name: "Open your invitation", exact: true })
    .click();
  await expect(page.locator(".invitation-bough")).toBeVisible();
  await expect(page.locator(".letter-blossom-imprint")).toBeVisible();
  await page.waitForTimeout(1600);
  await page.screenshot({ path: "artifacts/blossom-invitation-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(page.locator(".invitation-bough")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "artifacts/blossom-invitation-mobile.png",
    fullPage: true,
  });
  await expect(page.locator(".reply-blossom")).toBeVisible();
  await page.goto(`/studio/experience?wid=${wid}`);
  await expect(
    page.getByRole("button", { name: /Cherry blossom Seasonal/ }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(errors).toEqual([]);
});

test("onboarding reveals actual saved foundations and telemetry rejects private content", async ({
  page,
}) => {
  await page.request.post("/api/auth/register", {
    data: {
      name: "Beginning",
      email: `beginning-${Date.now()}@example.com`,
      password: "Wedding-beginning-2027",
    },
  });
  await page.goto("/start");
  await page.getByLabel("Your names", { exact: true }).fill("Morgan & Jules");
  await page.getByRole("button", { name: "Set the day" }).click();
  await page.getByLabel("Wedding date", { exact: true }).fill("2027-09-10");
  await page.getByLabel("Location", { exact: true }).fill("Banff, Alberta");
  await page
    .getByLabel("Wedding timezone", { exact: true })
    .selectOption("America/Edmonton");
  await page.getByRole("button", { name: "Explore your world" }).click();
  await page.getByRole("radio", { name: "Garden", exact: true }).check();
  await expect(page.locator(".beginning-paper h2")).toHaveText(
    "Morgan & Jules",
  );
  await page
    .getByRole("button", { name: "Create your wedding", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Look what you’ve already begun." }),
  ).toBeVisible();
  const weddings = await (await page.request.get("/api/weddings")).json();
  expect(weddings[0]).toMatchObject({
    names: "Morgan & Jules",
    world: "garden",
    status: "draft",
    timezone: "America/Edmonton",
  });
  const telemetry = await page.request.post("/api/momentum", {
    data: {
      event: "screen_viewed",
      screen: "guests",
      email: "private@example.com",
    },
  });
  expect(telemetry.status()).toBe(400);
  expect((await page.request.get("/api/momentum")).status()).toBe(404);
  await page.screenshot({
    path: "artifacts/momentum-onboarding-reveal.png",
    fullPage: true,
  });
});

test("cherry stationery preserves six worlds, both openings, Spanish and narrow-screen controls", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.clear());
  await page.request.post("/api/demo");
  const [w] = await (await page.request.get("/api/weddings")).json();
  const d = await (
    await page.request.get(`/api/studio?wedding=${w.id}`)
  ).json();
  await page.setViewportSize({ width: 320, height: 780 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const world of [
    "riviera",
    "maison",
    "notte",
    "heritage",
    "modernist",
    "garden",
  ]) {
    for (const opening of ["seal", "envelope"]) {
      const saved = await page.request.patch(
        `/api/studio/settings?wedding=${w.id}`,
        {
          data: {
            ...d.wedding,
            world,
            opening,
            settings: { botanical: "cherry-blossom" },
          },
        },
      );
      expect(saved.ok(), await saved.text()).toBeTruthy();
      const { url } = await (
        await page.request.post(`/api/studio/invitations?wedding=${w.id}`, {
          data: { household_id: d.households[0].id },
        })
      ).json();
      await page.goto(url);
      await expect(
        page.locator(opening === "seal" ? ".sealed-bough" : ".opening-bough"),
      ).toBeVisible();
      await page.getByRole("button", { name: "Ver en español" }).click();
      const open = page.getByRole("button", {
        name: "Abre tu invitación",
        exact: true,
      });
      await expect(open).toBeEnabled();
      await open.focus();
      await page.keyboard.press("Enter");
      await expect(page.locator(".invitation-bough")).toBeVisible();
      await expect(page.locator(".guest-hero h1")).toContainText(
        d.wedding.names.split(" & ")[0],
      );
      await expect(page.locator(".date-keepsake")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
      if (world === "notte" && opening === "seal")
        await page.screenshot({ path: "artifacts/blossom-notte-320.png" });
    }
  }
});

test("final review validates a real completed plan and reopens after a change", async ({
  page,
}) => {
  await page.request.post("/api/auth/register", {
    data: {
      name: "Review",
      email: `review-${Date.now()}@example.com`,
      password: "Wedding-review-2027",
    },
  });
  const { id: wid } = await (
    await page.request.post("/api/weddings", {
      data: {
        names: "Alex & Sam",
        date: "2027-08-08",
        location: "Banff",
        world: "garden",
        timezone: "America/Edmonton",
      },
    })
  ).json();
  await page.request.post(`/api/studio/guests?wedding=${wid}`, {
    data: { name: "Taylor", email: "taylor@example.com", household: "Taylor" },
  });
  let d = await (await page.request.get(`/api/studio?wedding=${wid}`)).json();
  expect(
    (
      await page.request.post(`/api/studio/momentum-review?wedding=${wid}`, {
        data: { signature: readinessSignature(d) },
      })
    ).status(),
  ).toBe(400);
  for (const step of ["identity", "details", "events", "guests", "preview"])
    expect(
      (
        await page.request.patch(`/api/studio/setup?wedding=${wid}`, {
          data: { step, done: true },
        })
      ).ok(),
    ).toBeTruthy();
  const { url } = await (
    await page.request.post(`/api/studio/invitations?wedding=${wid}`, {
      data: { household_id: d.households[0].id },
    })
  ).json();
  const token = url.split("/i/")[1];
  const response = await page.request.post(`/api/guest/rsvp?token=${token}`, {
    data: {
      responses: d.events.map((e: { id: string }) => ({
        guest_id: d.guests[0].id,
        event_id: e.id,
        attending: true,
        meal: "Garden risotto",
      })),
    },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  await page.request.post(`/api/studio/tables?wedding=${wid}`, {
    data: { name: "Garden", capacity: 4 },
  });
  d = await (await page.request.get(`/api/studio?wedding=${wid}`)).json();
  await page.request.post(`/api/studio/seating?wedding=${wid}`, {
    data: { guest_id: d.guests[0].id, table_id: d.tables[0].id },
  });
  await page.goto(`/studio/analytics?wid=${wid}`);
  await page
    .getByRole("checkbox", {
      name: "I have reviewed the current plans and final guest communication.",
    })
    .check();
  await page
    .getByRole("button", { name: "Mark current plans reviewed" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your current plans are reviewed." }),
  ).toBeVisible();
  d = await (await page.request.get(`/api/studio?wedding=${wid}`)).json();
  expect(d.wedding.settings.momentum.readySignature).toBe(
    readinessSignature(d),
  );
  await page.request.post(`/api/studio/travel?wedding=${wid}`, {
    data: {
      title: "Hotel",
      type: "hotel",
      description: "An updated meeting point",
      address: "Banff",
      url: "",
      price: "",
    },
  });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "One last, thoughtful review." }),
  ).toBeVisible();
});
