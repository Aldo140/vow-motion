"use client";

import { CalendarBlankIcon, MapPinIcon } from "@phosphor-icons/react";
import type { GuestData } from "@/lib/types";
import { eventTime, formatDate, getWorld } from "@/lib/worlds";
import { Arrow, Modal } from "./ui";

export default function GuestWeddingPass({
  data,
  locale,
  onClose,
}: {
  data: GuestData;
  locale: "en" | "es";
  onClose: () => void;
}) {
  const events = [...data.events].sort(
    (a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at),
  );
  return (
    <Modal
      title={locale === "en" ? "Your wedding pass" : "Tu pase de boda"}
      onClose={onClose}
      className="guest-paper-dialog pass-dialog"
    >
      <div className="wedding-pass guest-day-pass">
        <div className="day-pass-cover">
          <img src={getWorld(data.wedding.world).image} alt="" />
          <span>
            {locale === "en"
              ? "All the lovely details. One little pass."
              : "Todos los detalles en un pequeño pase."}
          </span>
        </div>
        <div className="day-pass-ticket">
          <div>
            <span>{formatDate(data.wedding.date, locale)}</span>
            <h2>{data.wedding.names}</h2>
            <p>{data.wedding.location}</p>
          </div>
          <img
            className="pass-qr"
            width={104}
            height={104}
            src={"/api/guest/qr?token=" + data.token}
            alt={
              locale === "en"
                ? "Your private invitation QR code"
                : "Código QR de tu invitación privada"
            }
          />
        </div>
        <div className="day-pass-guests">
          <span>{locale === "en" ? "Reserved for" : "Reservado para"}</span>
          {data.guests.map((guest) => (
            <div key={guest.id}>
              <strong>{guest.name}</strong>
              <span>
                {guest.table_name ||
                  (locale === "en"
                    ? "Table to be announced"
                    : "Mesa por confirmar")}
              </span>
            </div>
          ))}
        </div>
        <div className="day-pass-itinerary">
          <h3>
            {locale === "en"
              ? "Your celebration, at a glance."
              : "Tu celebración, de un vistazo."}
          </h3>
          {events.map((event) => {
            const zone = new Intl.DateTimeFormat(
              locale === "es" ? "es-ES" : "en-GB",
              { timeZone: event.timezone, timeZoneName: "short" },
            )
              .formatToParts(new Date(event.starts_at))
              .find((part) => part.type === "timeZoneName")?.value;
            return (
              <article className="day-pass-event" key={event.id}>
                <div className="day-pass-time">
                  <time dateTime={event.starts_at}>
                    <span>
                      {formatDate(event.starts_at, locale, {
                        timeZone: event.timezone,
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    <strong>
                      {eventTime(event.starts_at, event.timezone, locale)}
                    </strong>
                    <small>{zone}</small>
                  </time>
                </div>
                <div>
                  <h4>
                    {locale === "es" && event.title_es
                      ? event.title_es
                      : event.title}
                  </h4>
                  <p>{event.venue}</p>
                  {event.dress_code && (
                    <p className="day-pass-dress">
                      <span>{locale === "en" ? "Dress" : "Vestimenta"}</span>
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
                      aria-label={
                        (locale === "en"
                          ? "Directions to "
                          : "Cómo llegar a ") + (event.venue || event.title)
                      }
                    >
                      <MapPinIcon size={16} />
                      {locale === "en" ? "Directions" : "Cómo llegar"}
                      <Arrow diagonal size={14} />
                    </a>
                  )}
                </div>
              </article>
            );
          })}
          {!events.length && (
            <p>
              {locale === "en"
                ? "Your hosts will share the schedule here."
                : "Los anfitriones compartirán el programa aquí."}
            </p>
          )}
        </div>
        <a
          className="button primary"
          href={"/api/guest/calendar?token=" + data.token}
        >
          <CalendarBlankIcon size={18} />
          {locale === "en" ? "Add to calendar" : "Añadir al calendario"}
          <Arrow size={17} />
        </a>
        <small>
          {locale === "en"
            ? "Keep this pass private. Save this invitation to your home screen from your browser’s share menu."
            : "Mantén este pase privado. Guarda esta invitación en tu pantalla de inicio desde el menú de tu navegador."}
        </small>
      </div>
    </Modal>
  );
}
