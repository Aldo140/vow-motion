"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  CalendarPlusIcon,
  NavigationArrowIcon,
} from "@phosphor-icons/react";
import type { FinderConfig } from "@/lib/finder";
import type { World } from "@/lib/types";
import GuestCrest from "./guest-crest";

type Event = {
  id: string;
  title: string;
  title_es: string;
  starts_at: string;
  venue: string;
  address: string;
  dress_code: string;
};

/** A maps link that opens whatever the guest already has installed. */
const directionsHref = (query: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

// A small confetti pop for the moment a seat is found — ten pieces flung out
// at even angles, computed once (pure math, so server and client render the
// exact same values — no hydration mismatch from Math.random).
const CONFETTI = Array.from({ length: 10 }, (_, i) => {
  const angle = (i / 10) * Math.PI * 2;
  const dist = 22 + (i % 3) * 7;
  return {
    x: Math.round(Math.cos(angle) * dist),
    y: Math.round(Math.sin(angle) * dist),
    rot: (i * 53) % 360,
    delay: (i % 4) * 0.03,
    tone: i % 3,
  };
});
type Result =
  | { found: false; ambiguous?: boolean }
  | {
      found: true;
      first_name: string;
      table: string | null;
      meal: string;
      tablemates: string[];
    };

const T = {
  en: {
    prompt: "Find your seat 🎉",
    field: "Your name",
    find: "Find me!",
    welcome: (n: string) => `You made it, ${n}! 🎉`,
    table: "Table",
    noTable: "Seat yourself where you like",
    withYou: "With you",
    meal: "You chose",
    next: "Next",
    happeningNow: "Happening now",
    startsIn: "starts in",
    dressCode: "Dress code",
    comingUp: "Then, later",
    addCalendar: "Add the schedule to your phone",
    directions: "Directions",
    share: "Share the night",
    shareCopy: (n: string, tbl: string, tag: string) =>
      `🎉 At ${n}'s wedding tonight — Table ${tbl}! ${tag}`,
    shareCopyNoTable: (n: string, tag: string) =>
      `🎉 At ${n}'s wedding tonight! ${tag}`,
    copied: "Copied!",
    notFound:
      "We couldn't find that name. Try your full name, or ask someone in the wedding party.",
    ambiguous: "More than one guest matches — please type your full name.",
    leaveNote: "Leave the couple a note",
    noteBody: "Write something…",
    send: "Send",
    sent: "Sent — thank you.",
    addHome: "Add to your home screen from your browser's share menu.",
  },
  es: {
    prompt: "Encuentra tu asiento 🎉",
    field: "Tu nombre",
    find: "¡Buscarme!",
    welcome: (n: string) => `¡Llegaste, ${n}! 🎉`,
    table: "Mesa",
    noTable: "Siéntate donde quieras",
    withYou: "Contigo",
    meal: "Elegiste",
    next: "A continuación",
    happeningNow: "Ahora",
    startsIn: "empieza en",
    dressCode: "Código de vestimenta",
    comingUp: "Más tarde",
    addCalendar: "Añade el horario a tu teléfono",
    directions: "Cómo llegar",
    share: "Comparte la noche",
    shareCopy: (n: string, tbl: string, tag: string) =>
      `🎉 En la boda de ${n} esta noche — ¡Mesa ${tbl}! ${tag}`,
    shareCopyNoTable: (n: string, tag: string) =>
      `🎉 ¡En la boda de ${n} esta noche! ${tag}`,
    copied: "¡Copiado!",
    notFound:
      "No encontramos ese nombre. Prueba con tu nombre completo o pregunta a alguien del cortejo.",
    ambiguous: "Hay más de un invitado con ese nombre — escribe tu nombre completo.",
    leaveNote: "Deja una nota a la pareja",
    noteBody: "Escribe algo…",
    send: "Enviar",
    sent: "Enviado — gracias.",
    addHome: "Añade esta página a tu pantalla de inicio desde el menú de tu navegador.",
  },
};

function countdown(target: number, now: number, label: string) {
  const diff = target - now;
  // Only count down inside a two-day window; further out, show the time itself.
  if (diff <= 0 || diff > 48 * 3_600_000) return null;
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  // In the last five minutes, count seconds too — the one moment a guest is
  // actually watching this number rather than glancing at it once.
  if (h === 0 && m < 5) {
    const s = Math.floor((diff % 60_000) / 1000);
    return `${label} ${m}m ${s}s`;
  }
  return `${label} ${h > 0 ? `${h}h ` : ""}${m}m`;
}

/** First names only, joined naturally — "Elena Moretti & Matteo Ricci"
    becomes "Elena & Matteo", which is what a caption or hashtag wants. */
function firstNames(names: string, separator: string) {
  return names
    .split(separator)
    .map((part) => part.trim().split(/\s+/)[0])
    .filter(Boolean);
}

/** Fires once the wrapped element is first scrolled into view, then stops
    watching — used to stagger sections in as the page scrolls rather than
    having everything already sitting there on load. */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, visible] as const;
}

export default function DayFinder({
  slug,
  names,
  date,
  location,
  locale,
  config,
  events,
  palette,
  separator,
  world,
  mood,
}: {
  slug: string;
  names: string;
  date: string;
  location: string;
  locale: "en" | "es";
  config: FinderConfig;
  events: Event[];
  palette: string[];
  separator: string;
  world: World;
  mood: string;
}) {
  const [lang, setLang] = useState<"en" | "es">(locale);
  const t = T[lang];
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // A real ticking clock, not a stale number refreshed every so often —
    // the countdown to the ceremony should feel alive when you're staring
    // at it in the last minutes.
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, []);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (result) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [result]);

  // A slow parallax drift on the cover photo as the page scrolls past it —
  // the image is pre-scaled in CSS so this never uncovers an edge.
  const coverImgRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const el = coverImgRef.current;
        if (el)
          el.style.transform = `scale(1.12) translateY(${Math.min(window.scrollY * 0.18, 40)}px)`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Sections settle in as they're scrolled to, rather than all sitting
  // fully rendered on first paint.
  const [scheduleRef, scheduleVisible] = useReveal<HTMLElement>();
  const [mapRef, mapVisible] = useReveal<HTMLElement>();
  const [notesRef, notesVisible] = useReveal<HTMLElement>();
  const [bookRef, bookVisible] = useReveal<HTMLDivElement>();
  const reveal = (visible: boolean) =>
    "finder-reveal" + (visible ? " is-visible" : "");

  // Everything still ahead (or just started) rather than only the very next
  // thing — a guest checking their phone once wants the rest of the evening,
  // not a single fact they have to keep re-asking for.
  const upcomingEvents = useMemo(() => {
    const upcoming = events.filter(
      (e) => new Date(e.starts_at).getTime() > now - 5_400_000,
    );
    return upcoming.length ? upcoming : events.slice(-1);
  }, [events, now]);
  const nextEvent = upcomingEvents[0] || null;
  const laterEvents = upcomingEvents.slice(1);

  async function find(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length < 2) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch(
        `/api/finder/lookup?slug=${encodeURIComponent(slug)}&q=${encodeURIComponent(query.trim())}`,
      );
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Please try again.");
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const nextLabel = nextEvent
    ? (() => {
        const start = new Date(nextEvent.starts_at).getTime();
        const cd = countdown(start, now, t.startsIn);
        const dt = new Date(nextEvent.starts_at);
        const time = dt.toLocaleTimeString(lang === "es" ? "es" : "en-CA", {
          hour: "numeric",
          minute: "2-digit",
        });
        const day = dt.toLocaleDateString(lang === "es" ? "es" : "en-CA", {
          weekday: "long",
          hour: "numeric",
          minute: "2-digit",
        });
        const live = start <= now;
        return {
          title:
            lang === "es" && nextEvent.title_es
              ? nextEvent.title_es
              : nextEvent.title,
          venue: nextEvent.venue,
          dressCode: nextEvent.dress_code,
          directions: directionsHref(nextEvent.address || nextEvent.venue),
          heading: live && !cd ? t.happeningNow : t.next,
          live: live && !cd,
          detail: cd
            ? `${time} · ${cd}`
            : live
              ? t.happeningNow
              : day,
        };
      })()
    : null;

  const laterList = laterEvents.map((e) => ({
    id: e.id,
    title: lang === "es" && e.title_es ? e.title_es : e.title,
    venue: e.venue,
    dressCode: e.dress_code,
    directions: directionsHref(e.address || e.venue),
    time: new Date(e.starts_at).toLocaleTimeString(
      lang === "es" ? "es" : "en-CA",
      { hour: "numeric", minute: "2-digit" },
    ),
  }));

  const notes = lang === "es" && config.notes_es ? config.notes_es : config.notes;
  const welcomeLine =
    lang === "es" && config.welcome_es ? config.welcome_es : config.welcome;

  // GuestCrest reads initials by splitting on " & " specifically; worlds like
  // Modernist use "+" instead, so build the monogram from the same parts the
  // heading below already splits on, rather than relying on that.
  const monogram = names.includes(separator)
    ? names
        .split(separator)
        .map((part) => part.trim()[0])
        .filter(Boolean)
        .join(separator)
    : names.trim()[0] || "";

  // "Elena & Matteo" for a caption, "#ElenaMatteo2027" for a hashtag —
  // built from the same first-names split.
  const firsts = firstNames(names, separator);
  const casualNames = firsts.length ? firsts.join(" & ") : names;
  const hashtag =
    "#" +
    (firsts.length ? firsts.join("") : names.replace(/\s+/g, "")) +
    new Date(date + "T12:00:00Z").getFullYear();

  const copyShare = async () => {
    const line = result && result.found
      ? result.table
        ? t.shareCopy(casualNames, result.table, hashtag)
        : t.shareCopyNoTable(casualNames, hashtag)
      : t.shareCopyNoTable(casualNames, hashtag);
    try {
      await navigator.clipboard?.writeText(line);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied; the button just won't confirm.
    }
  };

  return (
    <main
      id="main"
      className="finder"
      style={
        {
          "--f-bg": palette[0] || "#f4f0e4",
          "--f-ink": palette[1] || "#33352c",
          "--f-accent": palette[2] || palette[1] || "#40553a",
        } as React.CSSProperties
      }
    >
      <div className="finder-orbs" aria-hidden="true">
        <span className="finder-orb finder-orb-1" />
        <span className="finder-orb finder-orb-2" />
      </div>

      <div className="finder-cover">
        <img
          src={mood}
          alt=""
          className="finder-cover-img"
          ref={coverImgRef}
        />
        <div className="finder-cover-scrim" aria-hidden="true" />
        <button
          className="finder-lang finder-lang-float"
          onClick={() => setLang((l) => (l === "en" ? "es" : "en"))}
        >
          {lang === "en" ? "Español" : "English"}
        </button>
        <header className="finder-cover-content">
          <GuestCrest
            names={names}
            world={world}
            monogram={monogram}
            size={72}
            className="finder-crest"
          />
          <p className="finder-kicker">
            {new Date(date + "T12:00:00Z").toLocaleDateString(
              lang === "es" ? "es" : "en-CA",
              { day: "numeric", month: "long", year: "numeric" },
            )}
            {" · "}
            {location}
          </p>
          <h1>
            {names.includes(separator) ? (
              names.split(separator).flatMap((part, i, arr) =>
                i < arr.length - 1
                  ? [part.trim(), <i key={i}>{separator}</i>, " "]
                  : [part.trim()],
              )
            ) : (
              names
            )}
          </h1>
        </header>
      </div>

      <div className="finder-inner">
        <form className="finder-search" onSubmit={find}>
          <label htmlFor="finder-q">{t.prompt}</label>
          <div className="finder-field">
            <MagnifyingGlassIcon size={18} />
            <input
              id="finder-q"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.field}
              autoComplete="name"
              autoCapitalize="words"
              enterKeyHint="search"
            />
            <button type="submit" disabled={busy || query.trim().length < 2}>
              {busy ? "…" : t.find}
            </button>
          </div>
          {error && <p className="finder-error">{error}</p>}
        </form>

        {result && (
          <div
            className={
              "finder-result" + (result.found ? " is-found" : "")
            }
            ref={resultRef}
          >
            {result.found ? (
              <>
                <span className="finder-confetti" aria-hidden="true">
                  {CONFETTI.map((c, i) => (
                    <i
                      key={i}
                      className={"tone-" + c.tone}
                      style={
                        {
                          "--x": `${c.x}px`,
                          "--y": `${c.y}px`,
                          "--rot": `${c.rot}deg`,
                          animationDelay: `${c.delay}s`,
                        } as React.CSSProperties
                      }
                    />
                  ))}
                </span>
                <p className="finder-welcome">{t.welcome(result.first_name)}</p>
                {welcomeLine && (
                  <p className="finder-welcome-note">{welcomeLine}</p>
                )}
                {result.table ? (
                  <p className="finder-table">
                    <span>{t.table}</span>
                    <strong>{result.table}</strong>
                  </p>
                ) : (
                  <p className="finder-table finder-table-open">
                    {t.noTable}
                  </p>
                )}
                {(config.tablemates && result.tablemates.length > 0) ||
                result.meal ? (
                  <span className="finder-tear" aria-hidden="true" />
                ) : null}
                {config.tablemates && result.tablemates.length > 0 && (
                  <div className="finder-with">
                    <span>{t.withYou}</span>
                    <div className="finder-avatars">
                      {result.tablemates.map((name, i) => (
                        <span
                          key={name + i}
                          className="finder-avatar"
                          style={{ "--i": i } as React.CSSProperties}
                        >
                          <i>{name.trim()[0]?.toUpperCase()}</i>
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {result.meal && (
                  <p className="finder-meal">
                    <span>{t.meal}</span> {result.meal}
                  </p>
                )}
                <p className="finder-ticket-code">
                  {monogram.split(separator).join(" · ")} ·{" "}
                  {new Date(date + "T12:00:00Z")
                    .toLocaleDateString("en-CA", {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                    })
                    .toUpperCase()}
                </p>
                <button
                  type="button"
                  className="finder-share"
                  onClick={copyShare}
                >
                  {copied ? t.copied : `${t.share} · ${hashtag}`}
                </button>
              </>
            ) : (
              <p className="finder-miss">
                {result.ambiguous ? t.ambiguous : t.notFound}
              </p>
            )}
          </div>
        )}

        {nextLabel && (
          <section
            className={"finder-schedule " + reveal(scheduleVisible)}
            ref={scheduleRef}
          >
            <div className="finder-next">
              <span>
                {nextLabel.live && (
                  <i className="finder-live-dot" aria-hidden="true" />
                )}
                {nextLabel.heading}
              </span>
              <h2>{nextLabel.title}</h2>
              <p>{nextLabel.detail}</p>
              <a
                className="finder-directions"
                href={nextLabel.directions}
                target="_blank"
                rel="noreferrer"
                aria-label={`${t.directions}: ${nextLabel.venue}`}
              >
                <NavigationArrowIcon size={12} weight="fill" />
                {nextLabel.venue}
              </a>
              {nextLabel.dressCode && (
                <p className="finder-dress">
                  <span>{t.dressCode}</span> {nextLabel.dressCode}
                </p>
              )}
            </div>
            {laterList.length > 0 && (
              <div className="finder-later-wrap">
                <p className="finder-later-heading">{t.comingUp}</p>
                <ol className="finder-later">
                  {laterList.map((e) => (
                    <li key={e.id}>
                      <span className="finder-later-time">{e.time}</span>
                      <span className="finder-later-title">{e.title}</span>
                      <a
                        className="finder-later-venue"
                        href={e.directions}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${t.directions}: ${e.venue}`}
                      >
                        {e.venue}
                        {e.dressCode ? ` · ${e.dressCode}` : ""}
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            <a
              className="finder-calendar"
              href={`/api/finder/calendar?slug=${encodeURIComponent(slug)}`}
            >
              <CalendarPlusIcon size={14} /> {t.addCalendar}
            </a>
          </section>
        )}

        {config.map && (
          <figure className={"finder-map " + reveal(mapVisible)} ref={mapRef}>
            <img src={config.map} alt="Venue plan" />
          </figure>
        )}

        {notes && (
          <section className={"finder-notes " + reveal(notesVisible)} ref={notesRef}>
            {notes.split("\n").filter(Boolean).map((line, i) => (
              <p key={i}>
                <MapPinIcon size={13} /> {line}
              </p>
            ))}
          </section>
        )}

        {config.guestbook && (
          <div className={reveal(bookVisible)} ref={bookRef}>
            <Guestbook
              slug={slug}
              name={result && result.found ? result.first_name : ""}
              t={t}
            />
          </div>
        )}

        <p className="finder-foot">{t.addHome}</p>
      </div>
    </main>
  );
}

function Guestbook({
  slug,
  name,
  t,
}: {
  slug: string;
  name: string;
  t: (typeof T)["en"];
}) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  if (sent)
    return <p className="finder-note-sent">{t.sent}</p>;

  return (
    <section className="finder-guestbook">
      {open ? (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (body.trim().length < 2) return;
            setBusy(true);
            try {
              await fetch(`/api/finder/note?slug=${encodeURIComponent(slug)}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, body: body.trim() }),
              });
              setSent(true);
            } finally {
              setBusy(false);
            }
          }}
        >
          <textarea
            rows={3}
            value={body}
            maxLength={1000}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t.noteBody}
            autoFocus
          />
          <button type="submit" disabled={busy || body.trim().length < 2}>
            {t.send}
          </button>
        </form>
      ) : (
        <button className="finder-guestbook-open" onClick={() => setOpen(true)}>
          {t.leaveNote}
        </button>
      )}
    </section>
  );
}
