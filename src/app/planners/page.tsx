import type { Metadata } from "next";
import Planners from "@/components/planners";
export const metadata: Metadata = {
  title: "For wedding planners",
  description:
    "Run the guest list, invitations, RSVP, travel, seating and updates for every wedding in one place, while each couple's guests receive an invitation made for them.",
};
export default function Page() {
  return <Planners />;
}
