"use client";

import { CheckIcon, EnvelopeSimpleIcon } from "@phosphor-icons/react";
import type { GuestData } from "@/lib/types";
import { formatDate } from "@/lib/worlds";
import GuestCrest from "./guest-crest";
import { Arrow } from "./ui";

export default function GuestReplyCard({
  data,
  locale,
  onReply,
}: {
  data: GuestData;
  locale: "en" | "es";
  onReply: () => void;
}) {
  const replied = data.responses.length > 0;
  const names = data.guests
    .map((guest) => guest.name.split(" ")[0])
    .join(" & ");
  return (
    <section
      className="rsvp-scene reply-scene"
      id="rsvp"
      aria-labelledby="reply-title"
    >
      <div className="reply-tabletop" aria-hidden="true">
        <img src="/images/wedding-details.webp" alt="" loading="lazy" />
      </div>
      <div className="reply-envelope" aria-hidden="true">
        <span>{data.wedding.names}</span>
      </div>
      <div className="rsvp-stationery reply-suite">
        <div className="reply-cover">
          <GuestCrest
            names={data.wedding.names}
            world={data.wedding.world}
            size={80}
          />
          <span className="reply-cover-title">R.S.V.P.</span>
          <div className="reply-hosts">
            <span>
              {locale === "en" ? "With love, from" : "Con todo nuestro cariño"}
            </span>
            <strong>{data.wedding.names}</strong>
          </div>
        </div>
        <div className="reply-letter">
          <div className="reply-addressee">
            <EnvelopeSimpleIcon size={20} aria-hidden="true" />
            <span>
              {locale === "en" ? "A little reply from" : "Una respuesta de"}
            </span>
          </div>
          <p className="reply-guest-names">{names}</p>
          <h2 id="reply-title">
            {replied
              ? locale === "en"
                ? "Your reply is with us."
                : "Tenemos tu respuesta."
              : locale === "en"
                ? "Will you join us?"
                : "¿Nos acompañas?"}
          </h2>
          {replied && (
            <p className="reply-saved">
              <CheckIcon size={17} aria-hidden="true" />
              {locale === "en"
                ? "Your household’s response is saved."
                : "Hemos guardado la respuesta de tu familia."}
            </p>
          )}
          <div className="reply-deadline">
            <span>
              {locale === "en" ? "Kindly reply by" : "Confirma antes del"}
            </span>
            <time dateTime={data.wedding.rsvp_deadline}>
              {formatDate(data.wedding.rsvp_deadline, locale, {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </time>
          </div>
          <button className="guest-button reply-action" onClick={onReply}>
            <span>
              {replied
                ? locale === "en"
                  ? "Update our response"
                  : "Actualizar nuestra respuesta"
                : locale === "en"
                  ? "Your RSVP"
                  : "Tu respuesta"}
            </span>
            <Arrow diagonal size={22} />
          </button>
          <p className="reply-footnote">
            {locale === "en"
              ? "Attendance, menu choices, and the little things we should know—all in one reply."
              : "Asistencia, menú y los pequeños detalles que debemos saber, en una sola respuesta."}
          </p>
        </div>
      </div>
      <div className="reply-bottom-note">
        <span>
          {locale === "en"
            ? "We can’t wait to hear from you."
            : "Nos hará ilusión saber de ti."}
        </span>
        <span>{data.wedding.location}</span>
      </div>
    </section>
  );
}
