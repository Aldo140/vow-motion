import { test, expect } from "./fixtures";

test("the day-of book is typeset from the wedding it belongs to", async ({
  page,
}) => {
  await page.request.post("/api/demo");
  const weddings = await (await page.request.get("/api/weddings")).json();
  const wedding = weddings.find((w: { names: string }) =>
    w.names.includes("Moretti"),
  );
  const studio = await (
    await page.request.get(`/api/studio?wedding=${wedding.id}`)
  ).json();
  const attending = studio.guests.filter(
    (g: { status: string }) => g.status === "attending",
  );

  await page.goto(`/documents/${wedding.id}`);
  await expect(page.locator(".sheet")).toHaveCount(6);

  // The cover states the figures the rest of the set is built from.
  const cover = page.locator(".sheet-cover");
  await expect(cover.locator("h1")).toHaveText(wedding.names);
  const figure = (label: string) =>
    cover
      .locator(".cover-figures div")
      .filter({ hasText: label })
      .locator("dd");
  await expect(figure("Invited")).toHaveText(String(studio.guests.length));
  await expect(figure("Attending")).toHaveText(String(attending.length));
  await expect(figure("Tables")).toHaveText(String(studio.tables.length));

  // Each sheet says who it is for, and carries the wedding along its foot.
  const audiences = await page.locator(".sheet-head > span").allInnerTexts();
  // Rendered in small caps, which is how a reader meets them.
  expect(audiences).toContain("FOR THE CATERER");
  expect(audiences).toContain("FOR THE TRANSPORT COMPANY");
  expect(audiences).toContain("FOR THE CALLIGRAPHER");
  // Every sheet but the cover, which names the couple in its title instead.
  for (const foot of await page
    .locator(".sheet:not(.sheet-cover) .sheet-foot")
    .all())
    await expect(foot).toContainText(wedding.names);

  // The kitchen total is the same number the cover promised.
  await expect(
    page.locator(".sheet-table .total").first().locator(".figure"),
  ).toHaveText(String(attending.length));
  // Every dietary line names the table it has to reach.
  for (const row of await page.locator(".sheet-table .requirement").all()) {
    const cells = await row.locator("xpath=../td").allInnerTexts();
    expect(cells[1].trim()).not.toBe("");
  }
  // Place cards name everyone who is coming.
  await expect(page.locator(".sheet-cards li")).toHaveCount(attending.length);

  await page.screenshot({
    path: "artifacts/day-of-book.png",
    fullPage: false,
  });
});

test("printing hides the interface and breaks the set into pages", async ({
  page,
}) => {
  await page.request.post("/api/demo");
  const weddings = await (await page.request.get("/api/weddings")).json();
  await page.goto(`/documents/${weddings[0].id}`);
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".documents-bar")).toBeHidden();
  expect(
    await page
      .locator(".sheet")
      .first()
      .evaluate((el) => getComputedStyle(el).breakAfter),
  ).toBe("page");
  // The running foot rejoins the flow so it cannot land mid-page.
  expect(
    await page
      .locator(".sheet-foot")
      .first()
      .evaluate((el) => getComputedStyle(el).position),
  ).toBe("static");
});

test("the book is not readable by someone outside the wedding", async ({
  page,
  browser,
}) => {
  await page.request.post("/api/demo");
  const weddings = await (await page.request.get("/api/weddings")).json();
  const wid = weddings[0].id;

  // A signed-out visitor holding the link is sent away, not shown the guests.
  const stranger = await browser.newContext();
  const strangerPage = await stranger.newPage();
  await strangerPage.goto(`/documents/${wid}`);
  await expect(strangerPage.locator(".sheet")).toHaveCount(0);
  expect(strangerPage.url()).not.toContain(`/documents/${wid}`);

  // So is somebody with an account of their own.
  const other = await browser.newContext();
  const otherPage = await other.newPage();
  await otherPage.request.post("/api/demo");
  await otherPage.goto(`/documents/${wid}`);
  await expect(otherPage.locator(".sheet")).toHaveCount(0);
  await stranger.close();
  await other.close();
});
