import { test, expect } from "@playwright/test";

test("guests read the answers, one at a time, in their own language", async ({
  page,
}) => {
  await page.goto("/demo/riviera");
  const open = page.getByRole("button", { name: "Open your invitation" });
  if (await open.count()) await open.click();

  // Reachable from the invitation's contents rather than only by scrolling.
  await page
    .getByRole("button", { name: "Invitation contents", exact: true })
    .click();
  await page
    .locator(".invitation-contents")
    .getByRole("link", { name: "Questions" })
    .click();
  await expect(page.locator("#faqs")).toBeFocused();

  const answers = page.locator(".faq-list details");
  expect(await answers.count()).toBeGreaterThan(3);
  await expect(page.locator(".faq-list details[open]")).toHaveCount(0);

  // Opening a second answer closes the first, so the index stays readable.
  await answers.nth(0).locator("summary").click();
  await expect(page.locator(".faq-list details[open]")).toHaveCount(1);
  await answers.nth(2).locator("summary").click();
  await expect(page.locator(".faq-list details[open]")).toHaveCount(1);
  await expect(answers.nth(2)).toHaveAttribute("open", "");

  // Spanish answers replace English ones rather than sitting beside them.
  const english = await answers.nth(2).locator("p").innerText();
  await page.locator(".language-switch").click();
  await expect
    .poll(async () => page.locator(".faq-list details p").first().innerText())
    .not.toBe(english);
});

test("a couple adds, edits and removes a question from the Studio", async ({
  page,
}) => {
  await page.request.post("/api/demo");
  const weddings = await (await page.request.get("/api/weddings")).json();
  const wid = weddings[0].id;
  await page.goto(`/studio/experience?wid=${wid}`);
  const list = page.locator(".faq-studio-list > li");
  // The panel loads its wedding before it can list anything.
  await expect(list.first()).toBeVisible();
  const before = await list.count();

  // A starter fills the draft, so nobody faces an empty box.
  await page.getByRole("button", { name: /Is there parking\?/ }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Question", { exact: true })).toHaveValue(
    "Is there parking?",
  );
  await dialog
    .getByLabel("Answer", { exact: true })
    .fill("Yes, behind the chapel, and cars may stay overnight.");
  await dialog.getByRole("button", { name: "Add question" }).click();
  await expect(list).toHaveCount(before + 1);

  const added = list.filter({ hasText: "Is there parking?" });
  await expect(added).toHaveCount(1);
  await added.getByRole("button", { name: /^Edit:/ }).click();
  await page
    .getByRole("dialog")
    .getByLabel("Answer", { exact: true })
    .fill("Yes, behind the chapel. Cars are safe overnight.");
  await page.getByRole("button", { name: "Save answer" }).click();
  await expect(
    list.filter({ hasText: "Cars are safe overnight." }),
  ).toHaveCount(1);

  await list
    .filter({ hasText: "Is there parking?" })
    .getByRole("button", { name: /^Remove:/ })
    .click();
  await expect(list).toHaveCount(before);
});
