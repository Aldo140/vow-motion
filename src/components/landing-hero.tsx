"use client";
import Link from "next/link";
import { useHydrated } from "./use-hydrated";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  ArrowUpRightIcon,
  ArrowRightIcon,
  CheckIcon,
} from "@phosphor-icons/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);
const moods = [
  {
    id: "riviera",
    name: "Riviera",
    feeling: "A sun-drenched yes.",
    couple: ["Elena", "Matteo"],
    place: "Lake Como, Italy",
    photo: "/images/hero-riviera.webp",
    background: "/images/wedding-evening.webp",
    line: "Insieme, per sempre.",
    initials: "EM",
  },
  {
    id: "maison",
    name: "Maison",
    feeling: "A little French romance.",
    couple: ["Amélie", "Julien"],
    place: "Provence, France",
    photo: "/images/hero-maison.webp",
    background: "/images/hero-maison.webp",
    line: "Pour toujours.",
    initials: "AJ",
  },
  {
    id: "notte",
    name: "Notte",
    feeling: "Until the last dance.",
    couple: ["Isabel", "Oliver"],
    place: "New York, USA",
    photo: "/images/notte.webp",
    background: "/images/notte.webp",
    line: "The night is ours.",
    initials: "IO",
  },
];

export default function LandingHero() {
  const ready = useHydrated();
  const root = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(0);
  const [opened, setOpened] = useState(false);
  const mood = moods[selected];
  useEffect(() => {
    if (opened)
      root.current
        ?.querySelector<HTMLElement>(".suite-visit")
        ?.focus({ preventScroll: true });
  }, [opened]);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        {
          wide: "(min-width: 901px)",
          narrow: "(max-width: 900px)",
          motion: "(prefers-reduced-motion: no-preference)",
        },
        (context) => {
          if (!context.conditions?.motion) return;
          const wide = context.conditions.wide;
          const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
          intro
            .from(
              ".immersive-hero-copy > *",
              { y: 18, duration: 0.8, stagger: 0.07, clearProps: "transform" },
              0,
            )
            .from(
              ".suite-photo-layer",
              { y: 40, rotation: -4, duration: 1.25 },
              0.05,
            )
            .from(".suite-envelope-layer", { y: 65, duration: 1.15 }, 0.1)
            .from(
              ".suite-flower-layer",
              { y: 55, rotation: 6, duration: 1.3 },
              0.15,
            );
          const scene = gsap.timeline({
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              end: wide ? "bottom bottom" : "bottom top",
              scrub: 1,
            },
            defaults: { ease: "none" },
          });
          scene
            .to(".hero-ambient", { yPercent: wide ? 9 : 5, scale: 1.08 }, 0)
            .to(".hero-copy-depth", { y: wide ? -48 : -15 }, 0)
            .to(
              ".suite-photo-drift",
              {
                x: wide ? -52 : -9,
                y: wide ? -85 : -28,
                rotation: wide ? -6 : -2,
              },
              0,
            )
            .to(
              ".suite-envelope-drift",
              { x: wide ? 28 : 5, y: wide ? 30 : 12, rotation: wide ? 4 : 2 },
              0,
            )
            .to(
              ".suite-flower-drift",
              {
                x: wide ? 56 : 12,
                y: wide ? -110 : -38,
                rotation: wide ? 8 : 3,
              },
              0,
            );
          gsap.to(".hero-scroll-progress", {
            scaleX: 1,
            ease: "none",
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          });
        },
      );
      mm.add(
        "(min-width: 901px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
        () => {
          const stage =
            root.current?.querySelector<HTMLElement>(".hero-art-stage");
          const assembly = root.current?.querySelector<HTMLElement>(
            ".suite-pointer-plane",
          );
          if (!stage || !assembly) return;
          const x = gsap.quickTo(assembly, "rotationX", {
            duration: 0.9,
            ease: "power3.out",
          });
          const y = gsap.quickTo(assembly, "rotationY", {
            duration: 0.9,
            ease: "power3.out",
          });
          const move = (event: PointerEvent) => {
            const rect = stage.getBoundingClientRect();
            x((0.5 - (event.clientY - rect.top) / rect.height) * 5);
            y(((event.clientX - rect.left) / rect.width - 0.5) * 7);
          };
          const reset = () => {
            x(0);
            y(0);
          };
          stage.addEventListener("pointermove", move);
          stage.addEventListener("pointerleave", reset);
          return () => {
            stage.removeEventListener("pointermove", move);
            stage.removeEventListener("pointerleave", reset);
          };
        },
      );
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div className="hero-scroll-shell" ref={root}>
      <section
        className={"immersive-landing-hero mood-" + mood.id}
        aria-label="Your wedding, beautifully shared"
        onKeyDown={(event) => {
          if (event.key === "Escape" && opened) {
            event.preventDefault();
            setOpened(false);
            root.current
              ?.querySelector<HTMLElement>(".suite-seal-control")
              ?.focus({ preventScroll: true });
          }
        }}
      >
        <div className="hero-ambient" aria-hidden="true">
          {moods.map((item, index) => (
            <img
              key={item.id}
              src={item.background}
              alt=""
              className={index === selected ? "is-active" : ""}
              fetchPriority={index === 0 ? "high" : "auto"}
              loading={index === 0 ? "eager" : "lazy"}
            />
          ))}
        </div>
        <div className="hero-atmosphere" aria-hidden="true" />
        <div className="hero-copy-depth">
          <div className="immersive-hero-copy">
            <p className="hero-dedication">
              For the day. For your people. Forever.
            </p>
            <h1>
              <span>Your entire wedding.</span>
              <em>Beautifully shared.</em>
            </h1>
            <p className="hero-description">
              An invitation they’ll feel.
              <br />A celebration they’ll never forget.
            </p>
            <div className="hero-actions">
              <Link href="/start" className="button light-button">
                Create your wedding <ArrowUpRightIcon size={17} />
              </Link>
              <Link
                href={"/demo/" + mood.id}
                prefetch={false}
                className="hero-explore"
              >
                Explore a wedding <ArrowRightIcon size={16} />
              </Link>
            </div>
            <div className="hero-reassurance">
              <CheckIcon size={13} />
              <span>No card required. Just the two of you.</span>
            </div>
          </div>
        </div>
        <div className="hero-art-stage">
          <div className="suite-pointer-plane">
            <div className="suite-photo-drift">
              <div className="suite-photo-layer">
                <figure className="suite-venue-photo">
                  <img
                    key={mood.photo}
                    src={mood.photo}
                    alt={mood.place + ", the setting for this sample wedding"}
                  />
                  <figcaption>{mood.place}</figcaption>
                </figure>
              </div>
            </div>
            <div className="suite-flower-drift">
              <div className="suite-flower-layer">
                <figure className="suite-flower-photo">
                  <img src="/images/wedding-details.webp" alt="" />
                  <figcaption>All the little things.</figcaption>
                </figure>
              </div>
            </div>
            <div className="suite-envelope-drift">
              <div className="suite-envelope-layer">
                <div
                  className={
                    "interactive-invitation" + (opened ? " is-open" : "")
                  }
                >
                  <div className="suite-envelope-back" aria-hidden="true" />
                  <div className="suite-paper-window">
                    <div
                      className="suite-invitation-paper"
                      id="hero-invitation-preview"
                      inert={!opened}
                      aria-hidden={!opened}
                    >
                      <p className="suite-letterline">{mood.line}</p>
                      <div className="suite-names">
                        <span>{mood.couple[0]}</span>
                        <i>&</i>
                        <span>{mood.couple[1]}</span>
                      </div>
                      <p className="suite-date">19 JUNE 2027</p>
                      <Link
                        href={"/demo/" + mood.id}
                        prefetch={false}
                        className="suite-visit"
                      >
                        Step inside <ArrowUpRightIcon size={15} />
                      </Link>
                    </div>
                  </div>
                  <div className="suite-envelope-pocket" aria-hidden="true">
                    <span>{mood.couple.join(" & ")}</span>
                    <small>You are joyfully invited</small>
                  </div>
                  <button
                    className="suite-seal-control"
                    disabled={!ready}
                    onClick={() => setOpened(!opened)}
                    aria-expanded={opened}
                    aria-controls="hero-invitation-preview"
                    aria-label={
                      opened
                        ? "Close the sample invitation"
                        : "Break the seal to open the sample invitation"
                    }
                  >
                    <span className="suite-flap" aria-hidden="true" />
                    <span className="suite-wax-seal" aria-hidden="true">
                      {mood.initials[0]}
                      <i>&</i>
                      {mood.initials[1]}
                    </span>
                  </button>
                  <span className="suite-seal-hint" aria-hidden="true">
                    {opened
                      ? "A little preview of forever."
                      : "Go on. Break the seal."}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-mood-picker">
          <div className="hero-mood-heading">
            <span>Every love has a feeling.</span>
            <small aria-live="polite">{mood.feeling}</small>
          </div>
          <div
            className="hero-mood-options"
            role="group"
            aria-label="Invitation mood"
          >
            {moods.map((item, index) => (
              <button
                key={item.id}
                onClick={() => setSelected(index)}
                aria-pressed={selected === index}
              >
                <span
                  className={"mood-swatch swatch-" + item.id}
                  aria-hidden="true"
                />
                {item.name}
              </button>
            ))}
          </div>
        </div>
        <div className="hero-scene-caption" aria-hidden="true">
          <span>A wedding, unfolding.</span>
          <span className="hero-scroll-track">
            <span className="hero-scroll-progress" />
          </span>
        </div>
      </section>
    </div>
  );
}
