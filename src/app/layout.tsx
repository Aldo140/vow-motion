import type { Metadata } from "next";
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
export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
  title: {
    default: "Vow Motion — Your entire wedding. Beautifully shared.",
    template: "%s · Vow Motion",
  },
  description:
    "An invitation worth opening. A wedding worth experiencing. Beautiful digital invitations, personal RSVPs, and every guest detail in one place.",
  openGraph: {
    title: "Vow Motion",
    description: "Your entire wedding. Beautifully shared.",
    images: ["/images/riviera.webp"],
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.webmanifest",
};
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
