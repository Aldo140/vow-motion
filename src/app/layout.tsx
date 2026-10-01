import type { Metadata, Viewport } from "next";
import { siteUrl } from "@/lib/seo";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/bodoni-moda/400.css";
import "@fontsource/bodoni-moda/400-italic.css";
import "@fontsource/italiana/400.css";
import "@fontsource/libre-baskerville/400.css";
import "./globals.css";
import "./celebration.css";
import "./landing-hero.css";
import "./invitation.css";
import "./guest-keepsakes.css";
import "./guest-atelier.css";
import "./planners.css";
import "./guest-ceremony.css";
import "./guest-reply-album.css";
import "./guest-continuity.css";
import "./guest-seal-gate.css";
import "./guest-faqs.css";
import "./documents.css";
import "./pilot.css";
import "./marketing-offer.css";
import "./product-showcase.css";
import "./product-story.css";
import "./marketing-depth.css";
import "./guest-finishing.css";
import "./design-editor.css";
import "./photo-guide.css";
import "./planner-atelier.css";
import "./studio-story.css";
import "./studio-post-room.css";
import "./guest-preview-stage.css";
import "./admin.css";
import "./day-finder.css";
import "./experience.css";
import "./studio-momentum.css";
import "./guest-botanical.css";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Vow Motion — Your entire wedding. Beautifully shared.",
    template: "%s · Vow Motion",
  },
  description:
    "An invitation worth opening. A wedding worth experiencing. Beautiful digital invitations, personal RSVPs, and every guest detail in one place.",
  openGraph: {
    type: "website",
    siteName: "Vow Motion",
    title: "Vow Motion",
    description: "Your entire wedding. Beautifully shared.",
    images: [{ url: "/og/home.jpg", width: 1200, height: 630 }],
  },
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = { themeColor: "#454a36" };
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
