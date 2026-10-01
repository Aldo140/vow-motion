import type { Metadata } from "next";
import Marketing from "@/components/marketing";
import { pageMetadata, siteJsonLd } from "@/lib/seo";
export const metadata: Metadata = pageMetadata({
  title: { absolute: "Digital wedding invitations & RSVP website · Vow Motion" },
  description:
    "Beautiful digital wedding invitations with household RSVPs, event schedules, travel details and a private wedding website, all in one place. Try the demo free.",
  path: "/",
  shareTitle: "Vow Motion — Your entire wedding. Beautifully shared.",
  shareDescription:
    "An invitation worth opening. Household RSVPs, events and every guest detail in one place.",
});
export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: siteJsonLd() }}
      />
      <Marketing />
    </>
  );
}
