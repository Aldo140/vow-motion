import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vow Motion",
    short_name: "Vow Motion",
    description: "Your wedding, beautifully shared.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f7f3",
    theme_color: "#454a36",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
