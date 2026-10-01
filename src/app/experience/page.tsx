import type { Metadata } from "next";
import Experience from "@/components/experience";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "See it in motion: a 40-second film",
  description:
    "A forty-second look at Vow Motion in motion — the private invitation opening, the household reply, the wedding pass, and the same wedding drawn in six worlds.",
  path: "/experience",
  card: "experience",
  shareTitle: "Vow Motion — the film",
  shareDescription: "Your story, in motion.",
});

export default function Page() {
  return <Experience />;
}
