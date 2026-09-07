"use client";

import { useEffect, useState } from "react";

// The wait, counted. The digits tick for everyone; the reading for assistive
// technology is a single settled sentence rather than a stream of seconds.
export default function GuestCountdown({
  target,
  locale,
  married,
}: {
  target: string;
  locale: "en" | "es";
  married: boolean;
}) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const to = Date.parse(target);
  // Render nothing until the client knows the time, so the server and the
  // first paint agree and the number never flickers a wrong value.
  if (now === null || Number.isNaN(to)) return null;

  const remaining = to - now;
  if (married || remaining <= 0)
    return (
      <p className="countdown-past">
        {locale === "en" ? "We are married." : "Ya nos casamos."}
      </p>
    );

  const seconds = Math.floor(remaining / 1000),
    parts = [
      [Math.floor(seconds / 86400), locale === "en" ? "days" : "días"],
      [Math.floor(seconds / 3600) % 24, locale === "en" ? "hours" : "horas"],
      [Math.floor(seconds / 60) % 60, locale === "en" ? "minutes" : "minutos"],
      [seconds % 60, locale === "en" ? "seconds" : "segundos"],
    ] as [number, string][];

  return (
    <div className="guest-countdown">
      <span className="countdown-label">
        {locale === "en" ? "Until we do" : "Hasta el gran día"}
      </span>
      <p className="countdown-figures" aria-hidden="true">
        {parts.map(([value, label], index) => (
          <span key={label}>
            <b>{String(value).padStart(2, "0")}</b>
            <small>{label}</small>
            {index < parts.length - 1 && <i aria-hidden="true">·</i>}
          </span>
        ))}
      </p>
      <p className="sr-only">
        {locale === "en"
          ? `${parts[0][0]} days until the wedding.`
          : `Faltan ${parts[0][0]} días para la boda.`}
      </p>
    </div>
  );
}
