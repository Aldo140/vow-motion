"use client";
import { Arrow, Field, Modal, Notice, Submit, api } from "@/components/ui";
import type { GuestData } from "@/lib/types";
import { eventTime, formatDate } from "@/lib/worlds";
import { CheckIcon } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { copy } from "./copy";
import {
  WeddingUpdatesFields,
  type WeddingUpdatesContact,
} from "./wedding-updates-fields";
export function RsvpModal({
  data,
  locale,
  onClose,
  onSaved,
  onPass,
  onContact,
}: {
  data: GuestData;
  locale: "en" | "es";
  onClose: () => void;
  onSaved: () => Promise<void>;
  onPass: () => void;
  onContact: () => void;
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
  const [contacts, setContacts] = useState<WeddingUpdatesContact[]>(() =>
    data.guests.map((g) => ({
      guest_id: g.id,
      email: g.email || "",
      phone: g.phone || "",
      consent: g.consent,
    })),
  );
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
        <div
          className={
            "rsvp-success reply-keepsake " +
            (responses.some((r) => r.attending)
              ? "reply-accepted"
              : "reply-declined")
          }
        >
          <span className="success-mark">
            <CheckIcon size={30} />
          </span>
          <h3>
            {locale === "en"
              ? "Thank you, " + data.guests[0].name.split(" ")[0] + "."
              : "Gracias, " + data.guests[0].name.split(" ")[0] + "."}
          </h3>
          <p className="reply-keepsake-line">
            {responses.some((r) => r.attending)
              ? locale === "en"
                ? "A place in the celebration. A date to look forward to."
                : "Un lugar en la celebración. Una fecha para recordar."
              : locale === "en"
                ? "Sent with love. Received with understanding."
                : "Enviado con cariño. Recibido con comprensión."}
          </p>
          <p>
            {responses.some((r) => r.attending)
              ? c.savedDesc
              : locale === "en"
                ? "We’ll miss you. Your reply has been shared with the couple—thank you for letting them know."
                : "Te echaremos de menos. Hemos compartido tu respuesta con la pareja. Gracias por avisarnos."}
          </p>
          <p className="reply-saved-note">
            {locale === "en"
              ? "Your reply is saved. If your plans change, you can update it here."
              : "Tu respuesta está guardada. Si tus planes cambian, puedes actualizarla aquí."}
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
          <p className="reply-updates-saved">
            {locale === "en"
              ? contacts.some((c) => c.consent)
                ? `Wedding updates enabled for ${contacts
                    .filter((c) => c.consent)
                    .map(
                      (c) => data.guests.find((g) => g.id === c.guest_id)!.name,
                    )
                    .join(", ")}.`
                : "Wedding updates are off. You can still check this invitation for news."
              : contacts.some((c) => c.consent)
                ? "Tus preferencias de novedades están guardadas."
                : "Las novedades están desactivadas. Puedes consultar esta invitación."}
          </p>
          <button className="text-link" onClick={onContact}>
            {c.contact}
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
                  contacts,
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
                <section
                  className="wedding-updates-choice"
                  aria-labelledby="wedding-updates-title"
                >
                  <span className="eyebrow">
                    {locale === "en"
                      ? "ONE LAST LITTLE DETAIL · OPTIONAL"
                      : "UN ÚLTIMO DETALLE · OPCIONAL"}
                  </span>
                  <h3 id="wedding-updates-title">
                    {locale === "en"
                      ? "Stay in the loop."
                      : "Recibe las novedades."}
                  </h3>
                  <p>
                    {locale === "en"
                      ? "Would you like your hosts to send wedding reminders and changes of plan? Choose for yourself, or for someone who has asked you to manage their reply."
                      : "¿Quieres recibir recordatorios y cambios de planes de tus anfitriones? Elige por ti o por alguien que te haya pedido gestionar su respuesta."}
                  </p>
                  {contacts.map((contact) => (
                    <WeddingUpdatesFields
                      key={contact.guest_id}
                      value={contact}
                      name={
                        data.guests.find((g) => g.id === contact.guest_id)!.name
                      }
                      locale={locale}
                      onChange={(patch) =>
                        setContacts((previous) =>
                          previous.map((c) =>
                            c.guest_id === contact.guest_id
                              ? { ...c, ...patch }
                              : c,
                          ),
                        )
                      }
                    />
                  ))}
                </section>
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
              <Submit pending={busy} disabled={!!data.preview && step === 1}>
                {step === 0 ? c.next : c.save}
                <Arrow />
              </Submit>
            </div>
            <p className="form-note">
              {locale === "en"
                ? "Your plans are kept in this browser tab. Your reply and update preferences are saved together when you press Save."
                : "Tus planes se conservan en esta pestaña. Tu respuesta y preferencias se guardan juntas al pulsar Guardar."}
            </p>
          </form>
        </>
      )}
    </Modal>
  );
}
