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
        gsap.from(".hero-art", {
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
        <section className="marketing-hero">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="tiny-star">✳</span> THE ART OF BRINGING PEOPLE
              TOGETHER
            </p>
            <h1>
              Your entire wedding.
              <br />
              <em>Beautifully shared.</em>
            </h1>
            <p className="hero-description">
              From the first invitation to the last dance.
              <br />
              One beautiful place for everyone you love.
            </p>
            <div className="hero-actions">
              <a href="/start" className="button primary">
                Create your wedding <Arrow diagonal />
              </a>
              <Link href="/demo/riviera" prefetch={false} className="text-link">
                Experience a wedding <Arrow />
              </Link>
            </div>
            <p className="hero-note">
              Designed with intention. Made to feel like you.
            </p>
          </div>
          <div className="hero-art">
            <div className="art-index">
              <span>A LITTLE PREVIEW OF FOREVER</span>
              <span>EST. 2026</span>
            </div>
            <img
              src="/images/riviera.webp"
              alt="An Italian villa overlooking the still waters of Lake Como"
              fetchPriority="high"
              className="hero-landscape"
            />
            <div className="invitation-specimen">
              <span>INSIEME, PER SEMPRE</span>
              <div className="specimen-names">
                Elena <i>&</i>
                <br />
                Matteo
              </div>
              <div className="specimen-rule" />
              <p>
                19 JUNE 2027
                <br />
                LAKE COMO, ITALY
              </p>
              <Link
                href="/demo/riviera"
                prefetch={false}
                className="specimen-open"
              >
                Open the invitation <Arrow diagonal size={15} />
              </Link>
            </div>
            <div className="art-caption">
              <span>THE RIVIERA COLLECTION</span>
              <Link href="/demo/riviera" prefetch={false}>
                Step inside <Arrow diagonal size={14} />
              </Link>
            </div>
          </div>
        </section>
        <div className="promise-strip">
          <span>One invitation.</span>
          <i />
          <span>Every guest.</span>
          <i />
          <span>All the details.</span>
          <i />
          <span>Entirely you.</span>
          <a href="#worlds" aria-label="Explore the collection">
            <ArrowDownIcon size={18} />
          </a>
        </div>
        <section className="collection section-pad" id="worlds">
          <div className="section-heading">
            <div>
              <p className="eyebrow">THE DESIGN COLLECTION</p>
              <h2>
                Not a template.
                <br />
                <em>A world of your own.</em>
              </h2>
            </div>
            <p>
              Six distinct points of view.
              <br />
              Thoughtfully composed. Effortlessly yours.
            </p>
          </div>
          <div className="world-tabs" role="tablist" aria-label="Design worlds">
            {worlds.map((w) => (
              <button
                role="tab"
                id={"tab-" + w.id}
                aria-controls="world-preview"
                aria-selected={w.id === active}
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
            <p className="eyebrow">BEAUTY, MEET PEACE OF MIND</p>
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
              src="/images/maison.webp"
              alt="Sunlit French limestone chateau and garden"
              loading="lazy"
            />
          </div>
          <div>
            <p className="eyebrow">FOR THE PEOPLE BEHIND THE DAY</p>
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
        <section className="pricing section-pad" id="pricing">
          <div className="section-heading">
            <div>
              <p className="eyebrow">A BEAUTIFUL BEGINNING</p>
              <h2>
                A little less planning.
                <br />
                <em>A little more living.</em>
              </h2>
            </div>
            <p>
              Explore freely. Choose your collection.
              <br />
              No card required to create your wedding.
            </p>
          </div>
          <div className="price-options">
            {[
              {
                name: "Essential",
                desc: "Everything starts here.",
                features: [
                  "Your wedding experience",
                  "Guests, households & personal RSVPs",
                  "Events, travel & seating",
                ],
              },
              {
                name: "Signature",
                desc: "A world with your signature.",
                features: [
                  "Everything in Essential",
                  "Your own domain architecture",
                  "All six design worlds & memories",
                ],
              },
              {
                name: "Bespoke",
                desc: "For a vision all your own.",
                features: [
                  "Everything in Signature",
                  "A brief for custom art direction",
                  "Planner & collaborator tools",
                ],
              },
            ].map((p, i) => (
              <div className="price-option" key={p.name}>
                <div className="price-top">
                  <span>{p.name}</span>
                  {i === 1 && <small>THE FULL EXPERIENCE</small>}
                </div>
                <h3>{p.desc}</h3>
                <ul>
                  {p.features.map((f) => (
                    <li key={f}>
                      <CheckIcon size={16} />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={"/start?plan=" + p.name.toLowerCase()}
                  className={i === 1 ? "button primary" : "button outline"}
                >
                  Begin with {p.name}
                  <Arrow diagonal />
                </a>
              </div>
            ))}
          </div>
          <p className="pricing-note">
            Launch preview · Package pricing is being finalized. Creating a
            wedding does not start a paid subscription.
          </p>
        </section>
        <section className="closing">
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
