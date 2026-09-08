import { test, expect } from "./fixtures";

const rows = (csv: string) =>
  csv
    .trim()
    .split("\r\n")
    .map(
      (line) =>
        line.match(/("(?:[^"]|"")*"|[^,]*)/g)?.filter((_, i) => i % 2 === 0) ??
        [],
    )
    .map((cells) =>
      cells.map((c) => c.replace(/^"|"$/g, "").replace(/""/g, '"')),
    );

test("the day-of documents reconcile with the guest list they came from", async ({
  page,
}) => {
  await page.request.post("/api/demo");
  const weddings = await (await page.request.get("/api/weddings")).json();
  const wedding = weddings.find((w: { names: string }) =>
    w.names.includes("Moretti"),
  );
  const wid = wedding.id;
  const studio = await (
    await page.request.get(`/api/studio?wedding=${wid}`)
  ).json();
  const attending = studio.guests.filter(
    (g: { status: string }) => g.status === "attending",
  );

  const sheet = async (name: string) =>
    rows(
      await (
        await page.request.get(
          `/api/studio/export?wedding=${wid}&sheet=${name}`,
        )
      ).text(),
    );

  // The caterer's covers must equal the people who said yes.
  const kitchen = await sheet("kitchen");
  const total = kitchen.find((r) => r[0] === "Total covers");
  expect(Number(total?.[1])).toBe(attending.length);
  const mealHeading = kitchen.findIndex((r) => r[0] === "Meal");
  const counted = kitchen
    .slice(mealHeading + 1)
    .filter((r) => r[0] !== "Total covers" && r[1] !== "" && r.length === 2)
    .slice(
      0,
      kitchen.findIndex((r) => r[0] === "Total covers") - mealHeading - 1,
    )
    .reduce((sum, r) => sum + Number(r[1]), 0);
  expect(counted).toBe(attending.length);
  // Every dietary requirement travels with the table it must reach.
  const dietaryHeading = kitchen.findIndex((r) => r[0] === "Guest");
  const dietary = kitchen
    .slice(dietaryHeading + 1)
    .filter((r) => r.length === 4 && r[3]);
  expect(dietary.length).toBe(
    attending.filter((g: { dietary: string }) => g.dietary).length,
  );
  for (const line of dietary) expect(line[1]).not.toBe("");

  // The transport company gets a seat count, taken from real replies.
  const shuttle = await sheet("shuttle");
  const seats = shuttle.find((r) => r[0] === "Seats required");
  const riders = shuttle.filter((r) => r[2] && r[2].startsWith("Yes"));
  expect(Number(seats?.[1])).toBe(riders.length);
  expect(riders.length).toBeGreaterThan(0);

  // Place cards name everyone attending, and say where each one sits.
  const cards = await sheet("placecards");
  const named = cards.filter((r) => r.length === 4 && r[0] !== "Guest");
  expect(named.length).toBe(attending.length);
  for (const card of named) expect(card[1]).not.toBe("");

  // The original guest report is untouched by the new sheets.
  const guests = rows(
    await (await page.request.get(`/api/studio/export?wedding=${wid}`)).text(),
  );
  expect(guests[0][0]).toBe("Name");
  expect(guests.length - 1).toBe(studio.guests.length);
});

test("a planner can reach each document from the Studio", async ({ page }) => {
  await page.request.post("/api/demo");
  const weddings = await (await page.request.get("/api/weddings")).json();
  await page.goto(`/studio/analytics?wid=${weddings[0].id}`);
  // Three spreadsheets for suppliers, plus the typeset set they come from.
  await expect(page.locator(".day-document")).toHaveCount(4);
  await expect(page.locator(".day-document-set")).toHaveAttribute(
    "href",
    /^\/documents\//,
  );
  // Each spreadsheet is labelled by the supplier who receives it.
  await expect(
    page.locator(".day-document-list .day-document-for").first(),
  ).toHaveText("For the caterer");
  for (const sheet of ["kitchen", "shuttle", "placecards"])
    await expect(
      page.locator(`.day-document[href*="sheet=${sheet}"]`),
    ).toHaveCount(1);
});
