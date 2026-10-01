import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private surfaces: couples' studios, guest invitations and wedding pages,
      // the day-of finder (guest names), printable documents and operator tools.
      disallow: [
        "/studio",
        "/api",
        "/i/",
        "/w/",
        "/f/",
        "/demo/",
        "/documents/",
        "/design-preview",
        "/admin",
        "/verify",
        "/recover",
      ],
    },
    sitemap: siteUrl + "/sitemap.xml",
  };
}
