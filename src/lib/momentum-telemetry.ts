import { z } from "zod";
import { ACTION_IDS, CHAPTER_IDS } from "./momentum";

export const SCREEN_IDS = [
  "overview",
  "setup",
  "guests",
  "events",
  "experience",
  "invitations",
  "rsvps",
  "messages",
  "seating",
  "travel",
  "photos",
  "analytics",
  "collaborators",
  "settings",
  "requests",
  "feedback",
  "onboarding",
] as const;
export const telemetrySchema = z
  .object({
    event: z.enum([
      "studio_opened",
      "screen_viewed",
      "recommended_action_shown",
      "recommended_action_selected",
      "recommended_action_completed",
      "onboarding_step_completed",
      "chapter_completed",
      "first_productive_action",
      "first_household",
      "first_invitation",
      "invitation_sending_started",
      "invitation_sending_completed",
      "rsvp_blocker_resolved",
      "workflow_abandoned",
    ]),
    screen: z.enum(SCREEN_IDS).optional(),
    action: z.enum(ACTION_IDS).optional(),
    chapter: z.enum(CHAPTER_IDS).optional(),
    count: z.number().int().min(0).max(100000).optional(),
    elapsed_ms: z.number().int().min(0).max(43200000).optional(),
    navigation_count: z.number().int().min(0).max(10000).optional(),
    step: z.enum(["account", "couple", "day", "world"]).optional(),
  })
  .strict();
export type MomentumEvent = z.infer<typeof telemetrySchema>;
