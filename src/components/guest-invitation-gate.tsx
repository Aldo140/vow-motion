"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import type { GuestData } from "@/lib/types";
import { formatDate, getWorld } from "@/lib/worlds";
import { Arrow } from "./ui";
import { weddingIdentity } from "@/lib/identity";
import { useHydrated } from "./use-hydrated";

gsap.registerPlugin(useGSAP);

export default function GuestInvitationGate({
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
  const hydrated = useHydrated();
  const opening = useRef(false);
  const [busy, setBusy] = useState(false);
  const world = getWorld(data.wedding.world),
    voice = world.voice[locale];
  const initials =
    weddingIdentity(data.wedding.settings).monogram ||
    data.wedding.names
      .split(" & ")
      .map((name) => name[0])
      .join(" & ");
  const { contextSafe } = useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
        () => {
          const suite = root.current?.querySelector<HTMLElement>(
            ".envelope-composition",
          );
          if (!suite) return;
          const tilt = gsap.quickTo(suite, "rotationY", {
            duration: 0.6,
            ease: "power3.out",
          });
          const move = (event: PointerEvent) => {
            if (opening.current) return;
            const box = suite.getBoundingClientRect();
            tilt(((event.clientX - box.left) / box.width - 0.5) * 5);
          };
          const reset = () => tilt(0);
          suite.addEventListener("pointermove", move);
          suite.addEventListener("pointerleave", reset);
          return () => {
            suite.removeEventListener("pointermove", move);
            suite.removeEventListener("pointerleave", reset);
          };
        },
      );
      return () => mm.revert();
    },
    { scope: root },
  );

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
    gsap
      .timeline({ defaults: { ease: "power3.out" }, onComplete: onOpen })
      .to(".envelope-open", { scale: 0.92, opacity: 0, duration: 0.16 }, 0)
      .to(".envelope-flap", { rotationX: -175, duration: 0.42 }, 0.06)
      .to(".envelope-letter", { y: -75, rotation: -2, duration: 0.5 }, 0.18)
      .to(
        ".envelope-photograph",
        { x: -25, rotation: -15, duration: 0.5 },
        0.12,
      )
      .to(".envelope-composition", { y: 25, opacity: 0, duration: 0.2 }, 0.48);
  });

  return (
    <main id="main" ref={root} className="invitation-gate crafted-opening">
      <img
        className="gate-background"
        src={world.image}
        alt=""
        fetchPriority="high"
      />
      <div className="gate-top">
        <Link href="/">VOW MOTION</Link>
        <button
          disabled={!hydrated}
          onClick={onLocaleChange}
          aria-label={locale === "en" ? "Ver en español" : "View in English"}
        >
          {locale === "en" ? "ES" : "EN"}
        </button>
      </div>
      <p className="opening-dedication">{voice.arrival}</p>
      <div className="envelope-composition">
        <figure className="envelope-photograph" aria-hidden="true">
          <img src={world.image} alt="" />
          <figcaption>{data.wedding.location}</figcaption>
        </figure>
        <div className="invitation-envelope">
          <div className="envelope-liner" aria-hidden="true" />
          <div className="envelope-letter">
            <span>{voice.kicker}</span>
            <h1>{data.wedding.names}</h1>
            <p>{formatDate(data.wedding.date, locale)}</p>
            <small>{data.wedding.location}</small>
          </div>
          <div className="envelope-pocket" aria-hidden="true" />
          <div className="envelope-flap" aria-hidden="true" />
          <button
            className="envelope-open"
            onClick={(event) => open(event.detail !== 0)}
            disabled={busy || !hydrated}
            aria-label={
              locale === "en" ? "Open your invitation" : "Abre tu invitación"
            }
          >
            <span className="opening-wax-seal" aria-hidden="true">
              {initials}
            </span>
            <span>
              {locale === "en" ? "Open your invitation" : "Abre tu invitación"}
              <Arrow size={16} />
            </span>
          </button>
          <div className="envelope-address">
            <span>
              {locale === "en" ? "Handpicked for" : "Con cariño, para"}
            </span>
            <p>
              {data.guests.map((guest) => guest.name.split(" ")[0]).join(" & ")}
            </p>
          </div>
        </div>
      </div>
      <p className="opening-postscript">{voice.closing}</p>
      <small className="gate-bottom">
        {world.name.toUpperCase()} · VOW MOTION
      </small>
    </main>
  );
}
