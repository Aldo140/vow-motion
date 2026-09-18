"use client";
import type { GuestData } from "@/lib/types";
import { eventTime, formatDate } from "@/lib/worlds";
import { CalendarBlankIcon, MapPinIcon } from "@phosphor-icons/react";
import { isPlaceholderGuestName } from "@/lib/momentum";
import Link from "next/link";
import { useMemo } from "react";
import { CheckIcon } from "@phosphor-icons/react";
import GuestCountdown from "./guest-countdown";
import GuestRequests from "./guest-requests";
import { Arrow } from "./ui";

/**
 * A calm, text-first alternative to the animated invitation. Same data, same
 * actions (RSVP, schedule, travel, contact) — no parallax, no opening
 * envelope, larger type throughout. Reached by choice, from the immersive
 * gate or the guest menu, and remembered per browser.
 */
export default function GuestSimpleView({
  data,
  locale,
  onLocale,
  onImmersive,
  onRsvp,
  onPass,
  onContact,
  refresh,
}: {
  data: GuestData;
  locale: "en" | "es";
  onLocale: () => void;
  onImmersive: () => void;
  onRsvp: () => void;
  onPass: () => void;
  onContact: () => void;
  refresh: () => Promise<void>;
}) {
  const events = useMemo(
    () =>
      [...data.events].sort(
        (a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at),
      ),
    [data.events],
  );
  return (
    <div className="guest-simple-view" lang={locale}>
      <header className="simple-header">
        <Link href="/" className="simple-wordmark">
          VOW MOTION
        </Link>
        <div className="simple-header-actions">
          <button onClick={onLocale}>
            {locale === "en" ? "ES" : "EN"}
          </button>
          <button onClick={onImmersive}>
            {locale === "en" ? "Full experience" : "Experiencia completa"}
          </button>
        </div>
      </header>
      <main id="main">
        <section className="simple-intro">
          <span>
            {locale === "en"
              ? "Together with our families"
              : "Junto con nuestras familias"}
          </span>
          <h1>{data.wedding.names}</h1>
          <p>
            {formatDate(data.wedding.date, locale)} · {data.wedding.location}
          </p>
          <p className="simple-addressed-to">
            {locale === "en" ? "Reserved for " : "Reservado para "}
            {data.guests
              .map((g) => {
                const name =
                  g.is_plus_one && isPlaceholderGuestName(g.name)
                    ? locale === "en"
                      ? "your guest"
                      : "tu invitado"
                    : g.name;
                return (
                  name +
                  (g.is_child ? (locale === "en" ? " (child)" : " (niño/a)") : "")
                );
              })
              .join(", ")}
          </p>
          <GuestCountdown
            target={events[0]?.starts_at || data.wedding.date}
            locale={locale}
            married={data.wedding.status === "memories"}
          />
        </section>
        <section
          className="simple-schedule"
          aria-label={locale === "en" ? "Schedule" : "Programa"}
        >
          <h2>{locale === "en" ? "The schedule" : "El programa"}</h2>
          <a
            href={"/api/guest/calendar?token=" + data.token}
            className="guest-text-link"
          >
            <CalendarBlankIcon size={17} />
            {locale === "en" ? "Add to calendar" : "Añadir al calendario"}
          </a>
          <ol className="simple-events">
            {events.map((event) => (
              <li key={event.id}>
                <time dateTime={event.starts_at}>
                  {formatDate(event.starts_at, locale, {
                    timeZone: event.timezone,
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                  {" · "}
                  {eventTime(event.starts_at, event.timezone, locale)}
                </time>
                <h3>
                  {locale === "es" && event.title_es
                    ? event.title_es
                    : event.title}
                </h3>
                {event.venue && <p>{event.venue}</p>}
                {event.description && <p>{event.description}</p>}
                {event.dress_code && (
                  <p className="simple-dress">
                    <span>{locale === "en" ? "Dress code" : "Vestimenta"}</span>
                    {event.dress_code}
                  </p>
                )}
                {(event.venue || event.address) && (
                  <a
                    href={
                      "https://www.google.com/maps/search/?api=1&query=" +
                      encodeURIComponent(event.venue + " " + event.address)
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="guest-text-link"
                  >
                    <MapPinIcon size={16} />
                    {locale === "en" ? "Directions" : "Cómo llegar"}
                    <Arrow diagonal size={14} />
                  </a>
                )}
              </li>
            ))}
            {!events.length && (
              <p>
                {locale === "en"
                  ? "Your hosts will share the schedule here."
                  : "Los anfitriones compartirán el programa aquí."}
              </p>
            )}
          </ol>
          <button className="button outline small" onClick={onPass}>
            {locale === "en" ? "Open your wedding pass" : "Abre tu pase de boda"}
            <Arrow size={15} />
          </button>
        </section>
        {data.travel.length > 0 && (
          <section
            className="simple-travel"
            aria-label={locale === "en" ? "Travel & stay" : "Viaje y alojamiento"}
          >
            <h2>{locale === "en" ? "Travel & stay" : "Viaje y alojamiento"}</h2>
            {data.travel.map((t) => (
              <article key={t.id}>
                <h3>{t.title}</h3>
                <p>{t.description}</p>
                {t.price && <small>{t.price}</small>}
                <a
                  href={
                    t.url ||
                    "https://www.google.com/maps/search/?api=1&query=" +
                      encodeURIComponent(t.address)
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="guest-text-link"
                >
                  {t.type === "hotel"
                    ? locale === "en"
                      ? "Find your stay"
                      : "Encuentra alojamiento"
                    : locale === "en"
                      ? "Find your way"
                      : "Cómo llegar"}
                  <Arrow diagonal size={14} />
                </a>
              </article>
            ))}
          </section>
        )}
        <section className="simple-rsvp" aria-labelledby="simple-rsvp-title">
          <h2 id="simple-rsvp-title">
            {data.responses.length
              ? locale === "en"
                ? "Your reply is with us."
                : "Tenemos tu respuesta."
              : locale === "en"
                ? "Will you join us?"
                : "¿Nos acompañas?"}
          </h2>
          {data.responses.length > 0 && (
            <p className="simple-rsvp-saved">
              <CheckIcon size={16} aria-hidden="true" />
              {locale === "en"
                ? "Your household’s response is saved."
                : "Hemos guardado la respuesta de tu familia."}
            </p>
          )}
          <p>
            {locale === "en" ? "Kindly reply by " : "Confirma antes del "}
            {formatDate(data.wedding.rsvp_deadline, locale, {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <button className="button primary" onClick={onRsvp}>
            {data.responses.length
              ? locale === "en"
                ? "Update our response"
                : "Actualizar nuestra respuesta"
              : locale === "en"
                ? "Your RSVP"
                : "Tu respuesta"}
            <Arrow size={16} />
          </button>
        </section>
        {!!data.faqs?.length && (
          <section
            className="simple-faqs"
            aria-label={locale === "en" ? "Questions" : "Preguntas"}
          >
            <h2>
              {locale === "en" ? "You might be wondering" : "Quizá te preguntes"}
            </h2>
            <ul>
              {data.faqs.map((faq) => (
                <li key={faq.id}>
                  <details>
                    <summary>
                      {locale === "es" && faq.question_es
                        ? faq.question_es
                        : faq.question}
                    </summary>
                    <p>
                      {locale === "es" && faq.answer_es
                        ? faq.answer_es
                        : faq.answer}
                    </p>
                  </details>
                </li>
              ))}
            </ul>
          </section>
        )}
        {data.registry.length > 0 && (
          <section
            className="simple-registry"
            aria-label={locale === "en" ? "Gift registry" : "Lista de regalos"}
          >
            <h2>
              {locale === "en" ? "Your presence is the present." : "Tu presencia es nuestro regalo."}
            </h2>
            {data.registry.map((r) => (
              <a
                className="guest-text-link"
                href={r.url}
                key={r.id}
                target="_blank"
                rel="noreferrer"
              >
                {r.title}
                <Arrow diagonal size={14} />
              </a>
            ))}
          </section>
        )}
        <GuestRequests data={data} locale={locale} refresh={refresh} />
        <section className="simple-contact">
          <button className="button primary" onClick={onContact}>
            {locale === "en"
              ? "Contact & wedding updates"
              : "Contacto y novedades"}
          </button>
        </section>
      </main>
      <footer className="simple-footer">
        <p>
          {locale === "en"
            ? "Using this simple view keeps everything you need, without the animation."
            : "Esta vista sencilla conserva todo lo que necesitas, sin las animaciones."}{" "}
          <button className="guest-text-link" onClick={onImmersive}>
            {locale === "en" ? "Try the full experience" : "Prueba la experiencia completa"}
          </button>
        </p>
      </footer>
    </div>
  );
}
