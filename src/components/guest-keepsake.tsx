"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  ArrowCounterClockwiseIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react";
import type { Event } from "@/lib/types";
import { eventTime, formatDate } from "@/lib/worlds";

export default function GuestKeepsake({
  event,
  locale,
}: {
  event?: Event;
  locale: "en" | "es";
}) {
  const [turned, setTurned] = useState(false);
  const front = useRef<HTMLButtonElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  const didTurn = useRef(false);
  const id = useId();
  useEffect(() => {
    if (!didTurn.current) return;
    (turned ? back : front).current?.focus({ preventScroll: true });
  }, [turned]);
  const turn = (value: boolean) => {
    didTurn.current = true;
    setTurned(value);
  };
  return (
    <div
      className="hero-flower-study useful-keepsake"
      onKeyDown={(event) => {
        if (event.key === "Escape" && turned) {
          event.preventDefault();
          turn(false);
        }
      }}
    >
      <div className="keepsake-turn" data-turned={turned}>
        <button
          ref={front}
          className="keepsake-face keepsake-front"
          onClick={() => turn(true)}
          aria-label={
            locale === "en"
              ? "Turn the keepsake over for your first gathering"
              : "Gira el recuerdo para ver el primer encuentro"
          }
          aria-expanded={turned}
          aria-controls={id}
          inert={turned}
          aria-hidden={turned}
        >
          <img src="/images/wedding-details.webp" alt="" />
          <span>
            {locale === "en" ? "A little detail for you" : "Un detalle para ti"}
            <ArrowCounterClockwiseIcon size={14} />
          </span>
        </button>
        <div
          className="keepsake-face keepsake-back"
          id={id}
          inert={!turned}
          aria-hidden={!turned}
        >
          <button
            ref={back}
            onClick={() => turn(false)}
            aria-label={
              locale === "en"
                ? "Turn the keepsake back"
                : "Vuelve a girar el recuerdo"
            }
          >
            <ArrowCounterClockwiseIcon size={16} />
          </button>
          <div>
            <span>
              {locale === "en" ? "Your first gathering" : "El primer encuentro"}
            </span>
            {event ? (
              <>
                <strong>
                  {eventTime(event.starts_at, event.timezone, locale)}
                </strong>
                <time dateTime={event.starts_at}>
                  {formatDate(event.starts_at, locale, {
                    timeZone: event.timezone,
                    day: "numeric",
                    month: "short",
                  })}
                </time>
                <p>
                  {event.venue ||
                    (locale === "es" && event.title_es
                      ? event.title_es
                      : event.title)}
                </p>
              </>
            ) : (
              <p>
                {locale === "en"
                  ? "Your hosts will share the plans here."
                  : "Los anfitriones compartirán los planes aquí."}
              </p>
            )}
          </div>
          <a
            href="#programme"
            onClick={() =>
              document
                .getElementById("programme")
                ?.focus({ preventScroll: true })
            }
          >
            {locale === "en" ? "See the plans" : "Ver los planes"}
            <ArrowRightIcon size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}
