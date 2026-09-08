"use client";
import Link from "next/link";
import GuestInvitationGate from "./guest-invitation-gate";
import GuestInvitationHero from "./guest-invitation-hero";
import GuestNavigation from "./guest-navigation";
import GuestCountdown from "./guest-countdown";
import GuestCrest from "./guest-crest";
import GuestWeddingPass from "./guest-wedding-pass";
import GuestReplyCard from "./guest-reply-card";
import GuestMemoryAlbum from "./guest-memory-album";
import { preparePhoto } from "@/lib/prepare-photo";
import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  ChampagneIcon,
  HeartIcon,
  MusicNotesIcon,
  CoffeeIcon,
  ForkKnifeIcon,
  CheckIcon,
  CalendarBlankIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react";
import type { GuestData } from "@/lib/types";
import { getWorld, formatDate, eventTime } from "@/lib/worlds";
import { Arrow, Modal, Field, Submit, Notice, api } from "./ui";
gsap.registerPlugin(useGSAP, ScrollTrigger);
const copy = {
  en: {
    invited: "Together with our families",
    open: "Open your invitation",
    personal: "A little something, just for you.",
    celebrate: "WE WOULD LOVE YOU TO CELEBRATE WITH US",
    story: "Some things are meant to be.",
    programme: "A weekend to remember.",
    journey: "Make a little journey of it.",
    rsvp: "Will you join us?",
    respond: "Your RSVP",
    attending: "You’re coming",
    answered: "Your response",
    pass: "Your wedding pass",
    photos: "The moments between.",
    share: "Share a memory",
    yes: "With pleasure",
    no: "Sadly, I can’t",
    next: "A few little details",
    save: "Save our response",
    saved: "A place in our story.",
    savedDesc:
      "Your response is safely with us. You can return to this invitation to update it before the deadline.",
    update: "Update our response",
    calendar: "Add to calendar",
    directions: "Find your way",
    details: "The details",
    travel: "Travel & stay",
    contact: "Your contact details",
    meal: "What should we prepare?",
    dietary: "Anything we should know about?",
    dietHint: "Allergies or dietary requirements",
    name: "Your name",
    close: "Back to the celebration",
    gifts: "Your presence is the present.",
    uploadNote:
      "JPG, PNG or WebP, up to 10 MB. Your hosts review photos before sharing.",
    envelope: "FOR OUR FAVOURITE PEOPLE",
    day: "The day, in your pocket.",
  },
  es: {
    invited: "Junto con nuestras familias",
    open: "Abre tu invitación",
    personal: "Un pequeño detalle, solo para ti.",
    celebrate: "NOS ENCANTARÍA CELEBRAR CONTIGO",
    story: "Hay historias que están destinadas a ser.",
    programme: "Un fin de semana para recordar.",
    journey: "El viaje también es parte de la historia.",
    rsvp: "¿Nos acompañas?",
    respond: "Tu respuesta",
    attending: "Nos acompañas",
    answered: "Tu respuesta enviada",
    pass: "Tu pase de boda",
    photos: "Los pequeños momentos.",
    share: "Comparte un recuerdo",
    yes: "Con mucho gusto",
    no: "Lo siento, no puedo",
    next: "Unos pequeños detalles",
    save: "Guardar nuestra respuesta",
    saved: "Un lugar en nuestra historia.",
    savedDesc:
      "Hemos guardado tu respuesta. Puedes volver a esta invitación para actualizarla antes de la fecha límite.",
    update: "Actualizar nuestra respuesta",
    calendar: "Añadir al calendario",
    directions: "Cómo llegar",
    details: "Los detalles",
    travel: "Viaje y alojamiento",
    contact: "Tus datos de contacto",
    meal: "¿Qué te preparamos?",
    dietary: "¿Algo que debamos saber?",
    dietHint: "Alergias o necesidades alimentarias",
    name: "Tu nombre",
    close: "Volver a la celebración",
    gifts: "Tu presencia es nuestro regalo.",
    uploadNote:
      "JPG, PNG o WebP, hasta 10 MB. Los anfitriones revisarán las fotos antes de compartirlas.",
    envelope: "PARA NUESTRAS PERSONAS FAVORITAS",
    day: "Todo el día, en tu bolsillo.",
  },
};
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
  const openedKey = `vow-opened-${data.wedding.id}-${data.guests[0]?.household_id}`;
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
      lang={locale}
    >
      {!opened ? (
        <GuestInvitationGate
          data={data}
          locale={locale}
          onLocaleChange={() => setLocale(locale === "en" ? "es" : "en")}
          onOpen={openInvitation}
        />
      ) : (
        <>
          <GuestNavigation
            names={data.wedding.names}
            location={data.wedding.location}
            locale={locale}
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
                <GuestCrest
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
            <footer className="guest-footer">
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
function RsvpModal({
  data,
  locale,
  onClose,
  onSaved,
  onPass,
}: {
  data: GuestData;
  locale: "en" | "es";
  onClose: () => void;
  onSaved: () => Promise<void>;
  onPass: () => void;
}) {
  const c = copy[locale],
    [step, setStep] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  type Response = {
    guest_id: string;
    event_id: string;
    attending: boolean;
    meal: string;
    dietary: string;
    name?: string;
    answers: Record<string, string>;
  };
  const key = "vow-rsvp-" + data.token;
  const initial: Response[] = useMemo(
    () =>
      data.guests.flatMap((g) =>
        data.events
          .filter((e) => e.rsvp_required)
          .map((e) => {
            const saved = data.responses.find(
              (r) => r.guest_id === g.id && r.event_id === e.id,
            );
            return {
              guest_id: g.id,
              event_id: e.id,
              attending: saved?.attending ?? true,
              meal: saved?.meal || "",
              dietary: saved?.dietary || "",
              answers: saved?.answers || {},
            };
          }),
      ),
    [data.guests, data.events, data.responses],
  );
  const [responses, setResponses] = useState<Response[]>(initial);
  useEffect(() => {
    try {
      const draft = sessionStorage.getItem(key);
      if (draft) {
        const parsed = JSON.parse(draft);
        if (
          Array.isArray(parsed) &&
          parsed.length === initial.length &&
          initial.every((expected) =>
            parsed.some(
              (r) =>
                r.guest_id === expected.guest_id &&
                r.event_id === expected.event_id &&
                typeof r.attending === "boolean" &&
                typeof r.meal === "string" &&
                typeof r.dietary === "string" &&
                r.answers &&
                typeof r.answers === "object",
            ),
          )
        )
          setResponses(
            initial.map((expected) =>
              parsed.find(
                (r) =>
                  r.guest_id === expected.guest_id &&
                  r.event_id === expected.event_id,
              ),
            ),
          );
      }
    } catch {}
  }, [key, initial]);
  const update = (index: number, patch: Partial<Response>) => {
    setResponses((prev) => {
      const next = prev.map((r, i) => (i === index ? { ...r, ...patch } : r));
      try {
        sessionStorage.setItem(key, JSON.stringify(next));
      } catch {}
      return next;
    });
  };
  const questionUpdate = (
    guestId: string,
    questionId: string,
    value: string,
    household = false,
  ) => {
    setResponses((prev) => {
      const next = prev.map((r) =>
        household || r.guest_id === guestId
          ? { ...r, answers: { ...r.answers, [questionId]: value } }
          : r,
      );
      try {
        sessionStorage.setItem(key, JSON.stringify(next));
      } catch {}
      return next;
    });
  };
  return (
    <Modal
      title={step === 2 ? c.saved : c.rsvp}
      onClose={onClose}
      wide
      className="guest-paper-dialog reply-dialog"
    >
      {step === 2 ? (
        <div className="rsvp-success">
          <span className="success-mark">
            <CheckIcon size={30} />
          </span>
          <h3>
            {locale === "en"
              ? "Thank you, " + data.guests[0].name.split(" ")[0] + "."
              : "Gracias, " + data.guests[0].name.split(" ")[0] + "."}
          </h3>
          <p>
            {responses.some((r) => r.attending)
              ? c.savedDesc
              : locale === "en"
                ? "We’ll miss you. Your reply has been shared with the couple—thank you for letting them know."
                : "Te echaremos de menos. Hemos compartido tu respuesta con la pareja. Gracias por avisarnos."}
          </p>
          {responses.some((r) => r.attending) && (
            <a
              className="button primary"
              href={"/api/guest/calendar?token=" + data.token}
            >
              {c.calendar}
              <Arrow />
            </a>
          )}
          <button className="button pass-next-action" onClick={onPass}>
            {c.pass}
            <Arrow />
          </button>
          <button className="text-link" onClick={onClose}>
            {c.close}
          </button>
        </div>
      ) : (
        <>
          <p className="dialog-dedication">{data.wedding.names}</p>
          <div className="rsvp-progress">
            <span className={step === 0 ? "current" : ""}>
              {locale === "en" ? "Your plans" : "Tus planes"}
            </span>
            <span className={step === 1 ? "current" : ""}>
              {locale === "en" ? "The little details" : "Los detalles"}
            </span>
          </div>
          {error && <Notice error>{error}</Notice>}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (step === 0) {
                setStep(1);
                return;
              }
              setBusy(true);
              setError("");
              try {
                await api("/api/guest/rsvp?token=" + data.token, "POST", {
                  responses,
                });
                try {
                  sessionStorage.removeItem(key);
                } catch {}
                await onSaved();
                setStep(2);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {step === 0 ? (
              <div className="attendance-questions">
                {data.events
                  .filter((e) => e.rsvp_required)
                  .map((event) => (
                    <section key={event.id}>
                      <h3>
                        {locale === "es" && event.title_es
                          ? event.title_es
                          : event.title}
                      </h3>
                      <p>
                        {formatDate(event.starts_at, locale, {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          timeZone: event.timezone,
                        })}{" "}
                        · {eventTime(event.starts_at, event.timezone)}
                      </p>
                      {data.guests.map((g) => {
                        const index = responses.findIndex(
                          (r) => r.guest_id === g.id && r.event_id === event.id,
                        );
                        return (
                          <fieldset className="attendance-person" key={g.id}>
                            <legend>{g.name}</legend>
                            <label
                              className={
                                responses[index]?.attending ? "selected" : ""
                              }
                            >
                              <input
                                type="radio"
                                name={g.id + event.id}
                                checked={responses[index]?.attending}
                                onChange={() =>
                                  update(index, { attending: true })
                                }
                              />
                              {c.yes}
                            </label>
                            <label
                              className={
                                !responses[index]?.attending ? "selected" : ""
                              }
                            >
                              <input
                                type="radio"
                                name={g.id + event.id}
                                checked={!responses[index]?.attending}
                                onChange={() =>
                                  update(index, { attending: false })
                                }
                              />
                              {c.no}
                            </label>
                          </fieldset>
                        );
                      })}
                    </section>
                  ))}
              </div>
            ) : (
              <div className="meal-questions">
                <div className="reply-review">
                  <span className="eyebrow">
                    {locale === "en"
                      ? "YOUR REPLY, AT A GLANCE"
                      : "TU RESPUESTA, EN RESUMEN"}
                  </span>
                  {data.events
                    .filter((event) => event.rsvp_required)
                    .map((event) => (
                      <div key={event.id}>
                        <strong>
                          {locale === "es" && event.title_es
                            ? event.title_es
                            : event.title}
                        </strong>
                        <p>
                          {responses
                            .filter((r) => r.event_id === event.id)
                            .map(
                              (r) =>
                                `${data.guests.find((g) => g.id === r.guest_id)?.name}: ${r.attending ? (locale === "en" ? "attending" : "asistirá") : locale === "en" ? "unable to attend" : "no asistirá"}`,
                            )
                            .join(" · ")}
                        </p>
                      </div>
                    ))}
                  <small>
                    {locale === "en"
                      ? "Need to change a plan? Go back. Nothing is sent until you save."
                      : "¿Cambio de planes? Vuelve atrás. Nada se envía hasta que guardes."}
                  </small>
                </div>
                {responses.map(
                  (r, index) =>
                    r.attending && (
                      <section key={r.guest_id + r.event_id}>
                        <h3>
                          {data.guests.find((g) => g.id === r.guest_id)?.name}
                        </h3>
                        <small>
                          {data.events.find((e) => e.id === r.event_id)?.title}
                        </small>
                        {data.guests.find((g) => g.id === r.guest_id)
                          ?.is_plus_one && (
                          <Field label={c.name}>
                            <input
                              required
                              value={r.name || ""}
                              onChange={(e) =>
                                update(index, { name: e.target.value })
                              }
                            />
                          </Field>
                        )}
                        <div className="form-grid">
                          <Field label={c.meal}>
                            <select
                              required
                              value={r.meal}
                              onChange={(e) =>
                                update(index, { meal: e.target.value })
                              }
                            >
                              <option value="">
                                {locale === "en"
                                  ? "Choose your meal"
                                  : "Elige tu plato"}
                              </option>
                              <option value="Beef fillet">
                                {locale === "en"
                                  ? "Beef fillet"
                                  : "Filete de ternera"}
                              </option>
                              <option value="Sea bass">
                                {locale === "en" ? "Sea bass" : "Lubina"}
                              </option>
                              <option value="Garden risotto">
                                {locale === "en"
                                  ? "Garden risotto (vegetarian)"
                                  : "Risotto de verduras (vegetariano)"}
                              </option>
                              <option value="Vegan plate">
                                {locale === "en"
                                  ? "Vegan plate"
                                  : "Plato vegano"}
                              </option>
                              <option value="Children’s meal">
                                {locale === "en"
                                  ? "Children’s meal"
                                  : "Menú infantil"}
                              </option>
                            </select>
                          </Field>
                          <Field label={c.dietary}>
                            <input
                              value={r.dietary}
                              onChange={(e) =>
                                update(index, { dietary: e.target.value })
                              }
                              placeholder={c.dietHint}
                            />
                          </Field>
                        </div>
                      </section>
                    ),
                )}
                {data.questions.map((q) => {
                  const targets =
                    q.scope === "household" ? [data.guests[0]] : data.guests;
                  return targets.map((g) => {
                    const relevant = responses.filter(
                      (r) => q.scope === "household" || r.guest_id === g.id,
                    );
                    if (
                      q.condition === "attending" &&
                      !relevant.some((r) => r.attending)
                    )
                      return null;
                    const value = relevant[0]?.answers[q.id] || "";
                    return (
                      <Field
                        label={
                          (q.scope === "person" ? g.name + " · " : "") +
                          (locale === "es" && q.label_es ? q.label_es : q.label)
                        }
                        key={q.id + g.id}
                      >
                        {q.type === "select" || q.type === "yes-no" ? (
                          <select
                            required={q.required}
                            value={value}
                            onChange={(e) =>
                              questionUpdate(
                                g.id,
                                q.id,
                                e.target.value,
                                q.scope === "household",
                              )
                            }
                          >
                            <option value="">
                              {locale === "en"
                                ? "Please choose"
                                : "Elige una opción"}
                            </option>
                            {(q.type === "yes-no"
                              ? ["Yes", "No"]
                              : q.options
                            ).map((o) => (
                              <option key={o}>{o}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            required={q.required}
                            type={q.type === "number" ? "number" : "text"}
                            value={value}
                            onChange={(e) =>
                              questionUpdate(
                                g.id,
                                q.id,
                                e.target.value,
                                q.scope === "household",
                              )
                            }
                          />
                        )}
                      </Field>
                    );
                  });
                })}
                {!responses.some((r) => r.attending) && (
                  <p>
                    {locale === "en"
                      ? "We’ll miss you. Thank you for letting us know."
                      : "Te echaremos de menos. Gracias por avisarnos."}
                  </p>
                )}
              </div>
            )}
            <div className="form-actions">
              {step === 1 && (
                <button
                  type="button"
                  className="button outline"
                  onClick={() => setStep(0)}
                >
                  {locale === "en" ? "Back" : "Volver"}
                </button>
              )}
              <Submit pending={busy}>
                {step === 0 ? c.next : c.save}
                <Arrow />
              </Submit>
            </div>
            <p className="form-note">
              {locale === "en"
                ? "Your draft is kept in this browser tab until you save."
                : "Tu borrador se conserva en esta pestaña hasta que lo guardes."}
            </p>
          </form>
        </>
      )}
    </Modal>
  );
}
function UploadModal({
  data,
  locale,
  onClose,
  onSaved,
}: {
  data: GuestData;
  locale: "en" | "es";
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState(false),
    c = copy[locale];
  const uploaded = useRef(new Set<string>());
  const [progress, setProgress] = useState("");
  return (
    <Modal title={c.share} onClose={onClose}>
      {message && <Notice error={error}>{message}</Notice>}
      {progress && <p role="status">{progress}</p>}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setMessage("");
          const formElement = e.currentTarget;
          const form = new FormData(formElement);
          try {
            const files = form.getAll("file") as File[];
            for (const file of files) {
              if (
                !file.size ||
                file.size > 10 * 1024 * 1024 ||
                !["image/jpeg", "image/png", "image/webp"].includes(file.type)
              )
                throw new Error(
                  locale === "en"
                    ? `${file.name}: choose a JPG, PNG or WebP photo under 10 MB.`
                    : `${file.name}: elige una foto JPG, PNG o WebP de menos de 10 MB.`,
                );
            }
            for (const [index, file] of files.entries()) {
              const signature = `${file.name}-${file.size}-${file.lastModified}`;
              if (uploaded.current.has(signature)) continue;
              setProgress(
                locale === "en"
                  ? `Sharing photo ${index + 1} of ${files.length}…`
                  : `Compartiendo foto ${index + 1} de ${files.length}…`,
              );
              const body = new FormData();
              body.set("file", await preparePhoto(file));
              body.set("caption", String(form.get("caption") || ""));
              const response = await fetch(
                "/api/guest/photos?token=" + data.token,
                { method: "POST", body },
              );
              const result = await response.json();
              if (!response.ok) throw Error(result.error);
              uploaded.current.add(signature);
            }
            await onSaved();
            formElement.reset();
            setError(false);
            setMessage(
              locale === "en"
                ? "Your memories are with your hosts, ready for review."
                : "Tus recuerdos están con los anfitriones, listos para revisar.",
            );
          } catch (e) {
            setError(true);
            setMessage((e as Error).message);
          } finally {
            setBusy(false);
            setProgress("");
          }
        }}
      >
        <Field
          label={locale === "en" ? "Choose your photos" : "Elige tus fotos"}
          hint={c.uploadNote}
        >
          <input
            type="file"
            name="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            required
          />
        </Field>
        <Field
          label={
            locale === "en"
              ? "A little caption (optional)"
              : "Una descripción (opcional)"
          }
        >
          <textarea name="caption" maxLength={300} />
        </Field>
        <Submit pending={busy}>
          {c.share}
          <UploadSimpleIcon size={17} />
        </Submit>
      </form>
    </Modal>
  );
}
function ContactModal({
  data,
  locale,
  onClose,
  onSaved,
}: {
  data: GuestData;
  locale: "en" | "es";
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [selected, setSelected] = useState(data.guests[0].id),
    [message, setMessage] = useState("");
  const guest = data.guests.find((g) => g.id === selected)!;
  return (
    <Modal title={copy[locale].contact} onClose={onClose}>
      {message && <Notice>{message}</Notice>}
      <Field label={locale === "en" ? "Guest" : "Invitado"}>
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          {data.guests.map((g) => (
            <option value={g.id} key={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </Field>
      <form
        key={selected}
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          try {
            await api("/api/guest/contact?token=" + data.token, "POST", {
              ...Object.fromEntries(f),
              guest_id: selected,
              consent: f.has("consent"),
            });
            await onSaved();
            setMessage(
              locale === "en" ? "Contact details saved." : "Datos guardados.",
            );
          } catch (e) {
            setMessage((e as Error).message);
          }
        }}
      >
        <Field label="Email">
          <input name="email" type="email" defaultValue={guest.email} />
        </Field>
        <Field label={locale === "en" ? "Phone" : "Teléfono"}>
          <input name="phone" type="tel" defaultValue={guest.phone} />
        </Field>
        <Field label={locale === "en" ? "Postal address" : "Dirección postal"}>
          <textarea name="address" defaultValue={guest.address} />
        </Field>
        <label className="check-label">
          <input
            type="checkbox"
            name="consent"
            defaultChecked={guest.consent}
          />
          {locale === "en"
            ? "I agree to receive wedding updates by email or SMS. I can turn this off here at any time."
            : "Acepto recibir novedades de la boda por email o SMS. Puedo desactivarlo aquí cuando quiera."}
        </label>
        <Submit>
          {locale === "en" ? "Save details" : "Guardar datos"}
          <CheckIcon size={17} />
        </Submit>
      </form>
    </Modal>
  );
}
