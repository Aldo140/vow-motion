import type { Metadata } from "next";
import Planners from "@/components/planners";
export const metadata: Metadata = {
  title: "For wedding planners",
  description:
    "Keep the planning system you already run on. Vow Motion is the guest-facing layer around it: import the guest list, run the invitation and replies, and export the kitchen sheet, shuttle manifest and place cards your suppliers need.",
};
export default function Page() {
  return <Planners />;
}
