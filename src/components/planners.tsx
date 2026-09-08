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

// Every row of the ledger pairs something the planner does with what the
// couple's guests receive because of it.
const ledger = [
  {
    studio: "One guest list",
    studioCopy:
      "Households, plus-ones, dietary notes and languages in one place. Import a spreadsheet once, then stop chasing versions of it.",
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
      "Six directions, set to the couple rather than to a template you have used before.",
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
            Give every client a day
            <br />
            <em>worth remembering twice.</em>
          </h1>
          <p className="planner-thesis">
            <span>You manage the details.</span>
            <span>They experience the magic.</span>
          </p>
          <p className="planner-lede">
            Carry your couple’s wedding design from the invitation opening to
            household RSVPs, private events and travel details. Explore the
            guest experience first, then see whether the Studio fits the way you
            work.
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
              right. Details stay connected within Vow Motion.
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
          <span>ONE PLACE TO RUN THE DAY. ONE PLACE TO REMEMBER IT.</span>
          <h2>
            Your clients keep the memory.
            <br />
            <em>You keep the plan.</em>
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
        <span>© {new Date().getFullYear()} Vow Motion</span>
      </footer>
    </div>
  );
}
