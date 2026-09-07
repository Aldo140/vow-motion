"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import {
  ListIcon,
  XIcon,
  CheckIcon,
  ArrowDownIcon,
} from "@phosphor-icons/react";
import { Brand, Arrow, DemoButton } from "./ui";
import { worlds } from "@/lib/worlds";
gsap.registerPlugin(useGSAP);
export default function Marketing() {
  const root = useRef<HTMLDivElement>(null),
    [menu, setMenu] = useState(false),
    [active, setActive] = useState("riviera");
  const world = worlds.find((w) => w.id === active)!;
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".hero-copy > *", {
          y: 24,
          opacity: 0,
          duration: 0.85,
          stagger: 0.12,
          ease: "power3.out",
        });
        gsap.from(".hero-keepsake", {
          y: 30,
          rotation: 1.5,
          duration: 1.1,
          ease: "power3.out",
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );
  return (
    <div ref={root} className="marketing">
      <header className="marketing-nav">
        <Brand />
        <nav className={menu ? "open" : ""} aria-label="Main navigation">
          <a href="#worlds" onClick={() => setMenu(false)}>
            The design collection
          </a>
          <a href="#experience" onClick={() => setMenu(false)}>
            How it works
          </a>
          <a href="#pricing" onClick={() => setMenu(false)}>
            Pricing
          </a>
          <a href="#planners" onClick={() => setMenu(false)}>
            For planners <Arrow diagonal size={13} />
          </a>
        </nav>
        <div className="nav-actions">
          <a href="/login" className="signin">
            Sign in
          </a>
          <a href="/start" className="button primary small">
            Begin your story <Arrow diagonal size={15} />
          </a>
        </div>
        <button
          className="mobile-toggle icon-button"
          onClick={() => setMenu(!menu)}
          aria-expanded={menu}
          aria-label="Toggle navigation"
        >
          {menu ? <XIcon size={24} /> : <ListIcon size={24} />}
        </button>
      </header>
      <main id="main">
        <section className="marketing-hero celebration-hero">
          <img
            src="/images/wedding-evening.webp"
            alt="Candlelight, garden roses and linen set for a wedding dinner beside the lake"
            fetchPriority="high"
            className="celebration-background"
          />
          <div className="hero-copy">
            <p className="hero-dedication">
              For the day. For your people. Forever.
            </p>
            <h1>
              Your entire wedding.
              <br />
              <em>Beautifully shared.</em>
            </h1>
            <p className="hero-description">
              The anticipation. The gathering. The happily ever after.
              <br />
              It all begins with a beautiful invitation.
            </p>
            <div className="hero-actions">
              <a href="/start" className="button light-button">
                Create your wedding <Arrow diagonal />
              </a>
              <Link href="/demo/riviera" prefetch={false} className="text-link">
                Experience a wedding <Arrow />
              </Link>
            </div>
          </div>
          <Link
            className="hero-keepsake"
            href="/demo/riviera"
            prefetch={false}
            aria-label="Open Elena and Matteo’s sample invitation"
          >
            <span className="keepsake-seal" aria-hidden="true">
              E<i>&</i>M
            </span>
            <span className="keepsake-copy">
              <small>You are joyfully invited</small>
              <strong>Elena & Matteo</strong>
              <span>Lake Como · 19 June 2027</span>
            </span>
            <Arrow diagonal size={22} />
          </Link>
          <div className="hero-edition">
            <span>Vow Motion</span>
            <span>Wedding websites, with a little soul.</span>
          </div>
        </section>
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
        <section className="collection section-pad" id="worlds">
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
            <div className="collection-image">
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
        <section className="platform-story section-pad" id="experience">
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
                  "An RSVP that feels personal.",
                  "A private invitation for each household. Guests see their events and respond without creating an account.",
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
        <section className="planner-section" id="planners">
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
            <DemoButton className="button light-button">
              Explore the planner Studio
            </DemoButton>
          </div>
        </section>
        <section className="beginning-section section-pad" id="pricing">
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
            <p className="collection-caption">A beautiful beginning</p>
            <h2>
              A little less planning.
              <br />
              <em>A little more living.</em>
            </h2>
            <p>
              Choose your world. Bring your people. Make room for the moments
              you’ll want to remember.
            </p>
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
              Begin your story <Arrow diagonal />
            </a>
            <small>
              No card required. Your wedding tools are included in this release.
            </small>
          </div>
        </section>
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
