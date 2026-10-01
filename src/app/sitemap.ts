import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/planners", "/experience", "/start", "/contact", "/privacy"].map(
    (p) => ({ url: siteUrl + (p === "/" ? "" : p) }),
  );
}
