import { test, expect } from "@playwright/test";

test("private invitation updates publish once and respect their scheduled time", async ({
  page,
}) => {
  await page.request.post("/api/demo");
  const [wedding] = await (await page.request.get("/api/weddings")).json();
  const studio = await (
    await page.request.get(`/api/studio?wedding=${wedding.id}`)
  ).json();
  const invitation = await (
    await page.request.post(`/api/studio/invitations?wedding=${wedding.id}`, {
      data: { household_id: studio.households[0].id },
    })
  ).json();
  const token = invitation.url.split("/").at(-1);
  for (const future of [false, true]) {
    const message = await (
      await page.request.post(`/api/studio/messages?wedding=${wedding.id}`, {
        data: {
          subject: future ? "Tomorrow’s note" : "A note from your hosts",
          body: "The ceremony entrance is through the garden.",
          audience: "everyone",
          channel: "invitation",
          scheduled_at: future
            ? new Date(Date.now() + 86400000).toISOString()
            : "",
        },
      })
    ).json();
    const url = `/api/studio/send/${message.id}?wedding=${wedding.id}`;
    expect((await page.request.post(url)).status()).toBe(200);
    expect((await page.request.post(url)).status()).toBe(409);
    const guest = await (
      await page.request.get(`/api/guest?token=${token}`)
    ).json();
    expect(guest.updates.some((u: { id: string }) => u.id === message.id)).toBe(
      !future,
    );
  }
  await page.goto(invitation.url);
  await page.getByRole("button", { name: "Open your invitation" }).click();
  await expect(
    page.getByRole("heading", { name: "A note from your hosts" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Tomorrow’s note" }),
  ).toHaveCount(0);
});
