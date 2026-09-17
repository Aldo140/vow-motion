"use client";
import { telemetrySchema, type MomentumEvent } from "./momentum-telemetry";

/** Only allowlisted enums and bounded numbers leave the browser. No URL, user,
 * wedding, guest, message, form field, or persistent tracking identifier. */
export function trackMomentum(
  event: MomentumEvent["event"],
  properties: Omit<MomentumEvent, "event"> = {},
) {
  if (typeof window === "undefined" || navigator.doNotTrack === "1") return;
  const result = telemetrySchema.safeParse({ event, ...properties });
  if (!result.success) return;
  void fetch("/api/momentum", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result.data),
    keepalive: true,
  }).catch(() => {});
}
