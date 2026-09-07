import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/planners", "/privacy"].map((p) => ({
    url: (process.env.APP_URL || "http://localhost:3000") + p,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: p === "" ? 1 : p === "/planners" ? 0.8 : 0.3,
  }));
}
