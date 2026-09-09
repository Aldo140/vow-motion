import type { Message } from "./types";

/** A send stalls silently; after this long the Studio offers a way back. */
export const STALLED_AFTER = 10 * 60 * 1000;

export type DespatchTone = "waiting" | "done" | "trouble";

/**
 * How a message reads on the shelf. A failed send used to render its raw status
 * in the colour reserved for a guest who is attending, so a message nobody
 * received looked exactly like one everybody did. Every state now names itself
 * and carries the tone it has earned.
 */
export function despatchState(
  message: Pick<
    Message,
    "status" | "scheduled_at" | "created_at" | "updated_at"
  >,
  now = Date.now(),
): { label: string; tone: DespatchTone } {
  const scheduled = Boolean(
    message.scheduled_at && new Date(message.scheduled_at).getTime() > now,
  );
  switch (message.status) {
    case "draft":
      return {
        label: scheduled ? "Draft · scheduled" : "Draft",
        tone: "waiting",
      };
    case "processing":
      return now -
        new Date(message.updated_at || message.created_at).getTime() >
        STALLED_AFTER
        ? { label: "Stopped part-way", tone: "trouble" }
        : { label: "Sending now", tone: "waiting" };
    case "published":
      return scheduled
        ? { label: "Scheduled", tone: "waiting" }
        : { label: "Published", tone: "done" };
    case "development":
      return { label: "Development outbox", tone: "done" };
    case "sent":
      return { label: "Sent", tone: "done" };
    case "partially-failed":
      return { label: "Some did not send", tone: "trouble" };
    case "failed":
      return { label: "Nothing sent", tone: "trouble" };
    default:
      return { label: message.status, tone: "waiting" };
  }
}

/** A message in one of these states can be sent again without sending twice. */
export function canRetry(
  message: Pick<
    Message,
    "status" | "scheduled_at" | "created_at" | "updated_at"
  >,
  now = Date.now(),
) {
  return (
    ["failed", "partially-failed"].includes(message.status) ||
    despatchState(message, now).label === "Stopped part-way"
  );
}
