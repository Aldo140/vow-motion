import type { Metadata } from "next";
import { contactEmail } from "./contact";

/** The canonical public origin. www is primary; the bare domain 308s to it. */
export const siteUrl = (
  process.env.APP_URL || "https://www.vowmotionweddings.com"
).replace(/\/+$/, "");

export const siteName = "Vow Motion";

/** Link-preview cards rendered by scripts/render-share-cards.mjs. */
export type ShareCard =
  | "home"
  | "planners"
  | "experience"
  | "contact"
  | "start"
  | "guides"
  | "invitations"
  | "rsvp"
  | "wording"
  | "deadline"
  | "compare";

/**
 * Metadata for an indexable marketing page. Next merges metadata shallowly, so
 * a page that sets `openGraph` replaces the root one wholesale — this builds the
 * complete set (canonical, Open Graph, Twitter) so no page loses its image or
 * falls back to the homepage's share text.
 */
export function pageMetadata({
  title,
  description,
  path,
  shareTitle,
  shareDescription,
  card = "home",
}: {
  title: string | { absolute: string };
  description: string;
  path: string;
  shareTitle?: string;
  shareDescription?: string;
  card?: ShareCard;
}): Metadata {
  const image = {
    url: `/og/${card}.jpg`,
    width: 1200,
    height: 630,
    alt: ogTitleAlt(title),
  };
  const ogTitle =
    shareTitle ??
    (typeof title === "string" ? `${title} · ${siteName}` : title.absolute);
  const ogDescription = shareDescription ?? description;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName,
      locale: "en_CA",
      url: path,
      title: ogTitle,
      description: ogDescription,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [image.url],
    },
  };
}

function ogTitleAlt(title: string | { absolute: string }) {
  return `${siteName}: ${typeof title === "string" ? title : title.absolute}`;
}

/** Organization + WebSite structured data, rendered once on the homepage. */
export function siteJsonLd() {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: siteName,
        url: siteUrl,
        logo: `${siteUrl}/icons/icon-512.png`,
        email: contactEmail,
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: siteName,
        url: siteUrl,
        publisher: { "@id": `${siteUrl}/#organization` },
      },
    ],
  }).replace(/</g, "\\u003c");
}

/** Escape a structured-data object for an inline <script>. */
export function jsonLd(data: object) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export type Crumb = { name: string; path: string };

export function breadcrumbLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: siteUrl + (crumb.path === "/" ? "" : crumb.path),
    })),
  };
}

export function articleLd({
  title,
  description,
  path,
  image,
  updated,
}: {
  title: string;
  description: string;
  path: string;
  image: string;
  updated: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    image: siteUrl + image,
    datePublished: updated,
    dateModified: updated,
    mainEntityOfPage: siteUrl + path,
    author: { "@id": `${siteUrl}/#organization` },
    publisher: { "@id": `${siteUrl}/#organization` },
  };
}
