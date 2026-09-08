"use client";
import { useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import LandingHero from "./landing-hero";
import { FirstSteps, OfferQuestions } from "./marketing-offer";
import MarketingNavigation from "./marketing-navigation";
import ProductShowcase from "./product-showcase";
import ProductStory from "./product-story";
import { useGSAP } from "@gsap/react";
import { CheckIcon } from "@phosphor-icons/react";
import { Arrow, Brand } from "./ui";
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
        gsap.from(".paper-seam-seal", {
          rotation: -22,
          y: -12,
          ease: "none",
          scrollTrigger: {
            trigger: ".paper-seam",
            start: "top 90%",
            end: "bottom 45%",
            scrub: true,
          },
        });
        gsap.from(".memory-thread path", {
          strokeDashoffset: 1,
          ease: "none",
          scrollTrigger: {
            trigger: ".memory-bridge",
            start: "top 90%",
            end: "bottom 65%",
            scrub: true,
          },
        });
        gsap.utils
          .toArray<HTMLElement>(".bridge-print")
          .forEach((element, index) => {
            gsap.from(element, {
              y: 35,
              rotation: index === 1 ? -6 : 6,
              ease: "none",
              scrollTrigger: {
                trigger: ".memory-bridge",
                start: "top 90%",
                end: "bottom 50%",
                scrub: true,
              },
            });
          });
        gsap.utils.toArray<HTMLElement>(".depth-drift").forEach((element) => {
          gsap.fromTo(
            element,
            { y: 18 },
            {
              y: -18,
              ease: "none",
              scrollTrigger: {
                trigger: element.parentElement,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            },
          );
        });
        gsap.from(".journey-phone-invite", {
          y: 24,
          ease: "none",
          scrollTrigger: {
            trigger: ".journey-collage",
            start: "top bottom",
            end: "bottom center",
            scrub: true,
          },
        });
        gsap.from(".journey-phone-events", {
          y: 45,
          ease: "none",
          scrollTrigger: {
            trigger: ".journey-collage",
            start: "top bottom",
            end: "bottom center",
            scrub: true,
          },
        });
        gsap.from(".journey-reply-card", {
          opacity: 0,
          y: 20,
          ease: "none",
          scrollTrigger: {
            trigger: ".journey-collage",
            start: "center 80%",
            end: "bottom 70%",
            scrub: true,
          },
        });
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
              scrub: true,
            },
          },
        );
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
        <ProductStory variant="invitation" />
        <ProductShowcase />
        <div className="paper-seam" aria-hidden="true">
          <div className="paper-seam-edge" />
          <span className="paper-seam-seal">
            V <i>&amp;</i> M
          </span>
        </div>
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
              <div
                className="collection-mood-print depth-drift"
                aria-hidden="true"
              >
                <img
                  src={
                    active === "riviera"
                      ? "/images/riviera.webp"
                      : active === "maison"
                        ? "/images/hero-maison.webp"
                        : "/images/wedding-details.webp"
                  }
                  alt=""
                  loading="lazy"
                />
                <span>A feeling, down to the details.</span>
              </div>
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
        <ProductStory variant="studio" />
        <section className="planner-section" id="planners" tabIndex={-1}>
          <div className="planner-image">
            <img
              src="/images/wedding-details.webp"
              alt="Garden roses, silk ribbon and wedding bands, thoughtfully arranged"
              loading="lazy"
            />
            <div className="planner-venue-print depth-drift" aria-hidden="true">
              <img src="/images/hero-maison.webp" alt="" loading="lazy" />
              <span>Every detail, considered.</span>
              <b className="depth-paper-seal">V &amp; M</b>
            </div>
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
          <div className="beginning-still-life" aria-hidden="true">
            <div className="beginning-photo depth-drift">
              <img src="/images/garden.webp" alt="" loading="lazy" />
              <span>For all the moments to come.</span>
            </div>
            <div className="beginning-invitation">
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
            <img
              className="beginning-silk depth-drift"
              src="/images/invitation-silk.webp"
              alt=""
              loading="lazy"
            />
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
        <div className="memory-bridge" aria-hidden="true">
          <svg
            className="memory-thread"
            viewBox="0 0 1200 220"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              pathLength="1"
              d="M0 150C140 150 175 30 330 82S500 230 690 112 920 55 1200 145"
            />
          </svg>
          <div className="bridge-prints">
            <figure className="bridge-print">
              <img src="/images/hero-maison.webp" alt="" loading="lazy" />
              <figcaption>A place to gather.</figcaption>
            </figure>
            <figure className="bridge-print">
              <img src="/images/wedding-details.webp" alt="" loading="lazy" />
              <figcaption>A little anticipation.</figcaption>
            </figure>
            <figure className="bridge-print">
              <img src="/images/notte.webp" alt="" loading="lazy" />
              <figcaption>A night to remember.</figcaption>
            </figure>
          </div>
        </div>
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
