import { test, expect } from "./fixtures";
test("personal photos stay in drafts until publication and remain wedding-scoped", async ({
  page,
  playwright,
}, testInfo) => {
  const registered = await page.request.post("/api/auth/register", {
    data: {
      email: `design-${Date.now()}@example.test`,
      password: "Photo-testing-2026",
      name: "Design test",
    },
  });
  expect(registered.ok()).toBeTruthy();
  const created = await page.request.post("/api/weddings", {
    data: {
      names: "Photo & Test",
      date: "2027-08-21",
      location: "Lake Como, Italy",
      world: "riviera",
    },
  });
  const { id: wedding } = await created.json();
  expect(wedding).toBeTruthy();
  const endpoint = `/api/design?wedding=${wedding}`;
  const initialResponse = await page.request.get(endpoint);
  expect(initialResponse.ok(), await initialResponse.text()).toBeTruthy();
  const initial = await initialResponse.json();
  const uploaded = await page.request.post(
    `/api/design/assets?wedding=${wedding}`,
    {
      multipart: {
        file: {
          name: "our-photo.webp",
          mimeType: "image/webp",
          buffer: await (
            await import("node:fs/promises")
          ).readFile("public/images/wedding-details.webp"),
        },
      },
    },
  );
  expect(uploaded.ok(), await uploaded.text()).toBeTruthy();
  const asset = await uploaded.json();
  const next = structuredClone(initial.draft);
  next.media.invitation = {
    asset: asset.id,
    crop: { x: 30, y: 70, fit: "contain" },
    worlds: {},
  };
  const saved = await page.request.patch(endpoint, {
    data: { revision: initial.revision, base: initial.draft, draft: next },
  });
  expect(saved.ok(), await saved.text()).toBeTruthy();
  const state = await saved.json();
  const studio = await (
    await page.request.get(`/api/studio?wedding=${wedding}`)
  ).json();
  expect(studio.wedding.settings.media).toBeUndefined();
  const guest = await playwright.request.newContext({
    baseURL: testInfo.project.use.baseURL,
  });
  expect(
    (
      await guest.get(`/api/design/assets/${asset.id}?wedding=${wedding}`)
    ).status(),
  ).toBe(404);
  const cross = await page.request.get(
    `/api/design/assets/${asset.id}?wedding=another-wedding`,
  );
  expect(cross.status()).toBe(404);
  const conflictDraft = structuredClone(initial.draft);
  conflictDraft.media.invitation = {
    ...next.media.invitation,
    crop: { x: 95, y: 50, fit: "cover" },
  };
  expect(
    (
      await page.request.patch(endpoint, {
        data: {
          revision: initial.revision,
          base: initial.draft,
          draft: conflictDraft,
        },
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await page.request.delete(
        `/api/design/assets/${asset.id}?wedding=${wedding}`,
      )
    ).status(),
  ).toBe(409);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/studio/experience?wid=${wedding}`);
  await expect(
    page.getByRole("heading", { name: "Make it feel like you." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Photos", exact: true }).click();
  await page.getByRole("button", { name: /A phone/ }).click();
  await expect(
    page.getByRole("heading", { name: "Opening background" }),
  ).toBeVisible();
  await expect(page.locator(".spot-mock.mock-phone .spot-tag")).toHaveText(
    "Using your main photo",
  );
  await page
    .getByRole("button", { name: "Skip, use my main photo", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Main invitation photo" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Use original instead" }),
  ).toBeVisible();
  await page.screenshot({
    path: "artifacts/design-photos-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  const preview = page.frameLocator('iframe[title="Your draft invitation"]');
  await expect(
    preview.getByRole("button", { name: "Open your invitation" }),
  ).toBeVisible();
  await preview.getByRole("button", { name: "Open your invitation" }).click();
  await expect(preview.locator(".guest-hero-photo img")).toHaveAttribute(
    "data-personal-photo",
    "true",
  );
  const published = await page.request.post(
    `/api/design/publish?wedding=${wedding}`,
    {
      data: { revision: state.revision, base: state.draft, draft: state.draft },
    },
  );
  expect(published.ok(), await published.text()).toBeTruthy();
  const after = await (
    await page.request.get(`/api/studio?wedding=${wedding}`)
  ).json();
  expect(after.wedding.settings.media.invitation.asset).toBe(asset.id);
  expect(after.wedding.status).toBe("draft");
  expect(after.responses).toEqual(studio.responses);
  expect(after.deliveries).toEqual(studio.deliveries);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`/studio/experience?wid=${wedding}`);
  await page.getByRole("button", { name: "Photos", exact: true }).click();
  await page.getByRole("button", { name: /A computer/ }).click();
  await expect(page.locator(".spot-mock.mock-computer")).toBeVisible();
  await page.screenshot({
    path: "artifacts/guided-photos-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Skip, use my main photo", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Next: your story photo", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Skip, keep the original", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Little details" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Use one I already added", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Use our-photo.webp", exact: true })
    .click();
  await expect
    .poll(
      async () =>
        (await (await page.request.get(endpoint)).json()).draft.media.details
          ?.asset,
    )
    .toBe(asset.id);
  // Clicking the photo in the drawing sets what stays in view on computers.
  await page
    .locator(".spot-mock .spot-tile-wide img")
    .click({ position: { x: 3, y: 3 } });
  await expect
    .poll(
      async () =>
        (await (await page.request.get(endpoint)).json()).draft.media.details
          ?.worlds?.riviera,
    )
    .toBeTruthy();
  await page.getByRole("button", { name: "Use original instead" }).click();
  await expect
    .poll(
      async () =>
        (await (await page.request.get(endpoint)).json()).draft.media.details,
    )
    .toBeUndefined();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect
    .poll(
      async () =>
        (await (await page.request.get(endpoint)).json()).draft.media.details
          ?.asset,
    )
    .toBe(asset.id);
  await page.setViewportSize({ width: 320, height: 844 });
  await page.getByRole("button", { name: "Phone", exact: true }).click();
  await expect(page.locator(".spot-mock.mock-phone")).toBeVisible();
  await page
    .getByRole("button", { name: "Next: travel postcard", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Use one I already added", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Use our-photo.webp", exact: true })
    .click();
  await expect
    .poll(
      async () =>
        (await (await page.request.get(endpoint)).json()).draft.media.venue
          ?.asset,
    )
    .toBe(asset.id);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/guided-photos-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /places have your photos/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Preview my invitation", exact: true }).click();
  await expect(page.locator('iframe[title="Your draft invitation"]')).toBeVisible();
  await page.goto("/studio/experience?wid=" + wedding);
  await page
    .getByRole("button", { name: "Personal details", exact: true })
    .click();
  await page.getByLabel("Couple monogram").fill("PT");
  await expect
    .poll(
      async () =>
        (await (await page.request.get(endpoint)).json()).draft.identity
          .monogram,
    )
    .toBe("PT");
  await page.reload();
  await page
    .getByRole("button", { name: "Personal details", exact: true })
    .click();
  await expect(page.getByLabel("Couple monogram")).toHaveValue("PT");
  expect(
    (await (await page.request.get(`/api/studio?wedding=${wedding}`)).json())
      .wedding.settings.identity.monogram,
  ).not.toBe("PT");
  const invalid = await page.request.post(
    `/api/design/assets?wedding=${wedding}`,
    {
      multipart: {
        file: {
          name: "broken.png",
          mimeType: "image/png",
          buffer: Buffer.from("not a photo"),
        },
      },
    },
  );
  expect(invalid.status()).toBe(400);
  for (const [index, world] of [
    "riviera",
    "maison",
    "notte",
    "heritage",
    "modernist",
    "garden",
  ].entries()) {
    for (const opening of ["envelope", "seal"]) {
      const current = await (await page.request.get(endpoint)).json();
      const draft = {
        ...current.draft,
        world,
        opening,
        media: Object.fromEntries(
          ["invitation", "story", "venue", "details"].map((role) => [
            role,
            next.media.invitation,
          ]),
        ),
      };
      expect(
        (
          await page.request.patch(endpoint, {
            data: { revision: current.revision, base: current.draft, draft },
          })
        ).ok(),
      ).toBeTruthy();
      await page.setViewportSize({
        width: [320, 390, 430, 768, 1440, 1920][index],
        height: 900,
      });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(`/design-preview?wedding=${wedding}`);
      await expect(page.locator(".gate-background")).toHaveAttribute(
        "data-personal-photo",
        "true",
      );
      await page
        .getByRole("button", { name: /Open your invitation|Break the seal/ })
        .click();
      await expect(page.locator(".guest-hero-photo img")).toHaveAttribute(
        "data-personal-photo",
        "true",
      );
      await page
        .locator(".guest-hero-photo img")
        .evaluate(async (img: HTMLImageElement) => {
          await img.decode();
        });
      await expect(page.locator(".programme-detail-print img")).toHaveAttribute(
        "data-personal-photo",
        "true",
      );
      if (index === 0 && opening === "envelope")
        await page.screenshot({ path: "artifacts/design-preview-320.png" });
    }
  }
  await guest.dispose();
});
