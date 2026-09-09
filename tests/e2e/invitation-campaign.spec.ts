import { test, expect } from "./fixtures";

test("a planner sends personalized invitations as one household campaign", async ({
  page,
}) => {
  await page.request.post("/api/demo");
  const [wedding] = await (await page.request.get("/api/weddings")).json();
  await page.goto(`/studio/invitations?wid=${wedding.id}`);

  await expect(page.getByRole("region", { name: "Invitation readiness" })).toContainText("Ready to send");
  await page.getByRole("button", { name: "Send invitations" }).click();
  const dialog = page.getByRole("dialog", { name: "Send the invitations" });
  await expect(dialog).toContainText("Successful previous sends are excluded automatically");

  await dialog.getByRole("button", { name: "Clear all" }).click();
  const recipients = dialog.locator(".campaign-households label");
  await recipients.nth(0).getByRole("checkbox").check();
  await recipients.nth(1).getByRole("checkbox").check();
  await dialog.getByRole("button", { name: "Continue with 2" }).click();
  await expect(dialog.getByText("PREVIEW FOR THE FIRST HOUSEHOLD")).toBeVisible();
  await dialog.getByRole("button", { name: "Review the send" }).click();
  await expect(dialog).toContainText("2private household invitations");
  await expect(dialog.getByRole("button", { name: "Send 2 invitations" })).toBeEnabled();
  await page.screenshot({
    path: "artifacts/invitation-campaign-desktop.png",
    fullPage: true,
  });

  await dialog.getByRole("button", { name: "Send me a test" }).click();
  await expect(page.locator(".toast")).toContainText(/test recorded/i);
  await dialog.getByRole("button", { name: "Send 2 invitations" }).click();
  await expect(dialog).toHaveCount(0);

  const saved = await (await page.request.get(`/api/studio?wedding=${wedding.id}`)).json();
  const householdSends = saved.invitationDispatches.filter(
    (dispatch: { email: string; status: string }) =>
      !dispatch.email.endsWith("@example.invalid") &&
      dispatch.status === "development",
  );
  expect(householdSends).toHaveLength(2);
  await expect(page.getByRole("region", { name: "Invitation readiness" })).toContainText("2Already sent");

  // The server enforces the same exclusion as the screen. A stale second tab
  // cannot rebroadcast to households that already received this campaign.
  const repeat = await page.request.post(
    `/api/studio/invitation-campaign?wedding=${wedding.id}`,
    {
      data: {
        mode: "send",
        household_ids: householdSends.map(
          (dispatch: { household_id: string }) => dispatch.household_id,
        ),
        subject: "Your invitation from {{couple}}",
        body: "Dear {{household}}, open {{invitation_link}}. With love, {{couple}}",
      },
    },
  );
  expect(repeat.status()).toBe(400);
  const afterRepeat = await (
    await page.request.get(`/api/studio?wedding=${wedding.id}`)
  ).json();
  expect(
    afterRepeat.invitationDispatches.filter(
      (dispatch: { status: string }) => dispatch.status === "development",
    ),
  ).toHaveLength(2);
});

test("the invitation campaign remains clear on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.request.post("/api/demo");
  const [wedding] = await (await page.request.get("/api/weddings")).json();
  await page.goto(`/studio/invitations?wid=${wedding.id}`);
  await page.getByRole("button", { name: "Send invitations" }).click();
  const dialog = page.getByRole("dialog", { name: "Send the invitations" });
  await expect(dialog.getByText(/household invitations ready/)).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/invitation-campaign-mobile.png",
    fullPage: true,
  });
});
