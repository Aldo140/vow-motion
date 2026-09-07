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
  const world = getWorld(data.wedding.world);
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
          {locale === "en"
            ? "Open the envelope again"
            : "Volver a abrir el sobre"}
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
              : locale === "en"
                ? "Together with our families"
                : "Junto con nuestras familias"}
          </span>
          <h1 tabIndex={-1}>
            <span>{names[0]}</span>
            {names[1] && (
              <>
                <i>&</i>
                <span>{names.slice(1).join(" & ")}</span>
              </>
            )}
          </h1>
          <p className="atelier-invitation-line">
            {data.wedding.status === "memories"
              ? locale === "en"
                ? "A day we will always carry with us."
                : "Un día que siempre llevaremos con nosotros."
              : locale === "en"
                ? "would love you to join us\nas we begin our forever."
                : "nos encantaría que nos acompañaras\nen el comienzo de nuestro para siempre."}
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
