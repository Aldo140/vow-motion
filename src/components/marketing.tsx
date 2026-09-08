"use client";
import { useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import LandingHero from "./landing-hero";
import { FirstSteps, OfferQuestions } from "./marketing-offer";
import MarketingNavigation from "./marketing-navigation";
import ProductShowcase from "./product-showcase";
import { useGSAP } from "@gsap/react";
import { CheckIcon, ArrowDownIcon } from "@phosphor-icons/react";
import { Brand, Arrow, DemoButton } from "./ui";
import { worlds } from "@/lib/worlds";
gsap.registerPlugin(useGSAP, ScrollTrigger);
export default function Marketing() {
  const root = useRef<HTMLDivElement>(null),
    [active, setActive] = useState("riviera");
  const world = worlds.find((w) => w.id === active)!;
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".letter-mark",
          { rotation: -12 },
          {
            rotation: 12,
            ease: "none",
            scrollTrigger: {
              trigger: ".love-letter",
              start: "top bottom",
              end: "bottom top",
              scrub: 1,
            },
          },
        );
        gsap.fromTo(
          ".beginning-invitation",
          { rotation: -7, y: 35 },
          {
            rotation: -1,
            y: -15,
            ease: "none",
            scrollTrigger: {
              trigger: ".beginning-section",
              start: "top bottom",
              end: "bottom top",
              scrub: 1,
            },
          },
        );
        gsap.from(".studio-specimen", {
          y: 25,
          rotation: -4,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".platform-layout",
            start: "top 80%",
            once: true,
          },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );
  return (
    <div ref={root} className="marketing">
      <MarketingNavigation />
      <main id="main">
        <LandingHero />
        <section className="love-letter">
          <div className="letter-mark" aria-hidden="true">
            V<i>&</i>M
          </div>
          <div>
            <p className="letter-salutation">Dear almost-married,</p>
            <h2>
              You’re inviting them
              <br />
              into <em>your story.</em>
            </h2>
            <p>
              Give them that first flutter of excitement. A place that feels
              like the two of you, with every thoughtful detail already waiting.
            </p>
          </div>
          <div className="letter-aside">
            <span>
              A lovely first impression.
              <br />A much easier everything after.
            </span>
            <a href="#worlds" className="text-link">
              Find your feeling <ArrowDownIcon size={18} />
            </a>
          </div>
        </section>
        <ProductShowcase />
        <section className="collection section-pad" id="worlds" tabIndex={-1}>
          <div className="section-heading">
            <div>
              <p className="collection-caption">The invitation wardrobe</p>
              <h2>
                Something borrowed.
                <br />
                <em>Entirely your own.</em>
              </h2>
            </div>
            <p>
              Six worlds, each with its own kind of romance.
              <br />
              Find the one that feels like you.
            </p>
          </div>
          <div className="world-tabs" role="tablist" aria-label="Design worlds">
            {worlds.map((w) => (
              <button
                role="tab"
                id={"tab-" + w.id}
                aria-controls="world-preview"
                aria-selected={w.id === active}
                tabIndex={w.id === active ? 0 : -1}
                onKeyDown={(event) => {
                  const index = worlds.indexOf(w);
                  const next =
                    event.key === "ArrowRight"
                      ? (index + 1) % worlds.length
                      : event.key === "ArrowLeft"
                        ? (index + worlds.length - 1) % worlds.length
                        : event.key === "Home"
                          ? 0
                          : event.key === "End"
                            ? worlds.length - 1
                            : -1;
                  if (next < 0) return;
                  event.preventDefault();
                  setActive(worlds[next].id);
                  document.getElementById("tab-" + worlds[next].id)?.focus();
                }}
                key={w.id}
                onClick={() => setActive(w.id)}
              >
                {w.name}
                <span>{String(worlds.indexOf(w) + 1).padStart(2, "0")}</span>
              </button>
            ))}
          </div>
          <div
            className={"collection-preview world-" + active}
            role="tabpanel"
            id="world-preview"
            aria-labelledby={"tab-" + active}
          >
            <div className="collection-image" key={world.id}>
              <img
                src={world.image}
                alt={`${world.name} architectural and celebration art direction`}
                loading="lazy"
              />
              <div className="collection-couple">
                <small>YOU ARE INVITED TO CELEBRATE</small>
                <h3>{world.couple}</h3>
                <span>{world.place}</span>
              </div>
            </div>
            <div className="collection-note">
              <span className="collection-number">
                0{worlds.indexOf(world) + 1} / 06
              </span>
              <h3>{world.name}</h3>
              <p>{world.description}</p>
              <div className="swatches">
                {world.palette.map((c) => (
                  <span key={c} style={{ background: c }} />
                ))}
              </div>
              <a className="button outline" href={"/demo/" + world.id}>
                Experience {world.name}
                <Arrow diagonal />
              </a>
              <small>A fictional wedding. A fully working experience.</small>
            </div>
          </div>
        </section>
        <FirstSteps />
        <section
          className="platform-story section-pad"
          id="studio"
          tabIndex={-1}
        >
          <div className="platform-title">
            <p className="collection-caption">
              Behind every effortless celebration
            </p>
            <h2>
              A lot goes into a wedding.
              <br />
              <em>Let this part be easy.</em>
            </h2>
          </div>
          <div className="platform-layout">
            <div className="studio-specimen">
              <div className="mini-nav">
                <Brand />
                <span>YOUR WEDDING STUDIO</span>
              </div>
              <div className="mini-body">
                <div className="mini-sidebar">
                  <b>Overview</b>
                  <span>Guest list</span>
                  <span>Your experience</span>
                  <span>Invitations</span>
                  <span>Seating</span>
                </div>
                <div className="mini-main">
                  <small>YOUR PEOPLE, ALL IN ONE PLACE</small>
                  <h3>Room for everyone.</h3>
                  <div className="mini-stat">
                    <strong>24</strong>
                    <span>demo guests</span>
                    <strong>14</strong>
                    <span>ready to celebrate</span>
                  </div>
                  {["Isabella Rossi", "James Bennett", "Sophie Chen"].map(
                    (n) => (
                      <div className="mini-row" key={n}>
                        <span className="avatar">
                          {n
                            .split(" ")
                            .map((s) => s[0])
                            .join("")}
                        </span>
                        {n}
                        <span className="status attending">Attending</span>
                      </div>
                    ),
                  )}
                </div>
              </div>
              <span className="specimen-label">
                A glimpse inside your Studio · Demo data
              </span>
            </div>
            <div className="platform-features">
              {[
                [
                  "Your people. One guest list.",
                  "Households, plus-ones, and every little dietary detail. Import once and keep everything connected.",
                ],
                [
                  "Ready for your next decision.",
                  "See who still needs to reply and bring confirmed attendance and meal choices into your seating plan.",
                ],
                [
                  "Before, during, and long after.",
                  "Travel plans, table assignments, a wedding-day pass, and a shared place for all those memories.",
                ],
              ].map(([title, copy], i) => (
                <div className="feature-row" key={title}>
                  <span>0{i + 1}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{copy}</p>
                  </div>
                </div>
              ))}
              <DemoButton className="text-link" />
            </div>
          </div>
        </section>
        <section className="planner-section" id="planners" tabIndex={-1}>
          <div className="planner-image">
            <img
              src="/images/wedding-details.webp"
              alt="Garden roses, silk ribbon and wedding bands, thoughtfully arranged"
              loading="lazy"
            />
          </div>
          <div>
            <p className="collection-caption">For the people behind the day</p>
            <h2>
              Your eye for detail.
              <br />
              <em>A studio to match.</em>
            </h2>
            <p>
              Give every couple their own world. Keep every wedding, guest list,
              and collaborator beautifully in hand.
            </p>
            <a href="/planners" className="button light-button">
              How planners use Vow Motion <Arrow diagonal size={15} />
            </a>
          </div>
        </section>
        <section
          className="beginning-section section-pad"
          id="pricing"
          tabIndex={-1}
        >
          <div className="beginning-invitation" aria-hidden="true">
            <span>Save the date</span>
            <div>
              Your names
              <br />
              <i>go here.</i>
            </div>
            <small>
              A day like no other.
              <br />
              An invitation like no one else’s.
            </small>
            <span className="beginning-monogram">V M</span>
          </div>
          <div className="beginning-copy">
            <p className="collection-caption">Your wedding, all together</p>
            <h2>
              A little less planning.
              <br />
              <em>A little more living.</em>
            </h2>
            <p>
              Your invitation is just the beginning. Keep replies, event details
              and the information your guests need connected in your own Studio.
            </p>
            <div className="offer-price">
              Included at no charge in this release.
            </div>
            <ul>
              <li>
                <CheckIcon size={18} /> Personal invitations & household RSVPs
              </li>
              <li>
                <CheckIcon size={18} /> Events, travel, seating & shared
                memories
              </li>
              <li>
                <CheckIcon size={18} /> Your own wedding Studio, all connected
              </li>
            </ul>
            <a href="/start" className="button primary">
              Create your wedding <Arrow diagonal />
            </a>
            <small>
              No card required. Preview your invitations before you share them.
            </small>
          </div>
        </section>
        <OfferQuestions />
        <section className="closing">
          <img
            src="/images/wedding-evening.webp"
            alt=""
            loading="lazy"
            className="closing-photo"
          />
          <span>ONE BEAUTIFUL PLACE FOR EVERYONE YOU LOVE.</span>
          <h2>
            It begins with
            <br />
            <em>an invitation.</em>
          </h2>
          <a href="/start" className="button light-button">
            Let’s make yours <Arrow diagonal />
          </a>
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
