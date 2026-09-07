import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/studio", "/api", "/i/", "/w/", "/demo/"],
    },
    sitemap: (process.env.APP_URL || "http://localhost:3000") + "/sitemap.xml",
  };
}
