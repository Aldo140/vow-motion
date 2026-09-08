"use client";

import {
  ArrowDownIcon,
  ArrowCounterClockwiseIcon,
  CalendarBlankIcon,
} from "@phosphor-icons/react";
import type { GuestData } from "@/lib/types";
import { formatDate, getWorld } from "@/lib/worlds";
import GuestKeepsake from "./guest-keepsake";

export default function GuestInvitationHero({
  data,
  locale,
  onReplay,
}: {
  data: GuestData;
  locale: "en" | "es";
  onReplay: () => void;
}) {
  const world = getWorld(data.wedding.world),
    voice = world.voice[locale];
  const names = data.wedding.names.split(" & ");
  const firstEvent = [...data.events].sort(
    (a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at),
  )[0];
  const calendar = locale === "en" ? "Add to calendar" : "Añadir al calendario";
  return (
    <section
      className="guest-hero atelier-invitation"
      aria-label={
        locale === "en" ? "Your personal invitation" : "Tu invitación personal"
      }
    >
      <div className="atelier-heading">
        <span>
          {locale === "en"
            ? "The pleasure of your company"
            : "La alegría de tenerte cerca"}
        </span>
        <button className="invitation-replay" onClick={onReplay}>
          <ArrowCounterClockwiseIcon size={15} aria-hidden="true" />
          {locale === "en" ? "Replay invitation" : "Repetir invitación"}
        </button>
      </div>
      <div className="hero-depth-scene atelier-suite">
        <div className="guest-hero-title atelier-letter">
          <div className="atelier-vellum" aria-hidden="true" />
          <span className="guest-hero-kicker">
            {data.wedding.status === "memories"
              ? locale === "en"
                ? "Just married"
                : "Recién casados"
              : voice.kicker}
          </span>
          <h1 tabIndex={-1}>
            <span>{names[0]}</span>
            {names[1] && (
              <>
                <i>{world.separator}</i>
                <span>{names.slice(1).join(" & ")}</span>
              </>
            )}
          </h1>
          <p className="atelier-invitation-line">
            {data.wedding.status === "memories"
              ? locale === "en"
                ? "A day we will always carry with us."
                : "Un día que siempre llevaremos con nosotros."
              : voice.invite}
          </p>
          <div className="atelier-letter-date">
            <span>
              {formatDate(data.wedding.date, locale, {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span>{data.wedding.location}</span>
          </div>
        </div>
        <div className="hero-image-frame">
          <div className="guest-hero-photo">
            <img
              src={world.image}
              alt={`${data.wedding.location}, ${locale === "en" ? "the setting for our celebration" : "el lugar de nuestra celebración"}`}
              fetchPriority="high"
            />
          </div>
          <div className="atelier-photo-caption" aria-hidden="true">
            <span>{data.wedding.location}</span>
            <span>{locale === "en" ? "Meet us here." : "Nos vemos aquí."}</span>
          </div>
        </div>
        {/* Each world prints its own ornament: silk for the photographic
            worlds, a drawn sprig for the botanical ones, nothing at all for
            Modernist. All three share the class the scroll motion moves. */}
        {world.ornament === "silk" && (
          <img
            className="atelier-silk"
            src="/images/invitation-silk.webp"
            width={620}
            height={930}
            alt=""
            aria-hidden="true"
            decoding="async"
            draggable={false}
          />
        )}
        {world.ornament === "sprig" && (
          <svg
            className="atelier-silk atelier-sprig"
            viewBox="0 0 220 340"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <g
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              fill="none"
            >
              <path d="M150 8c-24 44-44 96-52 150-8 54-4 116 14 174" />
              {[
                [40, -34, -18],
                [78, 36, 20],
                [116, -40, -14],
                [154, 38, 16],
                [196, -34, -10],
                [238, 32, 14],
                [278, -26, -8],
              ].map(([y, dx, dy]) => (
                <path
                  key={y}
                  d={`M${132 - (y - 40) * 0.16} ${y}c${dx} ${dy} ${dx * 1.25} ${
                    dy + 26
                  } ${dx * 0.5} ${dy + 44}c-${Math.abs(dx) * 0.55} -${
                    12 + dy * 0.2
                  } -${Math.abs(dx) * 0.3} -${30 + dy * 0.2} 0 -${dy + 44}Z`}
                />
              ))}
            </g>
          </svg>
        )}
        <a
          className="date-keepsake"
          href={"/api/guest/calendar?token=" + data.token}
          aria-label={calendar}
        >
          <span className="date-keepsake-script">
            {locale === "en" ? "Save the date" : "Reserva la fecha"}
          </span>
          <strong>
            {formatDate(data.wedding.date, locale, { day: "2-digit" })}
          </strong>
          <span className="date-keepsake-month">
            {formatDate(data.wedding.date, locale, {
              month: "long",
              year: "numeric",
            })}
          </span>
          <span className="date-keepsake-action">
            <CalendarBlankIcon size={15} aria-hidden="true" />
            {calendar}
          </span>
        </a>
        <GuestKeepsake event={firstEvent} locale={locale} />
        <span className="hero-medallion" aria-hidden="true">
          <span>{names.map((name) => name[0]).join(" & ")}</span>
          <small>{locale === "en" ? "with love" : "con amor"}</small>
        </span>
      </div>
      <div className="guest-hero-footer">
        <span className="hero-personal-note">
          {locale === "en" ? "A place here, just for " : "Un lugar aquí para "}
          {data.guests.map((guest) => guest.name.split(" ")[0]).join(" & ")}.
        </span>
        <a
          href="#story"
          className="atelier-story-link"
          aria-label={locale === "en" ? "Read our story" : "Nuestra historia"}
        >
          <span>
            {locale === "en"
              ? "A little love letter"
              : "Una pequeña carta de amor"}
          </span>
          <ArrowDownIcon size={19} aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
