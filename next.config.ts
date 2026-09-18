import type { NextConfig } from "next";
const config: NextConfig = {
  devIndicators: false,
  poweredByHeader: false,
  outputFileTracingIncludes: { "/*": ["./migrations/**/*.sql"] },
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  experimental: { serverActions: { bodySizeLimit: "10mb" } },
  // Content-Security-Policy is set in src/middleware.ts instead: it needs a
  // fresh nonce per request, which this static config cannot generate.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        source: "/design-preview",
        headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }],
      },
    ];
  },
};
export default config;
