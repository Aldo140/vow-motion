import { test, expect } from "@playwright/test";

test("a couple chooses how the invitation arrives, and both openings lead in", async ({
  page,
}) => {
  await page.request.post("/api/demo");
  const weddings = await (await page.request.get("/api/weddings")).json();
  const wid = weddings[0].id;

  const invite = async () => {
    const studio = await (
      await page.request.get(`/api/studio?wedding=${wid}`)
    ).json();
    const created = await (
      await page.request.post(`/api/studio/invitations?wedding=${wid}`, {
        data: { household_id: studio.households[0].id },
      })
    ).json();
    return { url: created.url, opening: studio.wedding.opening };
  };

  // The crafted suite is what a wedding starts with.
  const first = await invite();
  expect(first.opening).toBe("envelope");
  await page.goto(first.url);
  await expect(page.locator(".invitation-gate.crafted-opening")).toBeVisible();

  // Choosing the sealed envelope in the Studio changes what a guest meets.
  await page.goto(`/studio/experience?wid=${wid}`);
  await page.getByRole("button", { name: /The sealed envelope/ }).click();
  await page.getByRole("button", { name: /Save your experience/ }).click();
  await expect
    .poll(async () => {
      const studio = await (
        await page.request.get(`/api/studio?wedding=${wid}`)
      ).json();
      return studio.wedding.opening;
    })
    .toBe("seal");

  const second = await invite();
  await page.goto(second.url);
  const gate = page.locator(".invitation-gate.sealed-opening");
  await expect(gate).toBeVisible();
  await expect(gate.locator(".seal-wax")).toBeVisible();
  // The envelope is addressed to this household, on the paper itself.
  await expect(gate.locator(".seal-address p")).not.toBeEmpty();

  // Whichever opening a couple picks, the guest lands on the same invitation.
  const seal = page.getByRole("button", { name: "Open your invitation" });
  await seal.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".guest-hero h1")).toBeFocused();
  await expect(page.locator(".guest-hero h1")).toContainText("Elena");
});

test("the sealed opening is reachable without motion and rejects unknown styles", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.request.post("/api/demo");
  const weddings = await (await page.request.get("/api/weddings")).json();
  const wid = weddings[0].id;
  const studio = await (
    await page.request.get(`/api/studio?wedding=${wid}`)
  ).json();

  // An opening the product does not have must not reach the database.
  const rejected = await page.request.patch(
    `/api/studio/settings?wedding=${wid}`,
    { data: { ...studio.wedding, opening: "hologram" } },
  );
  expect(rejected.status()).toBe(400);

  await page.request.patch(`/api/studio/settings?wedding=${wid}`, {
    data: { ...studio.wedding, opening: "seal" },
  });
  const created = await (
    await page.request.post(`/api/studio/invitations?wedding=${wid}`, {
      data: { household_id: studio.households[0].id },
    })
  ).json();
  await page.goto(created.url);
  await expect(page.locator(".sealed-opening")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  // With motion reduced the seal goes straight through to the invitation.
  await page.getByRole("button", { name: "Open your invitation" }).click();
  await expect(page.locator(".guest-hero h1")).toBeVisible();
  await page.screenshot({
    path: "artifacts/sealed-opening-mobile.png",
    fullPage: true,
  });
});
