"use client";

import { useId, useRef } from "react";
import { ListIcon, ArrowUpRightIcon } from "@phosphor-icons/react";

export default function GuestNavigation({
  names,
  location,
  locale,
  hasFaqs = false,
  onLocale,
  onRsvp,
  onPass,
  onContact,
}: {
  names: string;
  location: string;
  locale: "en" | "es";
  hasFaqs?: boolean;
  onLocale: () => void;
  onRsvp: () => void;
  onPass: () => void;
  onContact: () => void;
}) {
  const id = useId();
  const card = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = () => card.current?.hidePopover();
  const action = (callback: () => void) => {
    close();
    trigger.current?.focus({ preventScroll: true });
    callback();
  };
  return (
    <header className="guest-nav invitation-navigation">
      <button
        ref={trigger}
        className="guest-monogram invitation-menu-trigger"
        popoverTarget={id}
        aria-label={
          locale === "en" ? "Invitation contents" : "Contenido de la invitación"
        }
      >
        <span>
          {names
            .split(" & ")
            .map((name) => name.trim()[0])
            .join(" & ")}
        </span>
        <ListIcon size={15} aria-hidden="true" />
      </button>
      <span className="invitation-nav-location">{location}</span>
      <button
        className="language-switch"
        onClick={onLocale}
        aria-label={locale === "en" ? "Ver en español" : "View in English"}
      >
        {locale === "en" ? "ES" : "EN"}
      </button>
      <div id={id} popover="auto" ref={card} className="invitation-contents">
        <p>{names}</p>
        <nav aria-label={locale === "en" ? "Your invitation" : "Tu invitación"}>
          {[
            ["main", locale === "en" ? "The invitation" : "La invitación"],
            [
              "programme",
              locale === "en" ? "The celebration" : "La celebración",
            ],
            [
              "travel",
              locale === "en" ? "Travel & stay" : "Viaje y alojamiento",
            ],
            // Only offered when the couple has actually answered something.
            ...(hasFaqs
              ? [
                  ["faqs", locale === "en" ? "Questions" : "Preguntas"] as [
                    string,
                    string,
                  ],
                ]
              : []),
          ].map(([target, label]) => (
            <a
              key={target}
              href={"#" + target}
              onClick={() => {
                close();
                requestAnimationFrame(() => {
                  const destination = document.getElementById(target);
                  if (destination) {
                    destination.tabIndex = -1;
                    destination.focus({ preventScroll: true });
                  }
                });
              }}
            >
              {label}
              <ArrowUpRightIcon size={17} aria-hidden="true" />
            </a>
          ))}
          <button onClick={() => action(onRsvp)}>
            {locale === "en" ? "Your RSVP" : "Tu respuesta"}
            <ArrowUpRightIcon size={17} aria-hidden="true" />
          </button>
          <button onClick={() => action(onPass)}>
            {locale === "en" ? "Your wedding pass" : "Tu pase de boda"}
            <ArrowUpRightIcon size={17} aria-hidden="true" />
          </button>
          <button onClick={() => action(onContact)}>
            {locale === "en"
              ? "Contact & wedding updates"
              : "Contacto y novedades"}
            <ArrowUpRightIcon size={17} aria-hidden="true" />
          </button>
        </nav>
        <small>
          {locale === "en"
            ? "Everything for your time with us."
            : "Todo para celebrar con nosotros."}
        </small>
      </div>
    </header>
  );
}
