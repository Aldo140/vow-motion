import { test, expect } from "@playwright/test";
import sharp from "sharp";

test("password story is private until unlock; photos require moderation and authorized access", async ({
  page,
  browser,
}) => {
  await page.request.post("/api/demo");
  const weddings = await (await page.request.get("/api/weddings")).json(),
    wid = weddings[0].id;
  let data = await (
    await page.request.get("/api/studio?wedding=" + wid)
  ).json();
  const secret = "A private story only hosts should share.";
  const settings = await page.request.patch(
    "/api/studio/settings?wedding=" + wid,
    {
      data: {
        ...data.wedding,
        story: secret,
        privacy: "password",
        password: "only-our-people",
      },
    },
  );
  expect(settings.status()).toBe(200);
  data = await (await page.request.get("/api/studio?wedding=" + wid)).json();
  expect(data.wedding.password_hash).toBeUndefined();
  expect(data.weddings[0].password_hash).toBeUndefined();
  await page.goto("/w/" + data.wedding.slug);
  await expect(
    page.getByRole("heading", { name: "A story for our people." }),
  ).toBeVisible();
  expect(await page.content()).not.toContain(secret);
  await page.getByLabel("Wedding password").fill("wrong-password");
  await page.getByRole("button", { name: "Read our story" }).click();
  await expect(page.locator(".notice.error")).toContainText(
    "password did not match",
  );
  await page.getByLabel("Wedding password").fill("only-our-people");
  await page.getByRole("button", { name: "Read our story" }).click();
  await expect(page.getByText(secret, { exact: true })).toBeVisible();
  const link = await (
    await page.request.post("/api/studio/invitations?wedding=" + wid, {
      data: { household_id: data.households[0].id },
    })
  ).json();
  const token = link.url.split("/").at(-1);
  const guest = await browser.newContext(),
    other = await browser.newContext();
  const second = await (
    await page.request.post("/api/studio/invitations?wedding=" + wid, {
      data: { household_id: data.households[1].id },
    })
  ).json();
  const secondToken = second.url.split("/").at(-1);
  const buffer = await sharp({
    create: { width: 40, height: 40, channels: 3, background: "#71816a" },
  })
    .png()
    .toBuffer();
  const uploaded = await guest.request.post(
    "/api/guest/photos?token=" + token,
    {
      multipart: {
        file: { name: "memory.png", mimeType: "image/png", buffer },
        caption: "A shared test memory",
      },
    },
  );
  expect(uploaded.status()).toBe(200);
  data = await (await page.request.get("/api/studio?wedding=" + wid)).json();
  const photo = data.photos.find(
    (p: { caption: string }) => p.caption === "A shared test memory",
  );
  expect(photo.approved).toBe(false);
  expect((await other.request.get("/api/photos/" + photo.id)).status()).toBe(
    401,
  );
  expect(
    (
      await other.request.get(
        "/api/photos/" + photo.id + "?token=" + secondToken,
      )
    ).status(),
  ).toBe(403);
  expect(
    (
      await guest.request.get("/api/photos/" + photo.id + "?token=" + token)
    ).status(),
  ).toBe(200);
  expect(
    (
      await page.request.patch(
        "/api/studio/photos/" + photo.id + "?wedding=" + wid,
        { data: { approved: true } },
      )
    ).status(),
  ).toBe(200);
  expect(
    (
      await other.request.get(
        "/api/photos/" + photo.id + "?token=" + secondToken,
      )
    ).status(),
  ).toBe(200);
  expect(
    (
      await page.request.delete(
        "/api/studio/photos/" + photo.id + "?wedding=" + wid,
      )
    ).status(),
  ).toBe(200);
  expect(
    (
      await guest.request.get("/api/photos/" + photo.id + "?token=" + token)
    ).status(),
  ).toBe(404);
  await guest.close();
  await other.close();
});

test("full event accepts household attendee swaps but rejects net overcapacity", async ({
  request,
}) => {
  await request.post("/api/demo");
  const weddings = await (await request.get("/api/weddings")).json(),
    wid = weddings[0].id;
  const studio = await (await request.get("/api/studio?wedding=" + wid)).json();
  const household = studio.households[0];
  const eventInput = {
    title: "An intimate rehearsal",
    starts_at: "2027-06-18T18:00:00Z",
    ends_at: "2027-06-18T20:00:00Z",
    timezone: "Europe/Rome",
    venue: "The terrace",
    visibility: "private",
    capacity: 1,
    household_ids: [household.id],
  };
  expect(
    (
      await request.post("/api/studio/events?wedding=" + wid, {
        data: eventInput,
      })
    ).status(),
  ).toBe(200);
  const invitation = await (
    await request.post("/api/studio/invitations?wedding=" + wid, {
      data: { household_id: household.id },
    })
  ).json();
  const token = invitation.url.split("/").at(-1);
  const guest = await (await request.get("/api/guest?token=" + token)).json();
  const event = guest.events.find(
    (e: { title: string }) => e.title === eventInput.title,
  );
  const responses = guest.guests.flatMap((g: { id: string }, index: number) =>
    guest.events.map((e: { id: string }) => ({
      guest_id: g.id,
      event_id: e.id,
      attending: e.id === event.id ? index === 1 : false,
      meal: e.id === event.id && index === 1 ? "Sea bass" : "",
    })),
  );
  expect(
    (
      await request.post("/api/guest/rsvp?token=" + token, {
        data: { responses },
      })
    ).status(),
  ).toBe(200);
  const swapped = responses.map(
    (r: {
      event_id: string;
      guest_id: string;
      attending: boolean;
      meal: string;
    }) =>
      r.event_id === event.id
        ? {
            ...r,
            attending: !r.attending,
            meal: r.attending ? "" : "Garden risotto",
          }
        : r,
  );
  expect(
    (
      await request.post("/api/guest/rsvp?token=" + token, {
        data: { responses: swapped },
      })
    ).status(),
  ).toBe(200);
  const over = swapped.map(
    (r: { event_id: string; attending: boolean; meal: string }) =>
      r.event_id === event.id ? { ...r, attending: true, meal: "Sea bass" } : r,
  );
  expect(
    (
      await request.post("/api/guest/rsvp?token=" + token, {
        data: { responses: over },
      })
    ).status(),
  ).toBe(409);
  const saved = await (await request.get("/api/guest?token=" + token)).json();
  expect(
    saved.responses.filter(
      (r: { event_id: string; attending: boolean }) =>
        r.event_id === event.id && r.attending,
    ),
  ).toHaveLength(1);
});

test("mobile navigation and dialogs restore focus; Maison names remain clear on the layered paper", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.request.post("/api/demo");
  await page.goto("/studio");
  await expect(
    page.getByRole("heading", { name: "A beautiful day in the making." }),
  ).toBeVisible();
  expect(
    await page
      .locator(".studio-sidebar")
      .evaluate((el) => el.hasAttribute("inert")),
  ).toBe(true);
  const open = page.getByRole("button", { name: "Open navigation" });
  await open.click();
  await expect(open).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(open).toBeFocused();
  await expect(open).toHaveAttribute("aria-expanded", "false");
  await page.goto("/demo/maison");
  await page.getByRole("button", { name: "Open your invitation" }).click();
  await page.waitForTimeout(1100);
  const title = await page.locator(".guest-hero h1").boundingBox(),
    letter = await page.locator(".atelier-letter").boundingBox(),
    photo = await page.locator(".guest-hero-photo").boundingBox();
  // The name card intentionally overlaps the print. Its text must stay inside
  // the paper, above the photograph, with a useful area of the photo exposed.
  expect(title!.y).toBeGreaterThan(letter!.y);
  expect(title!.y + title!.height).toBeLessThan(letter!.y + letter!.height);
  expect(title!.x).toBeGreaterThan(letter!.x);
  expect(title!.x + title!.width).toBeLessThan(letter!.x + letter!.width);
  expect(photo!.y + photo!.height).toBeGreaterThan(
    letter!.y + letter!.height + 100,
  );
  expect(
    await page.locator(".guest-hero h1 > span").evaluateAll((names) =>
      names.every((name) => {
        const box = name.getBoundingClientRect();
        return (
          document
            .elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)
            ?.closest(".atelier-letter") !== null
        );
      }),
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/maison-mobile-fixed.png",
    fullPage: true,
  });
  const rsvp = page
    .locator(".guest-dock")
    .getByRole("button", { name: "Your RSVP" });
  await rsvp.click();
  await expect(
    page.getByRole("dialog", { name: "Will you join us?" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(rsvp).toBeFocused();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(page.locator(".guest-hero h1")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
