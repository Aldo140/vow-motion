import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/privacy"].map((p) => ({
    url: (process.env.APP_URL || "http://localhost:3000") + p,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: p ? 0.3 : 1,
  }));
}
