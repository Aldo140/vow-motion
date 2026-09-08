import { test, expect } from "@playwright/test";

const WORLDS = [
  "riviera",
  "maison",
  "notte",
  "heritage",
  "modernist",
  "garden",
];

test("each world greets a guest in its own words, not just its own colours", async ({
  page,
}) => {
  const seen: Record<string, string[]> = {
    arrival: [],
    kicker: [],
    invite: [],
  };
  const ornaments = new Set<string>();
  const separators = new Set<string>();

  for (const world of WORLDS) {
    await page.goto(`/demo/${world}`);
    const arrival = await page.locator(".opening-dedication").innerText();
    const open = page.getByRole("button", { name: "Open your invitation" });
    if (await open.count()) await open.click();
    await expect(page.locator(".guest-hero-kicker")).toBeVisible();

    const invitation = await page.evaluate(() => ({
      kicker: document.querySelector(".guest-hero-kicker")?.textContent ?? "",
      invite:
        document.querySelector(".atelier-invitation-line")?.textContent ?? "",
      separator: document.querySelector(".guest-hero h1 i")?.textContent ?? "",
      ornament: document.querySelector(".atelier-sprig")
        ? "sprig"
        : document.querySelector(".atelier-silk")
          ? "silk"
          : "none",
    }));

    expect(arrival.trim(), `${world} greets the guest`).not.toBe("");
    expect(invitation.kicker.trim(), `${world} names its families`).not.toBe(
      "",
    );
    seen.arrival.push(arrival.trim());
    seen.kicker.push(invitation.kicker.trim());
    seen.invite.push(invitation.invite.trim());
    ornaments.add(invitation.ornament);
    separators.add(invitation.separator);
  }

  // The point of six worlds is that they are six, so no two may share a line.
  for (const [line, values] of Object.entries(seen))
    expect(new Set(values).size, `${line} repeats between worlds`).toBe(
      WORLDS.length,
    );

  // And they differ in more than words: ornament and the mark joining names.
  expect(ornaments.size).toBeGreaterThan(2);
  expect(separators.size).toBeGreaterThan(1);
});

test("a world's voice carries into Spanish and into the sealed opening", async ({
  page,
}) => {
  await page.request.post("/api/demo");
  const weddings = await (await page.request.get("/api/weddings")).json();
  const notte = weddings.find(
    (w: { world: string }) => w.world === "notte",
  ) as { id: string } | undefined;
  const wid = (notte ?? weddings[0]).id;
  const studio = await (
    await page.request.get(`/api/studio?wedding=${wid}`)
  ).json();
  await page.request.patch(`/api/studio/settings?wedding=${wid}`, {
    data: { ...studio.wedding, world: "notte", opening: "seal" },
  });
  const invite = await (
    await page.request.post(`/api/studio/invitations?wedding=${wid}`, {
      data: { household_id: studio.households[0].id },
    })
  ).json();

  await page.goto(invite.url);
  // The sealed opening speaks with the same world's voice as the suite does.
  await expect(page.locator(".opening-dedication")).toHaveText(
    "The car is waiting.",
  );
  await page.locator(".gate-top button").click();
  await expect(page.locator(".opening-dedication")).toHaveText(
    "El coche está esperando.",
  );
});
