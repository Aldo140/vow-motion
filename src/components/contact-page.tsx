"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useHydrated } from "./use-hydrated";
import MarketingNavigation from "./marketing-navigation";
import { Arrow, Brand } from "./ui";
import { contactEmail } from "@/lib/contact";

export default function ContactPage({ canSend }: { canSend: boolean }) {
  const ready = useHydrated();
  const [role, setRole] = useState<"couple" | "planner" | "">("");
  const [fields, setFields] = useState({
    name: "",
    email: "",
    location: "",
    date: "",
    business: "",
    message: "",
    website: "",
  });
  const [busy, setBusy] = useState(false),
    [sent, setSent] = useState(false),
    [error, setError] = useState("");
  const attempt = useRef({ signature: "", id: "" });
  const result = useRef<HTMLDivElement>(null);
  const [prepared, setPrepared] = useState(false);
  const [copied, setCopied] = useState(false);
  const change = (key: keyof typeof fields, value: string) =>
    setFields((previous) => ({ ...previous, [key]: value }));
  const emailBody = [
    fields.name && `From: ${fields.name}`,
    fields.email && `Reply to: ${fields.email}`,
    role === "planner"
      ? `Wedding planner: ${fields.business}`
      : role === "couple"
        ? `Wedding date: ${fields.date || "Not decided yet"}`
        : "",
    fields.location && `Location: ${fields.location}`,
    "",
    fields.message,
  ]
    .filter(Boolean)
    .join("\n");
  const mailto = `mailto:${contactEmail}?subject=${encodeURIComponent("A conversation about Vow Motion")}&body=${encodeURIComponent(emailBody)}`;
  return (
    <div className="contact-page">
      <MarketingNavigation homeLinks />
      <main id="main" className="contact-main">
        <section className="contact-intro">
          <span className="eyebrow">
            A LITTLE CONVERSATION. A LOVELY BEGINNING.
          </span>
          <h1>
            Tell us what
            <br />
            you’re <em>imagining.</em>
          </h1>
          <p>
            Whether you’re planning your own wedding or creating something
            special for your couples, we’d love to hear from you.
          </p>
          <div className="contact-direct">
            <span>PREFER A PERSONAL EMAIL?</span>
            <a href={`mailto:${contactEmail}`}>
              {contactEmail}
              <Arrow diagonal size={18} />
            </a>
            <p>You’ll be speaking with the small team building Vow Motion.</p>
          </div>
          <div className="contact-keepsake" aria-hidden="true">
            <img src="/images/wedding-details.webp" alt="" />
            <div>
              <span>V & M</span>
              <p>
                Thoughtfully made.
                <br />
                <em>Personally answered.</em>
              </p>
              <svg viewBox="0 0 120 24" fill="none">
                <path
                  d="M5 18Q35 6 63 14T115 8M44 12Q35 0 26 6Q32 18 44 12M69 14Q77 0 87 5Q85 18 69 14"
                  stroke="currentColor"
                />
              </svg>
            </div>
          </div>
        </section>
        <section className="contact-paper" aria-labelledby="contact-form-title">
          {sent ? (
            <div
              className="contact-success"
              ref={result}
              tabIndex={-1}
              role="status"
            >
              <span className="contact-success-mark" aria-hidden="true">
                ✓
              </span>
              <h2>Your note is on its way.</h2>
              <p>
                Thank you, {fields.name.split(" ")[0]}. We’ll reply to{" "}
                <strong>{fields.email}</strong>.
              </p>
              <p>
                In the meantime, you can explore an invitation or keep imagining
                what yours could be.
              </p>
              <Link
                className="button primary"
                href="/demo/riviera"
                prefetch={false}
              >
                Explore an invitation <Arrow diagonal />
              </Link>
              <Link href="/">Back to Vow Motion</Link>
            </div>
          ) : (
            <>
              <span className="contact-form-eyebrow">
                YOUR NOTE TO VOW MOTION
              </span>
              <h2 id="contact-form-title">Let’s start with you.</h2>
              <p className="contact-form-intro">
                A few details help us make our reply useful. No account needed.
              </p>
              <form
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (busy) return;
                  setError("");
                  if (!role) {
                    setError(
                      "Choose whether you’re getting married or planning weddings for others.",
                    );
                    return;
                  }
                  if (!canSend) {
                    setPrepared(true);
                    window.location.href = mailto;
                    return;
                  }
                  const payload = {
                    ...fields,
                    role,
                    ...(role === "couple" ? { business: "" } : { date: "" }),
                  };
                  const signature = JSON.stringify(payload);
                  if (attempt.current.signature !== signature)
                    attempt.current = { signature, id: crypto.randomUUID() };
                  setBusy(true);
                  try {
                    const response = await fetch("/api/contact", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        ...payload,
                        requestId: attempt.current.id,
                      }),
                    });
                    const body = await response.json();
                    if (!response.ok) throw new Error(body.error);
                    setSent(true);
                    requestAnimationFrame(() => result.current?.focus());
                  } catch (e) {
                    setError(
                      (e as Error).message ||
                        "We could not send your message. Please email us directly.",
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <fieldset disabled={busy || !ready} className="contact-role">
                  <legend>
                    What brings you here? <span>Choose one</span>
                  </legend>
                  <div>
                    {[
                      {
                        id: "couple",
                        title: "We’re getting married",
                        text: "For your own celebration",
                      },
                      {
                        id: "planner",
                        title: "I’m a wedding planner",
                        text: "For your business and couples",
                      },
                    ].map((option) => (
                      <label key={option.id} data-selected={role === option.id}>
                        <input
                          required
                          type="radio"
                          name="role"
                          value={option.id}
                          checked={role === option.id}
                          onChange={() =>
                            setRole(option.id as "couple" | "planner")
                          }
                        />
                        <span>
                          <b>{option.title}</b>
                          <small>{option.text}</small>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <fieldset disabled={busy || !ready} className="contact-fields">
                  <div className="contact-field-row">
                    <label>
                      Your name
                      <input
                        required
                        autoComplete="name"
                        maxLength={100}
                        minLength={2}
                        value={fields.name}
                        onChange={(e) => change("name", e.target.value)}
                      />
                    </label>
                    <label>
                      Email address
                      <input
                        required
                        type="email"
                        autoComplete="email"
                        maxLength={254}
                        value={fields.email}
                        onChange={(e) => change("email", e.target.value)}
                      />
                    </label>
                  </div>
                  {role && (
                    <div className="contact-field-row contact-extra" key={role}>
                      {role === "couple" ? (
                        <label>
                          Wedding date <span>Optional</span>
                          <input
                            type="date"
                            value={fields.date}
                            onChange={(e) => change("date", e.target.value)}
                          />
                          <small>Still deciding? Leave this blank.</small>
                        </label>
                      ) : (
                        <label>
                          Business or studio <span>Optional</span>
                          <input
                            autoComplete="organization"
                            maxLength={160}
                            value={fields.business}
                            onChange={(e) => change("business", e.target.value)}
                          />
                        </label>
                      )}
                      <label>
                        {role === "couple"
                          ? "Wedding location"
                          : "Where you work"}{" "}
                        <span>Optional</span>
                        <input
                          maxLength={160}
                          placeholder={
                            role === "couple"
                              ? "A city, a venue, or still exploring"
                              : "City, region, or destination weddings"
                          }
                          value={fields.location}
                          onChange={(e) => change("location", e.target.value)}
                        />
                      </label>
                    </div>
                  )}
                  <label>
                    {role === "planner"
                      ? "How could we help your business?"
                      : "What would you like to talk about?"}
                    <textarea
                      required
                      minLength={10}
                      maxLength={4000}
                      rows={5}
                      placeholder={
                        role === "planner"
                          ? "Tell us what you’re looking for, or what feels harder than it should in your current process."
                          : "A question, an idea, something you’re hoping to create. Start wherever you like."
                      }
                      value={fields.message}
                      onChange={(e) => change("message", e.target.value)}
                    />
                  </label>
                  <div className="contact-trap" aria-hidden="true">
                    <label>
                      Leave this empty
                      <input
                        tabIndex={-1}
                        autoComplete="off"
                        value={fields.website}
                        onChange={(e) => change("website", e.target.value)}
                      />
                    </label>
                  </div>
                </fieldset>
                {error && (
                  <div className="contact-error" role="alert">
                    <p>{error}</p>
                    <a href={mailto}>
                      Email this message directly <Arrow diagonal size={14} />
                    </a>
                  </div>
                )}
                <button
                  className="button primary contact-submit"
                  disabled={busy || !ready}
                >
                  {busy
                    ? "Sending your note…"
                    : canSend
                      ? "Send your note"
                      : "Open your email draft"}
                  <Arrow diagonal size={17} />
                </button>
                {!canSend && (
                  <p className="contact-privacy">
                    We’ll put these details into an email to {contactEmail}.
                    Your email app opens next; press Send there to finish.
                  </p>
                )}
                {prepared && (
                  <div className="contact-error" role="status">
                    <p>
                      Your note is ready for your email app. If it didn’t open,
                      copy your note and email it to {contactEmail}.
                    </p>
                    <button
                      type="button"
                      className="button outline small"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(emailBody);
                          setCopied(true);
                        } catch {
                          setError(
                            "Select and copy your message above, then email us directly.",
                          );
                        }
                      }}
                    >
                      {copied ? "Note copied" : "Copy your note"}
                    </button>
                  </div>
                )}
                <p className="contact-privacy">
                  We’ll use these details to reply to your enquiry.{" "}
                  <a href="/privacy">Privacy policy</a>
                </p>
              </form>
            </>
          )}
        </section>
      </main>
      <footer className="marketing-footer">
        <Brand />
        <span>A beautiful day starts with a conversation.</span>
        <a href="/privacy">Privacy</a>
        <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
      </footer>
    </div>
  );
}
