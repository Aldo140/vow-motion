import type { Metadata } from "next";
import ContactPage from "@/components/contact-page";
import { emailAvailable } from "@/lib/providers";
import { enableStrictCsp } from "@/lib/csp-nonce";
import { pageMetadata } from "@/lib/seo";
import "./contact.css";
export const metadata: Metadata = pageMetadata({
  title: "Contact us",
  description:
    "Planning your wedding or looking after someone else’s? Get in touch with the small team behind Vow Motion.",
  path: "/contact",
  shareTitle: "Let’s talk · Vow Motion",
});
export default async function Page() {
  await enableStrictCsp();
  return <ContactPage canSend={emailAvailable()} />;
}
export const dynamic = "force-dynamic";
