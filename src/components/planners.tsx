"use client";
import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import MarketingNavigation from "./marketing-navigation";
import { FirstSteps, OfferQuestions } from "./marketing-offer";
import { Brand, Arrow, DemoButton } from "./ui";
gsap.registerPlugin(useGSAP, ScrollTrigger);

// A route handler that opens a demo household invitation, not a page, so it is
// linked plainly rather than through the client router.
const guestPreview = "/demo/riviera";

// The three documents a planner rebuilds by hand the week before a wedding.
// Each line here is what the export in `/api/studio/export` actually writes, so
// the page can be checked against the file a planner downloads.
const documents = [
  {
    for: "For the caterer",
    name: "Kitchen sheet",
    lines: [
      "Covers by meal, and the total",
      "Every dietary requirement beside the table it has to reach",
      "Covers per table, so the room can be plated",
    ],
  },
  {
    for: "For the transport company",
    name: "Shuttle manifest",
    lines: [
      "Every rider by household, read from the answers guests gave",
      "The answer each one actually left, not a separate list",
      "Seats required, counted",
    ],
  },
  {
    for: "For the calligrapher and the venue",
    name: "Place cards",
    lines: [
      "Every attending guest, alphabetically",
      "Table, meal and dietary note beside each name",
    ],
  },
];

// Keep what you run on; add the layer around it. Read left to right.
const movement = [
  {
    mark: "in" as const,
    title: "Bring in what you need",
    copy: "Import a guest list as a CSV. Map its columns, review households and duplicates, and nothing is saved until you say so.",
  },
  {
    mark: "here" as const,
    title: "Run the guest experience here",
    copy: "The invitation, the household reply, the private events, the travel notes and the wedding pass. The part your couple’s guests actually touch.",
  },
  {
    mark: "out" as const,
    title: "Take it back out whenever",
    copy: "Export the guest and RSVP data, and the documents your suppliers need, as CSV. Nothing you put in is held here.",
  },
];

// Every row of the ledger pairs something the planner does with what the
// couple's guests receive because of it.
const ledger = [
  {
    studio: "The guest list you already keep",
    studioCopy:
      "Import the spreadsheet you already maintain: households, plus-ones, dietary notes and languages, mapped and de-duplicated on the way in.",
    guest: "A link addressed to them",
    guestCopy:
      "No account and no password. A guest opens their invitation and it already knows who they are.",
  },
  {
    studio: "Private events",
    studioCopy:
      "Choose which households see the rehearsal dinner, the welcome drinks, the family lunch.",
    guest: "Only their weekend",
    guestCopy:
      "Guests see the gatherings they are invited to, and no trace of the ones they are not.",
  },
  {
    studio: "Replies that land where you need them",
    studioCopy:
      "Responses arrive per person and per event, with meals, dietary notes and your own questions attached.",
    guest: "One reply for the household",
    guestCopy:
      "They answer for everyone at once, check who is coming to what, and change it when plans move.",
  },
  {
    studio: "Travel and accommodation",
    studioCopy:
      "Hotels, transport and arrival notes kept beside the wedding instead of buried in an email thread.",
    guest: "They know how to arrive",
    guestCopy:
      "Where to stay, how to get there, and how much time to leave for the journey.",
  },
  {
    studio: "Seating you can move",
    studioCopy:
      "Tables, capacity and assignments checked as you go, so a table never quietly overfills.",
    guest: "Their table, on the day",
    guestCopy:
      "Every guest carries a wedding pass with their table and the weekend’s timings.",
  },
  {
    studio: "The right update to the right guests",
    studioCopy:
      "Write once, choose the audience, and see exactly who it reaches before anything sends.",
    guest: "A note inside their invitation",
    guestCopy:
      "Updates appear in the invitation they already hold, with or without an email address.",
  },
  {
    studio: "A world chosen per couple",
    studioCopy:
      "Three complete design worlds, set to the couple rather than to a template you have used before. Three more are drawn and written, still borrowing our photography.",
    guest: "Not another wedding website",
    guestCopy:
      "Photography, typography and motion that make the first click feel like the day itself.",
  },
];

export default function Planners() {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // The sheets settle the way paper does when it is laid down.
        gsap.from(".supplier-sheet", {
          y: 26,
          rotate: 0.6,
          opacity: 0,
          duration: 0.75,
          stagger: 0.09,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".supplier-sheets",
            start: "top 82%",
            once: true,
          },
        });
        gsap.from(".alongside-step", {
          y: 16,
          opacity: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".alongside-movement",
            start: "top 85%",
            once: true,
          },
        });
        gsap.from(".ledger-row", {
          y: 22,
          opacity: 0,
          duration: 0.7,
          stagger: 0.06,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".planner-ledger",
            start: "top 78%",
            once: true,
          },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );
  return (
    <div ref={root} className="marketing planner-page">
      <MarketingNavigation />
      <main id="main">
        <section className="planner-hero">
          <p className="collection-caption">For wedding planners</p>
          <h1>
            Keep the system you run on.
            <br />
            <em>Add the part guests hold.</em>
          </h1>
          <p className="planner-thesis">
            <span>You already run the wedding.</span>
            <span>This is the layer their guests touch.</span>
          </p>
          <p className="planner-lede">
            Vow Motion is not another planning platform, and is not trying to
            replace the one you have. Import the guest information you need, run
            the invitation, the replies and the weekend inside it, and export
            whenever you want it back — including the three documents your
            suppliers ask you for.
          </p>
          <div className="planner-hero-actions">
            <a href={guestPreview} className="button primary">
              See what a guest receives <Arrow diagonal size={14} />
            </a>
            <DemoButton className="text-link">
              Open the planner Studio
            </DemoButton>
          </div>
          <p className="offer-note">
            Working invitation. Sample guests. No signup or card required.
          </p>
        </section>

        {/* Said once, plainly, before anything else can be mistaken for a
            replacement pitch: your platform stays, this goes around it. */}
        <section
          className="planner-alongside"
          aria-labelledby="alongside-heading"
        >
          <div className="alongside-plate">
            <p className="alongside-eyebrow">Alongside, not instead</p>
            <h2 id="alongside-heading">
              Your planning system stays
              <br />
              <em>exactly where it is.</em>
            </h2>
            <p className="alongside-lede">
              Contracts, budgets, timelines, your client portal: none of it
              moves. Vow Motion wraps the guest-facing half of the wedding
              around what you already run.
            </p>
            <ol className="alongside-movement">
              {movement.map(({ mark, title, copy }, index) => (
                <li className={"alongside-step step-" + mark} key={title}>
                  <span className="alongside-number" aria-hidden="true">
                    0{index + 1}
                  </span>
                  <span className="alongside-mark" aria-hidden="true">
                    {mark === "here" ? (
                      <svg viewBox="0 0 44 30" fill="none">
                        <ellipse
                          cx="22"
                          cy="15"
                          rx="20.5"
                          ry="13.5"
                          stroke="currentColor"
                        />
                        <ellipse
                          cx="22"
                          cy="15"
                          rx="17.5"
                          ry="10.5"
                          stroke="currentColor"
                          strokeOpacity="0.45"
                        />
                        <path d="M22 8.5v13M15.5 15h13" stroke="currentColor" />
                      </svg>
                    ) : mark === "in" ? (
                      // Into the bound: an arrow arriving at the rule.
                      <svg viewBox="0 0 44 30" fill="none">
                        <path d="M2 15h30m-7-6 7 6-7 6" stroke="currentColor" />
                        <path
                          d="M40 3v24"
                          stroke="currentColor"
                          strokeOpacity="0.5"
                        />
                      </svg>
                    ) : (
                      // Out of the bound: the rule first, then the arrow away.
                      <svg viewBox="0 0 44 30" fill="none">
                        <path
                          d="M4 3v24"
                          stroke="currentColor"
                          strokeOpacity="0.5"
                        />
                        <path
                          d="M12 15h30m-7-6 7 6-7 6"
                          stroke="currentColor"
                        />
                      </svg>
                    )}
                  </span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </li>
              ))}
            </ol>
            <p className="alongside-caveat">
              To be plain about it: there is no live two-way sync with another
              planning system. Movement is by CSV, in both directions, and we
              would rather tell you that now than after you have set one up.
            </p>
          </div>
        </section>

        {/* The wedge is the paperwork, not the romance: it is the one thing a
            planner does by hand that nobody's CRM is doing for them. */}
        <section
          className="planner-suppliers"
          aria-labelledby="suppliers-heading"
        >
          <div className="suppliers-intro">
            <p className="collection-caption">Start here, if anywhere</p>
            <h2 id="suppliers-heading">
              The three documents you
              <br />
              <em>rebuild by hand every time.</em>
            </h2>
            <p>
              The week before a wedding, the same three documents get made again
              from a guest list export. The Studio builds them from the replies
              it is already holding, and names each one for the supplier who
              receives it rather than for its format.
            </p>
          </div>
          <ul className="supplier-sheets">
            {documents.map((sheet) => (
              <li className="supplier-sheet" key={sheet.name}>
                <span className="docket-for">{sheet.for}</span>
                <h3>{sheet.name}</h3>
                <span className="docket-rule" aria-hidden="true" />
                <ul className="docket-lines">
                  {sheet.lines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <span className="docket-foot">CSV</span>
              </li>
            ))}
          </ul>
          <p className="suppliers-note">
            CSV, because that is what a supplier can open. The same information
            is also typeset as a printable day-of book — cover, order of the
            day, kitchen sheet, seating plan, shuttle manifest and place cards —
            set in the wedding’s own type.
          </p>
        </section>

        <FirstSteps planner />
        <section className="planner-ledger" aria-labelledby="ledger-heading">
          <div className="ledger-intro">
            <h2 id="ledger-heading">
              Two sides of the
              <br />
              <em>same wedding.</em>
            </h2>
            <p>
              Everything you set on the left is what their guests meet on the
              right. None of it asks you to move the rest of your planning.
            </p>
          </div>
          <div className="ledger-columns" aria-hidden="true">
            <span>In your Studio</span>
            <span>In their invitation</span>
          </div>
          <ul className="ledger-rows">
            {ledger.map(({ studio, studioCopy, guest, guestCopy }) => (
              <li className="ledger-row" key={studio}>
                <div className="ledger-side ledger-studio">
                  <span className="ledger-label">In your Studio</span>
                  <h3>{studio}</h3>
                  <p>{studioCopy}</p>
                </div>
                <span className="ledger-spine" aria-hidden="true" />
                <div className="ledger-side ledger-guest">
                  <span className="ledger-label">In their invitation</span>
                  <h3>{guest}</h3>
                  <p>{guestCopy}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="planner-pilot" aria-labelledby="pilot-heading">
          <div className="pilot-photo">
            <img
              src="/images/wedding-details.webp"
              alt="Garden roses, silk ribbon and wedding bands, thoughtfully arranged"
              loading="lazy"
            />
          </div>
          <div className="pilot-copy">
            <p className="collection-caption">Explore first. Build together.</p>
            <h2 id="pilot-heading">
              Start by imagining
              <br />
              <em>one wedding.</em>
            </h2>
            <p>
              Get a feel for it with a private Studio demo before you involve a
              couple. We are a small team interested in working directly with
              planners to make the guest experience more personal and the setup
              easier. Your current process is the starting point for that
              conversation.
            </p>
            <ul className="pilot-list">
              <li>Three sample weddings, ready to explore and change.</li>
              <li>Try the designs, guest lists and event settings yourself.</li>
              <li>
                No card, no meeting and no real guest list needed to try it.
              </li>
            </ul>
            <DemoButton className="button primary">
              Start with a private demo
            </DemoButton>
            <small>
              The demo builds three fictional weddings you can change freely.
              Nothing you do in it reaches a real guest.
            </small>
          </div>
        </section>

        <OfferQuestions planner />
        <section className="planner-closing">
          <span>
            IT SITS BESIDE YOUR PLANNING SYSTEM. IT DOES NOT ASK TO REPLACE IT.
          </span>
          <h2>
            You keep the plan.
            <br />
            <em>Their guests keep the wedding.</em>
          </h2>
          <DemoButton className="button light-button">
            Explore the Studio
          </DemoButton>
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
