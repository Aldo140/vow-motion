import type { Metadata } from "next";
import Planners from "@/components/planners";
import { pageMetadata } from "@/lib/seo";
export const metadata: Metadata = pageMetadata({
  title: "Guest list & RSVP software for wedding planners",
  description:
    "Import the guest list, run the invitation and household RSVPs, and export the kitchen sheet, shuttle manifest and place cards your suppliers need.",
  path: "/planners",
  card: "planners",
  shareTitle: "For wedding planners · Vow Motion",
  shareDescription:
    "Keep the system you run on. Add the part guests hold: invitations, household replies and day-of exports.",
});
export default function Page() {
  return <Planners />;
}
