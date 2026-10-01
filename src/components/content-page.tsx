import type { ReactNode } from "react";
import MarketingNavigation from "./marketing-navigation";
import MarketingFooter from "./marketing-footer";
import { Arrow } from "./ui";
import { relatedTo, type ContentEntry } from "@/lib/guides";
import { articleLd, breadcrumbLd, jsonLd, type Crumb } from "@/lib/seo";

// A route handler that opens a demo household invitation, not a page, so it is
// linked plainly rather than through the client router.
const sampleInvitation = "/demo/riviera";

/**
 * The shared frame for guides and feature pages: breadcrumbs, a hero, a single
 * reading column, a closing invitation to try the product, and further reading.
 * Server-rendered and free of animation so the words load first.
 */
export default function ContentPage({
  entry,
  crumbs,
  kicker,
  title,
  lede,
  imageAlt,
  caption,
  actions = true,
  article = false,
  children,
}: {
  entry: ContentEntry;
  crumbs: Crumb[];
  kicker: string;
  title: ReactNode;
  lede: string;
  imageAlt: string;
  caption?: string;
  actions?: boolean;
  article?: boolean;
  children: ReactNode;
}) {
  const structured: object[] = [breadcrumbLd(crumbs)];
  if (article)
    structured.push(
      articleLd({
        title: entry.title,
        description: entry.summary,
        path: entry.path,
        image: entry.image,
        updated: entry.updated,
      }),
    );
  const updated = new Date(entry.updated + "T12:00:00Z").toLocaleDateString(
    "en-CA",
    { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" },
  );
  return (
    <div className="content-page">
      {structured.map((data, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(data) }}
        />
      ))}
      <MarketingNavigation homeLinks />
      <nav className="content-crumbs" aria-label="Breadcrumb">
        <ol>
          {crumbs.map((crumb, index) => (
            <li key={crumb.path}>
              {index === crumbs.length - 1 ? (
                <span aria-current="page">{crumb.name}</span>
              ) : (
                <a href={crumb.path}>{crumb.name}</a>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <main id="main">
        <header className="content-hero">
          <div>
            <p className="content-kicker">{kicker}</p>
            <h1>{title}</h1>
            <p className="content-lede">{lede}</p>
            {actions && (
              <div className="content-hero-actions">
                <a href={sampleInvitation} className="button primary">
                  Open a sample invitation <Arrow diagonal />
                </a>
                <a href="/start" className="text-link">
                  Create your wedding
                </a>
              </div>
            )}
            {article && <p className="content-meta">Updated {updated}</p>}
          </div>
          <figure>
            <img src={entry.image} alt={imageAlt} fetchPriority="high" />
            {caption && <figcaption>{caption}</figcaption>}
          </figure>
        </header>
        <article className="content-body">{children}</article>
        <section className="content-cta">
          <h2>
            See what your guests
            <br />
            <em>would open.</em>
          </h2>
          <p>
            Open a sample invitation as a guest, then reply for the household.
            No sign-up, and no real guests are contacted.
          </p>
          <div className="content-hero-actions">
            <a href={sampleInvitation} className="button light-button">
              Open a sample invitation <Arrow diagonal />
            </a>
            <a href="/start" className="text-link">
              Create your wedding
            </a>
          </div>
        </section>
        <RelatedReading path={entry.path} />
      </main>
      <MarketingFooter />
    </div>
  );
}

export function ContentCards({ entries }: { entries: ContentEntry[] }) {
  return (
    <ul className="content-cards">
      {entries.map((entry) => (
        <li key={entry.path}>
          <a href={entry.path}>
            <img src={entry.image} alt="" loading="lazy" />
            <span>{entry.kind}</span>
            <strong>{entry.title}</strong>
            <p>{entry.summary}</p>
          </a>
        </li>
      ))}
    </ul>
  );
}

function RelatedReading({ path }: { path: string }) {
  return (
    <section className="content-related" aria-labelledby="related-heading">
      <h2 id="related-heading">Keep reading</h2>
      <ContentCards entries={relatedTo(path)} />
    </section>
  );
}
