import { test, expect } from "./fixtures";
import { messagingAudience } from "../../src/lib/messaging-audience";
import type { StudioData } from "../../src/lib/types";

// Sending was the part a couple could not see into: a note that failed left no
// trace, a scheduled one offered a button that always refused, and nothing
// could be discarded or tried again. These are the guarantees that fixes rest
// on — send once, say what happened, and always leave a way forward.
test("a message sends once, says so, and can be discarded or retried", async ({
  page,
}) => {
  await page.request.post("/api/demo");
  const [wedding] = await (await page.request.get("/api/weddings")).json();
  const studio: StudioData = await (
    await page.request.get(`/api/studio?wedding=${wedding.id}`)
  ).json();
  const expected = messagingAudience(studio.guests, "everyone", "email")
    .recipients.length;
  expect(expected).toBeGreaterThan(0);

  const draft = async (data: Record<string, unknown>) =>
    (
      await (
        await page.request.post(`/api/studio/messages?wedding=${wedding.id}`, {
          data: {
            subject: "A note",
            body: "The garden entrance is open from six.",
            audience: "everyone",
            channel: "email",
            scheduled_at: "",
            ...data,
          },
        })
      ).json()
    ).id as string;

  // One send reaches everyone it said it would, and records one delivery each.
  const once = await draft({ subject: "Sent exactly once" });
  const send = `/api/studio/send/${once}?wedding=${wedding.id}`;
  const result = await (await page.request.post(send, { data: {} })).json();
  expect(result.count).toBe(expected);
  expect(result.development).toBe(true);
  expect(result.failed).toBe(0);

  // A second press cannot send it again, and leaves the deliveries untouched.
  const repeat = await page.request.post(send, { data: {} });
  expect(repeat.status()).toBe(409);
  const after: StudioData = await (
    await page.request.get(`/api/studio?wedding=${wedding.id}`)
  ).json();
  expect(after.deliveries.filter((d) => d.message_id === once)).toHaveLength(
    expected,
  );
  expect(after.messages.find((m) => m.id === once)?.status).toBe("development");

  // The newest note is at the top, so saving one does not reshuffle the rest.
  expect(after.messages[0].id).toBe(once);

  // A scheduled email is not sendable by accident, but is on purpose.
  const later = await draft({
    subject: "Waiting its turn",
    scheduled_at: new Date(Date.now() + 86400000).toISOString(),
  });
  const scheduledSend = `/api/studio/send/${later}?wedding=${wedding.id}`;
  const refused = await page.request.post(scheduledSend, { data: {} });
  expect(refused.status()).toBe(400);
  expect((await refused.json()).error).toContain("scheduled for later");
  const early = await page.request.post(scheduledSend, {
    data: { now: true },
  });
  expect(early.status()).toBe(200);
  expect((await early.json()).count).toBe(expected);

  // A draft nobody has received can be thrown away; a sent one cannot.
  const spare = await draft({ subject: "Second thoughts" });
  const discard = `/api/studio/messages/${spare}?wedding=${wedding.id}`;
  expect((await page.request.delete(discard)).status()).toBe(200);
  expect((await page.request.delete(discard)).status()).toBe(409);
  expect(
    (
      await page.request.delete(
        `/api/studio/messages/${once}?wedding=${wedding.id}`,
      )
    ).status(),
  ).toBe(409);

  // And the Studio says all of that out loud rather than in a status column.
  await page.goto(`/studio/messages?wid=${wedding.id}`);
  const card = page
    .locator(".message-card")
    .filter({ hasText: "Sent exactly once" });
  await expect(card.locator(".status")).toHaveText("Development outbox");
  await expect(card).toContainText(`${expected} delivered`);
  await expect(
    card.getByRole("button", { name: "Discard this draft" }),
  ).toHaveCount(0);
});
