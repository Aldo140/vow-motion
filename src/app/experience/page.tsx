import type { Metadata } from "next";
import Experience from "@/components/experience";

export const metadata: Metadata = {
  title: "The film",
  description:
    "A forty-second look at Vow Motion in motion — the private invitation opening, the household reply, the wedding pass, and the same wedding drawn in six worlds.",
  openGraph: {
    title: "Vow Motion — the film",
    description: "Your story, in motion.",
    images: ["/images/riviera.webp"],
  },
};

export default function Page() {
  return <Experience />;
}
