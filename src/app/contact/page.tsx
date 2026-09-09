import type { Metadata } from "next";
import ContactPage from "@/components/contact-page";
import { emailAvailable } from "@/lib/providers";
import "./contact.css";
export const metadata: Metadata = {
  title: "Let’s talk",
  description:
    "Planning your wedding or looking after someone else’s? Get in touch with the small team behind Vow Motion.",
};
export default function Page() {
  return <ContactPage canSend={emailAvailable()} />;
}
export const dynamic = "force-dynamic";
