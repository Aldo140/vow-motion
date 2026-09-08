"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import type { GuestData } from "@/lib/types";
import { formatDate, getWorld } from "@/lib/worlds";

gsap.registerPlugin(useGSAP);

// The sealed opening. Where the crafted envelope lays a suite out on a table,
// this one puts a single pressed envelope in the guest's hand: the paper is
// printed with a botanical repeat drawn in the world's own ink, and the only
// thing to do is break the seal.
export default function GuestSealGate({
  data,
  locale,
  onLocaleChange,
  onOpen,
}: {
  data: GuestData;
  locale: "en" | "es";
  onLocaleChange: () => void;
  onOpen: () => void;
}) {
  const root = useRef<HTMLElement>(null);
  const opening = useRef(false);
  const [busy, setBusy] = useState(false);
  const patternId = useId();
  const world = getWorld(data.wedding.world),
    voice = world.voice[locale];
  const initials = data.wedding.names
    .split(" & ")
    .map((name) => name.trim()[0])
    .filter(Boolean)
    .join("");

  const { contextSafe } = useGSAP(() => {}, { scope: root });

  const open = contextSafe((animate: boolean) => {
    if (opening.current) return;
    opening.current = true;
    setBusy(true);
    if (
      !animate ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      onOpen();
      return;
    }
    // The seal breaks, the flap falls open, the card rises out.
    gsap
      .timeline({ defaults: { ease: "power3.out" }, onComplete: onOpen })
      .to(".seal-wax", { scale: 1.08, duration: 0.12 }, 0)
      .to(
        ".seal-wax",
        { y: 26, rotation: -18, opacity: 0, duration: 0.45 },
        0.12,
      )
      .to(".seal-flap", { rotationX: -168, duration: 0.5 }, 0.2)
      .to(".seal-card", { y: -92, duration: 0.55 }, 0.34)
      .to(".seal-envelope", { y: 30, opacity: 0, duration: 0.24 }, 0.62);
  });

  return (
    <main id="main" ref={root} className="invitation-gate sealed-opening">
      <img
        className="gate-background"
        src={world.image}
        alt=""
        fetchPriority="high"
      />
      <div className="gate-top">
        <Link href="/">VOW MOTION</Link>
        <button
          onClick={onLocaleChange}
          aria-label={locale === "en" ? "Ver en español" : "View in English"}
        >
          {locale === "en" ? "ES" : "EN"}
        </button>
      </div>

      <p className="opening-dedication">{voice.arrival}</p>

      <div className="seal-envelope">
        {/* The botanical repeat is drawn rather than photographed, so every
            world prints the same paper in its own ink. */}
        <svg className="seal-pattern" aria-hidden="true" focusable="false">
          <defs>
            <pattern
              id={patternId}
              width="58"
              height="82"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(-8)"
            >
              <g
                fill="none"
                stroke="currentColor"
                strokeWidth="1.1"
                strokeLinecap="round"
              >
                <path d="M29 12c0 14-7 22-7 34s7 16 7 24" />
                <path d="M29 22c-6-3-11-1-13 4 5 3 10 2 13-4Z" />
                <path d="M29 22c6-3 11-1 13 4-5 3-10 2-13-4Z" />
                <path d="M29 40c-6-3-11-1-13 4 5 3 10 2 13-4Z" />
                <path d="M29 40c6-3 11-1 13 4-5 3-10 2-13-4Z" />
                <circle cx="29" cy="62" r="2.4" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        </svg>

        <div className="seal-flap" aria-hidden="true">
          <svg className="seal-pattern" aria-hidden="true" focusable="false">
            <rect width="100%" height="100%" fill={`url(#${patternId})`} />
          </svg>
        </div>

        <button
          className="envelope-open seal-break"
          onClick={(event) => open(event.detail !== 0)}
          disabled={busy}
          aria-label={
            locale === "en" ? "Open your invitation" : "Abre tu invitación"
          }
        >
          <span className="seal-wax" aria-hidden="true">
            <i>{initials}</i>
          </span>
          <span className="seal-instruction" aria-hidden="true">
            {locale === "en" ? "Break the seal" : "Rompe el sello"}
          </span>
        </button>

        <div className="seal-card">
          <span>{voice.kicker}</span>
          <h1>{data.wedding.names}</h1>
          <p>{formatDate(data.wedding.date, locale)}</p>
          <small>{data.wedding.location}</small>
        </div>

        <p className="seal-script" aria-hidden="true">
          {voice.script}
        </p>

        {/* The envelope is addressed, so the household's names sit on the
            paper rather than over the photograph behind it. */}
        <div className="seal-address">
          <span>{locale === "en" ? "Handpicked for" : "Con cariño, para"}</span>
          <p>
            {data.guests.map((guest) => guest.name.split(" ")[0]).join(" & ")}
          </p>
        </div>
      </div>

      <small className="gate-bottom">
        {world.name.toUpperCase()} · VOW MOTION
      </small>
    </main>
  );
}
