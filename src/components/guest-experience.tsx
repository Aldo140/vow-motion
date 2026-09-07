"use client";
import Link from "next/link";
import { preparePhoto } from "@/lib/prepare-photo";
import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import {
  ArrowDownIcon,
  CheckIcon,
  CalendarBlankIcon,
  UploadSimpleIcon,
  EnvelopeSimpleIcon,
} from "@phosphor-icons/react";
import type { GuestData } from "@/lib/types";
import { getWorld, formatDate, eventTime } from "@/lib/worlds";
import { Arrow, Modal, Field, Submit, Notice, api } from "./ui";
gsap.registerPlugin(useGSAP);
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
  const c = copy[locale],
    world = getWorld(data.wedding.world),
    url = "/api/guest?token=" + data.token;
  const refresh = async () => {
    setData(await api(url));
  };
  const openedKey = `vow-opened-${data.wedding.id}-${data.guests[0]?.household_id}`;
  useEffect(() => {
    try {
      if (localStorage.getItem(openedKey) === "yes") setOpened(true);
    } catch {}
  }, [openedKey]);
  const openInvitation = async () => {
    if (opening) return;
    setOpening(true);
    const gate = root.current?.querySelector<HTMLElement>(".gate-suite");
    if (
      gate &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      const animation = gate.animate(
        [
          { opacity: 1, transform: "translateY(0)" },
          { opacity: 0, transform: "translateY(-24px)" },
        ],
        {
          duration: 280,
          easing: "cubic-bezier(.22,1,.36,1)",
          fill: "forwards",
        },
      );
      await animation.finished.catch(() => {});
      if (!gate.isConnected) return;
    }
    setOpened(true);
    try {
      localStorage.setItem(openedKey, "yes");
    } catch {}
  };
  useEffect(() => {
    if (opened && opening)
      root.current
        ?.querySelector<HTMLElement>(".guest-hero h1")
        ?.focus({ preventScroll: true });
  }, [opened, opening]);
  useEffect(() => {
    fetch(url).catch(() => {});
  }, [url]);
  useGSAP(
    () => {
      if (!opened) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".guest-hero h1", { y: 35, duration: 1, ease: "power3.out" });
        gsap.from(".guest-hero .guest-hero-photo", {
          scale: 1.04,
          duration: 1.4,
          ease: "power2.out",
        });
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [opened] },
  );
  return (
    <div
      ref={root}
      className={"guest-experience atelier-invitation world-" + world.id}
      lang={locale}
    >
      {!opened ? (
        <main id="main" className="invitation-gate">
          <img className="gate-background" src={world.image} alt="" />
          <div className="gate-top">
            <Link href="/">VOW MOTION</Link>
            <button onClick={() => setLocale(locale === "en" ? "es" : "en")}>
              {locale === "en" ? "ES" : "EN"}
            </button>
          </div>
          <div className="gate-suite">
            <div className="gate-photo-card" aria-hidden="true">
              <img src={world.image} alt="" />
              <span>{data.wedding.location}</span>
            </div>
            <div className="gate-card">
              <span>{c.envelope}</span>
              <p className="gate-to">
                {data.guests.map((g) => g.name.split(" ")[0]).join(" & ")},
              </p>
              <p>{c.personal}</p>
              <div className="gate-monogram" aria-hidden="true">
                {data.wedding.names
                  .split(" & ")
                  .map((s) => s[0])
                  .join("")}
              </div>
              <h1>{data.wedding.names}</h1>
              <p>
                {formatDate(data.wedding.date, locale)}
                <br />
                {data.wedding.location}
              </p>
              <button
                className="gate-open"
                onClick={openInvitation}
                disabled={opening}
              >
                {c.open}
                <Arrow />
              </button>
            </div>
          </div>
          <small className="gate-bottom">
            {world.name.toUpperCase()} · AN INVITATION BY VOW MOTION
          </small>
        </main>
      ) : (
        <>
          <header className="guest-nav">
            <a href="#main" className="guest-monogram">
              {data.wedding.names
                .split(" & ")
                .map((s) => s[0])
                .join(" & ")}
            </a>
            <nav>
              <a href="#programme">{c.details}</a>
              <a href="#travel">{c.travel}</a>
              <button onClick={() => setModal("rsvp")}>
                {c.respond}
                <Arrow diagonal size={14} />
              </button>
            </nav>
            <button
              className="language-switch"
              onClick={() => setLocale(locale === "en" ? "es" : "en")}
            >
              {locale === "en" ? "ES" : "EN"}
            </button>
          </header>
          <main id="main">
            <section className="guest-hero">
              <span className="guest-hero-kicker">
                {data.wedding.status === "memories"
                  ? locale === "en"
                    ? "WE GOT MARRIED"
                    : "NOS CASAMOS"
                  : c.celebrate}
              </span>
              <div className="guest-hero-title">
                <h1 tabIndex={-1}>
                  <span>{data.wedding.names.split(" & ")[0]}</span>
                  <i>&</i>
                  <span>{data.wedding.names.split(" & ")[1] || ""}</span>
                </h1>
              </div>
              <p className="guest-hero-date">
                {formatDate(data.wedding.date, locale)}
                <span>{data.wedding.location}</span>
              </p>
              <div className="guest-hero-photo">
                <img
                  src={world.image}
                  alt={`${data.wedding.location}, the setting for our celebration`}
                  fetchPriority="high"
                />
                <div className="guest-photo-note">
                  <span>{data.wedding.location}</span>
                  <span>{formatDate(data.wedding.date, locale)}</span>
                </div>
              </div>
              <div className="guest-hero-footer">
                <span>{c.invited}</span>
                <a
                  href="#story"
                  aria-label={
                    locale === "en" ? "Read our story" : "Nuestra historia"
                  }
                >
                  <ArrowDownIcon size={22} />
                </a>
                <span>
                  {locale === "en"
                    ? "A day. A place. Our people."
                    : "Un día. Un lugar. Nuestra gente."}
                </span>
              </div>
            </section>
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
                  {locale === "en"
                    ? "A little love letter"
                    : "Una pequeña carta de amor"}
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
            <section className="guest-programme" id="programme">
              <div className="programme-intro">
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
                <div className="programme-heading">
                  {locale === "en" ? "The celebration" : "La celebración"}
                </div>
                {data.events.map((event, i) => (
                  <article className="programme-event" key={event.id}>
                    <span className="event-order">0{i + 1}</span>
                    <div>
                      <p className="programme-time">
                        {formatDate(event.starts_at, locale, {
                          timeZone: event.timezone,
                          weekday: "long",
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        · {eventTime(event.starts_at, event.timezone, locale)}
                      </p>
                      <h3>
                        {locale === "es" && event.title_es
                          ? event.title_es
                          : event.title}
                      </h3>
                      <p>{event.description}</p>
                      <span>{event.venue}</span>
                      <small>{event.dress_code}</small>
                      <a
                        href={
                          "https://www.google.com/maps/search/?api=1&query=" +
                          encodeURIComponent(event.venue + " " + event.address)
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="guest-text-link"
                      >
                        {c.directions}
                        <Arrow diagonal size={15} />
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </section>
            <section className="guest-travel" id="travel">
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
            <section className="rsvp-scene" id="rsvp">
              <div className="rsvp-stationery">
                <span className="rsvp-seal" aria-hidden="true">
                  {data.wedding.names
                    .split(" & ")
                    .map((n) => n[0])
                    .join(" & ")}
                </span>
                <span>
                  {data.guests.map((g) => g.name.split(" ")[0]).join(" & ")},
                </span>
                <h2>{c.rsvp}</h2>
                <p>
                  {locale === "en" ? "Kindly reply by" : "Confirma antes del"}{" "}
                  {formatDate(data.wedding.rsvp_deadline, locale)}.
                </p>
                <button
                  className="guest-button"
                  onClick={() => setModal("rsvp")}
                >
                  {data.responses.length ? c.update : c.respond}
                  <Arrow diagonal />
                </button>
                <small>
                  {locale === "en"
                    ? "Your invitation is just for your household."
                    : "Esta invitación es solo para tu familia."}
                </small>
              </div>
            </section>
            <section className="guest-memory">
              <div>
                <span>
                  {locale === "en"
                    ? "THROUGH YOUR EYES"
                    : "A TRAVÉS DE TUS OJOS"}
                </span>
                <h2>{c.photos}</h2>
                <p>
                  {locale === "en"
                    ? "The dance floor. The long lunch. The way the light fell. Help us remember the parts we might have missed."
                    : "La pista de baile. La sobremesa. La luz de la tarde. Ayúdanos a recordar cada pequeño momento."}
                </p>
                <button
                  className="guest-text-link"
                  onClick={() => setModal("photos")}
                >
                  {c.share}
                  <UploadSimpleIcon size={18} />
                </button>
              </div>
              <div className="memory-photos">
                {data.photos.length ? (
                  data.photos.slice(0, 4).map((p) => (
                    <figure key={p.id}>
                      <img
                        src={"/api/photos/" + p.id + "?token=" + data.token}
                        alt={p.caption || c.photos}
                      />
                      <figcaption>
                        {p.caption}
                        {!p.approved &&
                          (locale === "en"
                            ? " · Awaiting host approval"
                            : " · Pendiente de aprobación")}
                      </figcaption>
                    </figure>
                  ))
                ) : (
                  <div className="memory-placeholder">
                    <EnvelopeSimpleIcon size={32} />
                    <p>
                      {locale === "en"
                        ? "A collection waiting to happen."
                        : "Una colección por crear."}
                    </p>
                    <span>
                      {locale === "en"
                        ? "Yours could be the first memory."
                        : "El tuyo puede ser el primer recuerdo."}
                    </span>
                  </div>
                )}
              </div>
            </section>
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
        />
      )}
      {modal === "pass" && (
        <Modal title={c.pass} onClose={() => setModal(null)}>
          <div className="wedding-pass">
            <span>{c.day}</span>
            <h2>{data.wedding.names}</h2>
            <p>{data.guests.map((g) => g.name).join(" & ")}</p>
            <img
              className="pass-qr"
              src={"/api/guest/qr?token=" + data.token}
              alt={
                locale === "en"
                  ? "Your private invitation QR code"
                  : "Código QR de tu invitación privada"
              }
            />
            {data.events.map((e) => (
              <div className="pass-event" key={e.id}>
                <CalendarBlankIcon size={18} />
                <div>
                  <b>{locale === "es" && e.title_es ? e.title_es : e.title}</b>
                  <small>
                    {eventTime(e.starts_at, e.timezone)} · {e.venue}
                  </small>
                </div>
              </div>
            ))}
            {data.guests.map((g) => (
              <div className="report-line" key={g.id}>
                <span>{g.name}</span>
                <b>
                  {g.table_name ||
                    (locale === "en"
                      ? "Table to be announced"
                      : "Mesa por confirmar")}
                </b>
              </div>
            ))}
            <a
              className="button primary"
              href={"/api/guest/calendar?token=" + data.token}
            >
              {c.calendar}
              <Arrow />
            </a>
            <small>
              {locale === "en"
                ? "Keep this pass private. You can add this page to your home screen from your browser’s share menu."
                : "Mantén este pase privado. Puedes añadir esta página a tu pantalla de inicio desde el menú de tu navegador."}
            </small>
          </div>
        </Modal>
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
}: {
  data: GuestData;
  locale: "en" | "es";
  onClose: () => void;
  onSaved: () => Promise<void>;
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
    <Modal title={step === 2 ? c.saved : c.rsvp} onClose={onClose} wide>
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
          <button className="text-link" onClick={onClose}>
            {c.close}
          </button>
        </div>
      ) : (
        <>
          <div className="rsvp-progress">
            <span className={step === 0 ? "current" : ""}>
              01 · {locale === "en" ? "Your plans" : "Tus planes"}
            </span>
            <span className={step === 1 ? "current" : ""}>
              02 · {locale === "en" ? "The little details" : "Los detalles"}
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
                              <option value="Sea bass">
                                {locale === "en" ? "Sea bass" : "Lubina"}
                              </option>
                              <option value="Garden risotto">
                                {locale === "en"
                                  ? "Garden risotto (vegetarian)"
                                  : "Risotto de verduras (vegetariano)"}
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
