"use client";
import MarketingNavigation from "./marketing-navigation";
import BrandExplainer from "./composition/explainer";
import { Brand, Arrow, DemoButton } from "./ui";

const MOMENTS: [string, string, string][] = [
  ["01", "The scatter", "One wedding, and the guest list living in six places at once — a spreadsheet, a group chat, an inbox, a kitchen note."],
  ["02", "The envelope", "A sealed invitation addressed to one household. The wax breaks, the flap lifts, the letter rises."],
  ["03", "The invitation", "Names in the display serif, a venue plate sliding in, the save-the-date keepsake settling beside it."],
  ["04", "The reply", "The household answers as one — the tick draws, and meals, names and travel arrive as chips."],
  ["05", "The pass", "A private wedding pass with the household code and the order of the day, table and shuttle included."],
  ["06", "The Studio", "A ledger, row by row: what the planner sets on the left, what the guest meets on the right."],
  ["07", "Six worlds", "The same guest experience in six designs, each with its own paper, palette and voice."],
  ["08", "The close", "One guest list. One invitation, in six worlds."],
];

export default function Experience() {
  return (
    <div className="xp">
      <MarketingNavigation homeLinks />

      <main id="main" className="xp-main">
        <section className="xp-hero">
          <p className="eyebrow">VOW MOTION · THE FILM</p>
          <h1>Your story, in motion.</h1>
          <p className="xp-lede">
            Forty seconds, one continuous take — the invitation opening, the
            reply landing, the pass in hand, and the same wedding drawn six
            different ways.
          </p>
          <div className="xp-stage">
            <BrandExplainer />
          </div>
          <p className="xp-note">
            Loops on its own. Pauses when it scrolls out of view, and holds
            still if you have reduced motion turned on.
          </p>
        </section>

        <section className="xp-moments section-pad">
          <div className="section-heading">
            <div>
              <p className="eyebrow">EIGHT MOMENTS</p>
              <h2>
                One continuous composition, <em>not eight clips</em>.
              </h2>
            </div>
            <p>
              Nothing cuts. Each element carries into the next beat and settles —
              the way the product itself carries one guest list from the
              invitation all the way to the door.
            </p>
          </div>
          <ol className="xp-moment-list">
            {MOMENTS.map(([n, title, copy]) => (
              <li key={n}>
                <span className="xp-moment-n">{n}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="xp-cta">
          <span>See it for real</span>
          <h2>Open a wedding, not a slideshow.</h2>
          <p>
            The film is built from the real thing — the same invitation, reply
            and pass a guest meets, in the same six worlds.
          </p>
          <div className="xp-cta-actions">
            <DemoButton>Open a live demo</DemoButton>
            <a href="/planners" className="text-link">
              For wedding planners <Arrow diagonal size={15} />
            </a>
          </div>
        </section>
      </main>

      <footer className="marketing-footer">
        <Brand />
        <span>Made for the moments that bring us together.</span>
        <a href="/privacy">Privacy</a>
        <a href="/contact">Contact</a>
        <span>© {new Date().getFullYear()} Vow Motion</span>
      </footer>
    </div>
  );
}
