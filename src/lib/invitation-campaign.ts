import { z } from "zod";
import { audit, HttpError, id } from "./auth";
import { db, rows } from "./db";
import { deliver, emailAvailable } from "./providers";
import { issueInvitationToken } from "./seed";

export const invitationCampaignSchema = z
  .object({
    mode: z.enum(["test", "send"]),
    household_ids: z.array(z.string()).max(300).default([]),
    subject: z.string().trim().min(1).max(200),
    body: z.string().trim().min(1).max(5000),
  })
  .refine((campaign) => campaign.body.includes("{{invitation_link}}"), {
    path: ["body"],
    message: "Keep {{invitation_link}} in the message so every household receives its invitation.",
  });

const merge = (
  text: string,
  values: { household: string; couple: string; invitationLink: string },
) =>
  text
    .replaceAll("{{household}}", values.household)
    .replaceAll("{{couple}}", values.couple)
    .replaceAll("{{invitation_link}}", values.invitationLink);

export async function sendInvitationCampaign(input: {
  weddingId: string;
  actorId: string;
  actorEmail: string;
  demo: boolean;
  origin: string;
  value: unknown;
}) {
  const campaign = invitationCampaignSchema.parse(input.value);
  if (!input.demo && !emailAvailable())
    throw new HttpError(503, "Email delivery is not configured for this Studio.");

  const wedding = (
    await rows<{ names: string }>("SELECT names FROM weddings WHERE id=$1", [
      input.weddingId,
    ])
  )[0];
  const households = await rows<{
    id: string;
    name: string;
    email: string;
  }>(
    `SELECT h.id,h.name,COALESCE((
       SELECT NULLIF(trim(g.email),'') FROM guests g
       WHERE g.household_id=h.id AND NULLIF(trim(g.email),'') IS NOT NULL
       ORDER BY g.is_plus_one,g.created_at,g.name LIMIT 1
     ),'') email
     FROM households h WHERE h.wedding_id=$1 ORDER BY h.created_at`,
    [input.weddingId],
  );
  const protectedDispatches = await rows<{ household_id: string; email: string; status: string }>(
    `SELECT DISTINCT ON (household_id) household_id,email,status
     FROM invitation_dispatches
     WHERE wedding_id=$1 AND test=false
       AND status IN ('development','sent','delivered','bounced','complained','suppressed')
     ORDER BY household_id,created_at DESC`,
    [input.weddingId],
  );
  const sentHouseholds = new Set(
    (
      protectedDispatches.filter((row) => ["development", "sent", "delivered", "complained", "suppressed"].includes(row.status))
    ).map((row) => row.household_id),
  );

  const selected =
    campaign.mode === "test"
      ? households.slice(0, 1)
      : households.filter((household) =>
          campaign.household_ids.includes(household.id) &&
          !sentHouseholds.has(household.id) &&
          !protectedDispatches.some((row) =>
            row.household_id === household.id && row.status === "bounced" &&
            row.email.trim().toLowerCase() === household.email.trim().toLowerCase(),
          ),
        );
  if (!selected.length)
    throw new HttpError(400, "Choose at least one household to invite.");
  if (campaign.mode === "send" && selected.some((household) => !household.email))
    throw new HttpError(400, "Every selected household needs an email address.");
  if (
    campaign.mode === "send" &&
    selected.some((household) => !z.email().safeParse(household.email).success)
  )
    throw new HttpError(400, "Correct the invalid household email before sending.");

  let sent = 0;
  const failed: { household_id: string; error: string }[] = [];
  const sendOne = async (household: (typeof selected)[number]) => {
    const preview = campaign.mode === "test";
    const invitation = await issueInvitationToken(
      input.weddingId,
      household.id,
      preview,
    );
    const invitationLink = `${input.origin}/i/${invitation.raw}`;
    const deliveryId = id();
    const recipient = preview ? input.actorEmail : household.email;
    const subject = merge(campaign.subject, {
      household: household.name,
      couple: String(wedding.names),
      invitationLink,
    });
    const body = merge(campaign.body, {
      household: household.name,
      couple: String(wedding.names),
      invitationLink,
    });
    try {
      await (
        await db()
      ).query(
        "INSERT INTO invitation_dispatches(id,wedding_id,household_id,token_id,email,subject,test,status) VALUES($1,$2,$3,$4,$5,$6,$7,'queued')",
        [deliveryId, input.weddingId, household.id, invitation.id, recipient, subject, preview],
      );
    } catch {
      await (
        await db()
      ).query("UPDATE invitation_tokens SET revoked=true WHERE id=$1", [invitation.id]);
      failed.push({ household_id: household.id, error: "This household already has an invitation queued or sent." });
      return;
    }
    try {
      const result = await deliver({
        channel: "email",
        to: recipient,
        subject: preview ? `[Test] ${subject}` : subject,
        body,
        idempotencyKey: deliveryId,
        demo: input.demo,
      });
      await (
        await db()
      ).query(
        "UPDATE invitation_dispatches SET status=$1,provider_id=$2,updated_at=now() WHERE id=$3",
        [result.status, result.provider_id, deliveryId],
      );
      sent++;
    } catch (cause) {
      const message = (cause as Error)?.message || "The invitation could not be sent.";
      await (
        await db()
      ).query(
        "UPDATE invitation_dispatches SET status='failed',error=$1,updated_at=now() WHERE id=$2",
        [message.slice(0, 500), deliveryId],
      );
      failed.push({ household_id: household.id, error: message });
    }
  };
  // A real planner campaign can contain 60–150 households. Eight concurrent
  // provider calls keeps the request well inside the function window without
  // creating an uncontrolled burst at the email provider.
  for (let offset = 0; offset < selected.length; offset += 8) {
    await Promise.all(selected.slice(offset, offset + 8).map(sendOne));
  }
  await audit(
    input.weddingId,
    input.actorId,
    campaign.mode === "test"
      ? "Invitation test sent"
      : `${sent} household invitations sent`,
  );
  return { ok: failed.length === 0, sent, failed, development: input.demo };
}
