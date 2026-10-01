import type { MetadataRoute } from "next";
import { contentPages } from "@/lib/guides";
import { siteUrl } from "@/lib/seo";
export default function sitemap(): MetadataRoute.Sitemap {
  const core = [
    "/",
    "/planners",
    "/experience",
    "/guides",
    "/start",
    "/contact",
    "/privacy",
  ].map((p) => ({ url: siteUrl + (p === "/" ? "" : p) }));
  const content = contentPages.map((entry) => ({
    url: siteUrl + entry.path,
    lastModified: entry.updated,
  }));
  return [...core, ...content];
}
