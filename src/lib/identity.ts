import { z } from "zod";
import type { CSSProperties } from "react";

export const identitySchema = z.object({
  monogram: z.string().trim().max(8).default(""),
  typography: z
    .enum(["world", "editorial", "classic", "modern"])
    .default("world"),
  accent: z.enum(["world", "olive", "blue", "wine"]).default("world"),
  imagePosition: z.number().int().min(0).max(100).default(50),
  plannerName: z.string().trim().max(100).default(""),
  showPlanner: z.boolean().default(false),
});
export type Identity = z.infer<typeof identitySchema>;
export function weddingIdentity(settings: Record<string, unknown>): Identity {
  const parsed = identitySchema.safeParse(settings.identity ?? {});
  return parsed.success ? parsed.data : identitySchema.parse({});
}
export function identityStyle(
  settings: Record<string, unknown>,
  dark = false,
): CSSProperties {
  const identity = weddingIdentity(settings);
  const fonts = {
    editorial: '"Bodoni Moda", serif',
    classic: '"Libre Baskerville", serif',
    modern: '"Manrope", sans-serif',
  };
  const colors = dark
    ? { olive: "#c4d0ad", blue: "#b4c9e5", wine: "#e4b9c4" }
    : { olive: "#405039", blue: "#29466b", wine: "#703c4c" };
  return {
    "--identity-position": `${identity.imagePosition}%`,
    ...(identity.typography !== "world"
      ? { "--guest-display": fonts[identity.typography] }
      : {}),
    ...(identity.accent !== "world"
      ? { "--guest-accent": colors[identity.accent] }
      : {}),
  } as CSSProperties;
}
