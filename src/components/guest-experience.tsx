"use client";
import { identityStyle, weddingIdentity } from "@/lib/identity";
import type { GuestData } from "@/lib/types";
import { eventTime, formatDate, getWorld } from "@/lib/worlds";
import { useGSAP } from "@gsap/react";
import {
  CalendarBlankIcon,
  ChampagneIcon,
  CoffeeIcon,
  ForkKnifeIcon,
  HeartIcon,
  MusicNotesIcon,
} from "@phosphor-icons/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import GuestCountdown from "./guest-countdown";
import GuestCrest from "./guest-crest";
import GuestInvitationGate from "./guest-invitation-gate";
import GuestInvitationHero from "./guest-invitation-hero";
import GuestMemoryAlbum from "./guest-memory-album";
import GuestNavigation from "./guest-navigation";
import GuestReplyCard from "./guest-reply-card";
import GuestRequests from "./guest-requests";
import GuestSealGate from "./guest-seal-gate";
import GuestWeddingPass from "./guest-wedding-pass";
import { ContactModal } from "./guest/contact-modal";
import { copy } from "./guest/copy";
import { RsvpModal } from "./guest/rsvp-modal";
import { UploadModal } from "./guest/upload-modal";
import { Arrow, api } from "./ui";
gsap.registerPlugin(useGSAP, ScrollTrigger);

const MOMENT_ICONS: [RegExp, typeof HeartIcon][] = [
  [/welcome|aperitivo|bienvenid|drinks|c[oó]ctel|cocktail/i, ChampagneIcon],
  [/ceremon|vows|boda|wedding/i, HeartIcon],
  [/reception|dinner|banquet|cena|celebraci/i, MusicNotesIcon],
  [/brunch|breakfast|desayuno|coffee|farewell|despedida/i, CoffeeIcon],
];
function momentIcon(title: string) {
  return (
    MOMENT_ICONS.find(([pattern]) => pattern.test(title))?.[1] ?? ForkKnifeIcon
  );
}

export default function GuestExperience({ initial }: { initial: GuestData }) {
  const [data, setData] = useState(initial),
    [opened, setOpened] = useState(false),
    [opening, setOpening] = useState(false),
    [locale, setLocale] = useState<"en" | "es">(
      (initial.guests[0]?.language || initial.wedding.locale) === "es"
        ? "es"
        : "en",
    ),
    [modal, setModal] = useState<"rsvp" | "pass" | "photos" | "contact" | null>(
      null,
    );
  const root = useRef<HTMLDivElement>(null);
  const replayRequested = useRef(false);
  const c = copy[locale],
    world = getWorld(data.wedding.world),
    url = "/api/guest?token=" + data.token;
  // The header reports where this household stands; the dock keeps the action.
  const refresh = async () => {
    setData(await api(url));
  };
  const openedKey = `vow-opened-${data.preview ? "preview-" : ""}${data.wedding.id}-${data.guests[0]?.household_id}`;
  useEffect(() => {
    try {
      if (localStorage.getItem(openedKey) === "yes") setOpened(true);
    } catch {}
  }, [openedKey]);
  const openInvitation = () => {
    setOpening(true);
    setOpened(true);
    try {
      localStorage.setItem(openedKey, "yes");
    } catch {}
  };
  const chronologicalEvents = useMemo(
    () =>
      [...data.events].sort(
        (a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at),
      ),
    [data.events],
  );
  // A wedding weekend reads as days, not as a flat list, so group the moments
  // by their date in the venue's own timezone rather than the visitor's.
  const orderOfDay = useMemo(() => {
    const days: { label: string; moments: typeof chronologicalEvents }[] = [];
    for (const event of chronologicalEvents) {
      const label = formatDate(event.starts_at, locale, {
        timeZone: event.timezone,
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      const day = days.find((entry) => entry.label === label);
      if (day) day.moments.push(event);
      else days.push({ label, moments: [event] });
    }
    return days;
  }, [chronologicalEvents, locale]);
  useEffect(() => {
    if (opened && opening)
      root.current
        ?.querySelector<HTMLElement>(".guest-hero h1")
        ?.focus({ preventScroll: true });
    if (!opened && replayRequested.current) {
      root.current
        ?.querySelector<HTMLElement>(".envelope-open")
        ?.focus({ preventScroll: true });
      replayRequested.current = false;
    }
  }, [opened, opening]);
  useEffect(() => {
    fetch(url).catch(() => {});
  }, [url]);
  useGSAP(
    () => {
      if (!opened) return;
      const mm = gsap.matchMedia();
      mm.add(
        {
          desktop: "(min-width: 769px)",
          mobile: "(max-width: 768px)",
          motion: "(prefers-reduced-motion: no-preference)",
        },
        (context) => {
          if (!context.conditions?.motion) return;
          const desktop = context.conditions.desktop;
          gsap.from(".guest-hero-title h1 > *", {
            y: desktop ? 22 : 12,
            duration: 1,
            stagger: 0.09,
            ease: "power3.out",
            clearProps: "transform",
          });
          gsap.from(".atelier-letter", {
            x: desktop ? -24 : -12,
            y: desktop ? 0 : 22,
            delay: desktop ? 0 : 0.12,
            duration: 1.1,
            ease: "power3.out",
          });
          gsap.from(".hero-image-frame", {
            y: desktop ? 28 : 48,
            scale: desktop ? 1 : 0.98,
            duration: 1.3,
            ease: "power3.out",
          });
          gsap.from(".date-keepsake", {
            rotation: -11,
            y: 45,
            duration: 1.25,
            delay: desktop ? 0.15 : 0.45,
            ease: "power3.out",
          });
          gsap.to(".guest-hero-photo > img", {
            yPercent: desktop ? 9 : 4,
            scale: 1.12,
            ease: "none",
            scrollTrigger: {
              trigger: ".guest-hero",
              start: "top top",
              end: "bottom top",
              scrub: 0.8,
            },
          });
          gsap.to(".hero-flower-study", {
            y: desktop ? -85 : -28,
            rotation: desktop ? 2 : 4,
            ease: "none",
            scrollTrigger: {
              trigger: ".hero-depth-scene",
              start: "top center",
              end: "bottom top",
              scrub: 1,
            },
          });
          gsap.to(".atelier-silk", {
            y: desktop ? -55 : -18,
            rotation: desktop ? 12 : -8,
            ease: "none",
            scrollTrigger: {
              trigger: ".guest-hero",
              start: "top top",
              end: "bottom top",
              scrub: 1.2,
            },
          });
          gsap.to(".atelier-vellum", {
            y: desktop ? -25 : -10,
            rotation: desktop ? -6 : -5,
            ease: "none",
            scrollTrigger: {
              trigger: ".guest-hero",
              start: "top top",
              end: "bottom top",
              scrub: 1,
            },
          });
          // The crest draws itself the first time the order of the day arrives.
          ScrollTrigger.create({
            trigger: ".programme-crest",
            start: "top 85%",
            once: true,
            onEnter: (self) => self.trigger?.classList.add("crest-drawn"),
          });
          gsap.from(".order-moment", {
            y: 18,
            opacity: 0,
            duration: 0.65,
            stagger: 0.07,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ".order-of-day",
              start: "top 80%",
              once: true,
            },
          });
          gsap.to(".hero-medallion", {
            rotation: desktop ? 24 : 10,
            ease: "none",
            scrollTrigger: {
              trigger: ".guest-hero",
              start: "top top",
              end: "bottom top",
              scrub: 1,
            },
          });
          gsap.fromTo(
            ".story-florals",
            { y: desktop ? 65 : 25, rotation: -7 },
            {
              y: desktop ? -40 : -12,
              rotation: -2,
              ease: "none",
              scrollTrigger: {
                trigger: ".guest-story",
                start: "top bottom",
                end: "bottom top",
                scrub: 1,
              },
            },
          );
          gsap.fromTo(
            ".story-photo-memory",
            { y: desktop ? -30 : -12, rotation: 7 },
            {
              y: desktop ? 40 : 15,
              rotation: 3,
              ease: "none",
              scrollTrigger: {
                trigger: ".guest-story",
                start: "top bottom",
                end: "bottom top",
                scrub: 1,
              },
            },
          );
          gsap.fromTo(
            ".travel-postcard",
            { rotation: -6, y: 30 },
            {
              rotation: -2,
              y: -15,
              ease: "none",
              scrollTrigger: {
                trigger: ".guest-travel",
                start: "top bottom",
                end: "bottom top",
                scrub: 1,
              },
            },
          );
          gsap.from(".rsvp-stationery", {
            rotation: 3,
            y: 35,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ".rsvp-scene",
              start: "top 75%",
              once: true,
            },
          });
        },
      );
      mm.add(
        "(min-width: 769px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
        () => {
          const scene =
            root.current?.querySelector<HTMLElement>(".hero-depth-scene");
          const card =
            root.current?.querySelector<HTMLElement>(".hero-image-frame");
          if (!scene || !card) return;
          const rotateX = gsap.quickTo(card, "rotationX", {
            duration: 0.8,
            ease: "power3.out",
          });
          const rotateY = gsap.quickTo(card, "rotationY", {
            duration: 0.8,
            ease: "power3.out",
          });
          const move = (event: PointerEvent) => {
            const box = scene.getBoundingClientRect();
            rotateX((0.5 - (event.clientY - box.top) / box.height) * 3);
            rotateY(((event.clientX - box.left) / box.width - 0.5) * 3);
          };
          const reset = () => {
            rotateX(0);
            rotateY(0);
          };
          scene.addEventListener("pointermove", move);
          scene.addEventListener("pointerleave", reset);
          return () => {
            scene.removeEventListener("pointermove", move);
            scene.removeEventListener("pointerleave", reset);
          };
        },
      );
      return () => mm.revert();
    },
    { scope: root, dependencies: [opened], revertOnUpdate: true },
  );
  useEffect(() => {
    if (!opened) return;
    const node = root.current;
    const observer = new ResizeObserver(() => ScrollTrigger.refresh());
    if (node) observer.observe(node);
    return () => observer.disconnect();
  }, [opened]);
  return (
    <div
      ref={root}
      className={"guest-experience immersive-invitation world-" + world.id}
      style={identityStyle(data.wedding.settings, world.id === "notte")}
      lang={locale}
    >
      {data.preview && (
        <div className="guest-preview-banner" role="status">
          {locale === "en"
            ? `Read-only preview · ${data.household} · expires in one hour`
            : `Vista previa de solo lectura · ${data.household} · caduca en una hora`}
          <a href={`/studio/setup?wid=${data.wedding.id}`}>
            {locale === "en" ? "Return to Studio" : "Volver al Studio"}
          </a>
        </div>
      )}
      {!opened ? (
        // Both openings hand the guest to the same invitation; the couple
        // chooses which one arrives.
        (() => {
          const Opening =
            data.wedding.opening === "seal"
              ? GuestSealGate
              : GuestInvitationGate;
          return (
            <Opening
              data={data}
              locale={locale}
              onLocaleChange={() => setLocale(locale === "en" ? "es" : "en")}
              onOpen={openInvitation}
            />
          );
        })()
      ) : (
        <>
          <GuestNavigation
            names={data.wedding.names}
            location={data.wedding.location}
            locale={locale}
            hasFaqs={!!data.faqs?.length}
            onLocale={() => setLocale(locale === "en" ? "es" : "en")}
            onRsvp={() => setModal("rsvp")}
            onPass={() => setModal("pass")}
          />
          <main id="main">
            <GuestInvitationHero
              data={data}
              locale={locale}
              onReplay={() => {
                replayRequested.current = true;
                setOpening(false);
                setOpened(false);
                window.scrollTo({ top: 0, behavior: "instant" });
              }}
            />
            {!!data.updates?.length && (
              <section
                className="guest-updates"
                aria-label={
                  locale === "en"
                    ? "Updates from your hosts"
                    : "Novedades de los anfitriones"
                }
              >
                <span className="eyebrow">
                  {locale === "en"
                    ? "A NOTE FROM YOUR HOSTS"
                    : "UNA NOTA DE LOS ANFITRIONES"}
                </span>
                {data.updates.map((update) => (
                  <article key={update.id}>
                    <h2>{update.subject}</h2>
                    <p>{update.body}</p>
                  </article>
                ))}
              </section>
            )}
            <section id="story" className="guest-story">
              <span className="story-watermark" aria-hidden="true">
                &
              </span>
              <figure className="story-photo-memory" aria-hidden="true">
                <img src="/images/wedding-evening.webp" alt="" loading="lazy" />
                <figcaption>
                  {locale === "en"
                    ? "An evening to remember"
                    : "Una noche para recordar"}
                </figcaption>
              </figure>
              <div className="story-florals">
                <img
                  src="/images/wedding-details.webp"
                  alt={
                    locale === "en"
                      ? "Garden roses, silk ribbon and wedding bands on linen"
                      : "Rosas, cinta de seda y alianzas sobre lino"
                  }
                  loading="lazy"
                />
              </div>
              <div className="story-letter">
                <span className="story-letter-label">
                  {locale === "en" ? "Dearest " : "Con cariño, para "}
                  {data.guests
                    .map((guest) => guest.name.split(" ")[0])
                    .join(" & ")}
                  ,
                </span>
                <span className="story-monogram">
                  {data.wedding.names
                    .split(" & ")
                    .map((s) => s[0])
                    .join(" + ")}
                </span>
                <h2>{c.story}</h2>
                <p>
                  {locale === "es" &&
                  typeof data.wedding.settings.story_es === "string"
                    ? data.wedding.settings.story_es
                    : data.wedding.story}
                </p>
                <span className="story-signature">{data.wedding.names}</span>
              </div>
            </section>
            <section className="guest-programme" id="programme" tabIndex={-1}>
              <div className="programme-intro">
                <div className="programme-detail-print" aria-hidden="true">
                  <img
                    src="/images/wedding-details.webp"
                    alt=""
                    loading="lazy"
                  />
                  <span>
                    {locale === "en"
                      ? "The little things, with love."
                      : "Los detalles, con amor."}
                  </span>
                </div>
                <GuestCrest
                  monogram={weddingIdentity(data.wedding.settings).monogram}
                  names={data.wedding.names}
                  world={data.wedding.world}
                  className="programme-crest"
                  size={116}
                />
                <span>
                  {formatDate(data.wedding.date, locale, {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <h2>{c.programme}</h2>
                <p>
                  {locale === "en"
                    ? "A few lovely things we have planned. These are the moments we have saved for you."
                    : "Estos son los momentos que hemos preparado para ti."}
                </p>
                <a
                  href={"/api/guest/calendar?token=" + data.token}
                  className="guest-text-link"
                >
                  <CalendarBlankIcon size={17} />
                  {c.calendar}
                </a>
              </div>
              <div className="programme-events">
                <span className="programme-fold" aria-hidden="true" />
                <div className="programme-heading">
                  {locale === "en"
                    ? "The order of the day"
                    : "El orden del día"}
                </div>
                <ol className="order-of-day">
                  {orderOfDay.map(({ label, moments }) => (
                    <li className="order-day" key={label}>
                      <p className="order-day-label">{label}</p>
                      <ol className="order-moments">
                        {moments.map((event) => {
                          const Moment = momentIcon(event.title);
                          return (
                            <li className="order-moment" key={event.id}>
                              <span className="order-mark" aria-hidden="true">
                                <Moment size={15} />
                              </span>
                              <time
                                className="order-time"
                                dateTime={event.starts_at}
                              >
                                {eventTime(
                                  event.starts_at,
                                  event.timezone,
                                  locale,
                                )}
                              </time>
                              <div className="order-body">
                                <h3>
                                  {locale === "es" && event.title_es
                                    ? event.title_es
                                    : event.title}
                                </h3>
                                {event.description && (
                                  <p>{event.description}</p>
                                )}
                                <span className="order-venue">
                                  {event.venue}
                                </span>
                                {event.dress_code && (
                                  <small className="programme-dress">
                                    <span>
                                      {locale === "en"
                                        ? "Dress code"
                                        : "Vestimenta"}
                                    </span>
                                    {event.dress_code}
                                  </small>
                                )}
                                <a
                                  href={
                                    "https://www.google.com/maps/search/?api=1&query=" +
                                    encodeURIComponent(
                                      event.venue + " " + event.address,
                                    )
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  className="guest-text-link"
                                >
                                  {c.directions}
                                  <Arrow diagonal size={15} />
                                </a>
                              </div>
                            </li>
                          );
                        })}
                      </ol>
                    </li>
                  ))}
                </ol>
              </div>
            </section>
            {!!data.faqs?.length && (
              <section className="guest-faqs" id="faqs" tabIndex={-1}>
                <div className="faqs-intro">
                  <GuestCrest
                    monogram={weddingIdentity(data.wedding.settings).monogram}
                    names={data.wedding.names}
                    world={data.wedding.world}
                    className="faqs-crest"
                    size={92}
                  />
                  <h2>
                    {locale === "en"
                      ? "You might be wondering."
                      : "Quizá te preguntes."}
                  </h2>
                  <p>
                    {locale === "en"
                      ? "The things guests usually write to ask. If yours is not here, tell us in your reply."
                      : "Lo que suelen preguntarnos. Si falta la tuya, dínoslo en tu respuesta."}
                  </p>
                </div>
                <ul className="faq-list">
                  {data.faqs.map((faq) => (
                    <li key={faq.id}>
                      <details name="guest-faq">
                        <summary>
                          <span>
                            {locale === "es" && faq.question_es
                              ? faq.question_es
                              : faq.question}
                          </span>
                          <i aria-hidden="true" />
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
            <section
              className="guest-wait"
              aria-label={
                locale === "en" ? "Time until the wedding" : "Tiempo que falta"
              }
            >
              <GuestCountdown
                target={chronologicalEvents[0]?.starts_at || data.wedding.date}
                locale={locale}
                married={data.wedding.status === "memories"}
              />
            </section>
            <section className="guest-travel" id="travel">
              <div className="travel-photo-stack">
                <div className="travel-postmark" aria-hidden="true">
                  <span>{locale === "en" ? "WITH LOVE" : "CON AMOR"}</span>
                  <b>
                    {formatDate(data.wedding.date, locale, {
                      day: "2-digit",
                      month: "short",
                    })}
                  </b>
                  <svg viewBox="0 0 100 28" fill="none">
                    <path d="M0 4Q25 -3 50 4T100 4M0 14Q25 7 50 14T100 14M0 24Q25 17 50 24T100 24" />
                  </svg>
                </div>
                <div className="travel-card-back" aria-hidden="true">
                  <span>
                    {locale === "en" ? "Meet us here." : "Nos vemos aquí."}
                  </span>
                  <p>{data.wedding.location}</p>
                </div>
                <div className="travel-postcard">
                  <img
                    src={world.image}
                    alt={"A postcard from " + data.wedding.location}
                    loading="lazy"
                  />
                  <span>
                    {locale === "en" ? "Greetings from" : "Saludos desde"}
                    <br />
                    <em>{data.wedding.location.split(",")[0]}</em>
                  </span>
                </div>
              </div>
              <div className="guest-travel-copy">
                <h2>{c.journey}</h2>
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
                        : c.directions}
                      <Arrow diagonal size={15} />
                    </a>
                  </article>
                ))}
                {!data.travel.length && (
                  <p>
                    {locale === "en"
                      ? "Travel details will be shared by your hosts."
                      : "Los anfitriones compartirán los detalles del viaje."}
                  </p>
                )}
              </div>
            </section>
            <div className="guest-reply-thread" aria-hidden="true">
              <span />
              <svg viewBox="0 0 140 60" fill="none">
                <path d="M8 48Q65 50 132 10M38 42Q15 17 19 10Q43 10 38 42M59 35Q37 8 45 5Q68 16 59 35M80 26Q90 54 102 49Q107 32 80 26M107 15Q120 36 130 29Q126 15 107 15" />
              </svg>
              <span />
            </div>
            <GuestReplyCard
              data={data}
              locale={locale}
              onReply={() => setModal("rsvp")}
            />
            <GuestMemoryAlbum
              data={data}
              locale={locale}
              onUpload={() => setModal("photos")}
            />
            {data.registry.length > 0 && (
              <section className="guest-registry">
                <h2>{c.gifts}</h2>
                <p>
                  {locale === "en"
                    ? "For those who have asked, a few things for our next chapter."
                    : "Para quienes nos han preguntado, algunas ideas para nuestra próxima etapa."}
                </p>
                {data.registry.map((r) => (
                  <a
                    className="guest-text-link"
                    href={r.url}
                    key={r.id}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {r.title}
                    <Arrow diagonal />
                  </a>
                ))}
              </section>
            )}
            <section className="guest-questions">
              <h2>
                {locale === "en"
                  ? "A few things to know."
                  : "Algunos detalles más."}
              </h2>
              <div>
                {[
                  [
                    locale === "en" ? "What should I wear?" : "¿Qué me pongo?",
                    data.events[0]?.dress_code ||
                      (locale === "en"
                        ? "Something that makes you feel like yourself."
                        : "Algo que te haga sentir bien."),
                  ],
                  [
                    locale === "en"
                      ? "Can I update my response?"
                      : "¿Puedo actualizar mi respuesta?",
                    locale === "en"
                      ? "Of course. Use your personal invitation to make changes before the RSVP deadline."
                      : "Claro. Usa tu invitación personal para hacer cambios antes de la fecha límite.",
                  ],
                  [
                    locale === "en"
                      ? "Can I bring someone?"
                      : "¿Puedo llevar acompañante?",
                    locale === "en"
                      ? "Everyone included in your invitation is listed in your RSVP. Please contact your hosts if you have a question."
                      : "Todas las personas invitadas aparecen en tu respuesta. Contacta a los anfitriones si tienes alguna duda.",
                  ],
                ].map(([q, a]) => (
                  <details key={q}>
                    <summary>
                      {q}
                      <span>+</span>
                    </summary>
                    <p>{a}</p>
                  </details>
                ))}
              </div>
            </section>
            <GuestRequests data={data} locale={locale} refresh={refresh} />
            <footer className="guest-footer">
              {weddingIdentity(data.wedding.settings).showPlanner &&
                weddingIdentity(data.wedding.settings).plannerName && (
                  <p>
                    {locale === "en" ? "Planned by" : "Organizado por"}{" "}
                    {weddingIdentity(data.wedding.settings).plannerName}
                  </p>
                )}
              <h2>{data.wedding.names}</h2>
              <p>
                {formatDate(data.wedding.date, locale)} ·{" "}
                {data.wedding.location}
              </p>
              <div>
                <button onClick={() => setModal("contact")}>{c.contact}</button>
                <Link href="/">
                  Created with Vow Motion <Arrow diagonal size={12} />
                </Link>
              </div>
            </footer>
          </main>
          <div className="guest-dock">
            <button onClick={() => setModal("pass")}>
              <CalendarBlankIcon size={17} />
              {c.pass}
            </button>
            <button onClick={() => setModal("rsvp")}>
              {data.responses.length ? c.update : c.respond}
              <Arrow diagonal size={16} />
            </button>
          </div>
        </>
      )}
      {modal === "rsvp" && (
        <RsvpModal
          data={data}
          locale={locale}
          onClose={() => setModal(null)}
          onSaved={refresh}
          onPass={() => setModal("pass")}
        />
      )}
      {modal === "pass" && (
        <GuestWeddingPass
          data={data}
          locale={locale}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "photos" && (
        <UploadModal
          data={data}
          locale={locale}
          onClose={() => setModal(null)}
          onSaved={refresh}
        />
      )}
      {modal === "contact" && (
        <ContactModal
          data={data}
          locale={locale}
          onClose={() => setModal(null)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
