import type { Metadata } from "next";
import MarketingNavigation from "@/components/marketing-navigation";
import MarketingFooter from "@/components/marketing-footer";
import { ContentCards } from "@/components/content-page";
import { features, guides } from "@/lib/guides";
import { breadcrumbLd, jsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Wedding invitation and RSVP guides",
  description:
    "Practical guides to wedding invitations and RSVPs: what to write, when to send, when replies should be due, and how digital and paper compare.",
  path: "/guides",
  card: "guides",
});

export default function Page() {
  return (
    <div className="content-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbLd([
              { name: "Home", path: "/" },
              { name: "Guides", path: "/guides" },
            ]),
          ),
        }}
      />
      <MarketingNavigation homeLinks />
      <main id="main">
        <header className="content-hero content-hero-plain">
          <div>
            <p className="content-kicker">Guides</p>
            <h1>
              Invitations and replies,
              <em>thoughtfully done.</em>
            </h1>
            <p className="content-lede">
              Practical, honest guides to the part of the wedding your guests
              hold: what to write, when to send it, and how to get every reply
              back without chasing.
            </p>
          </div>
        </header>
        <section className="content-related" aria-labelledby="guides-heading">
          <h2 id="guides-heading">Guides</h2>
          <ContentCards entries={guides} />
        </section>
        <section className="content-related" aria-labelledby="features-heading">
          <h2 id="features-heading">How Vow Motion helps</h2>
          <ContentCards entries={features} />
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
