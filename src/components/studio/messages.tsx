"use client";
import { PageHeading, type PanelProps } from "@/components/studio/shared";
import { Arrow, Field, Modal, Notice, Submit } from "@/components/ui";
import { eventInstant } from "@/lib/event-time";
import { formatDate } from "@/lib/worlds";
import { EnvelopeSimpleIcon, PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import Link from "next/link";
import { messagingAudience } from "@/lib/messaging-audience";

export function MessagesManager({ data, mutate, notify }: PanelProps) {
  const [compose, setCompose] = useState(false),
    [error, setError] = useState(""),
    [sending, setSending] = useState(""),
    [busy, setBusy] = useState(false),
    [audience, setAudience] = useState("everyone"),
    [channel, setChannel] = useState(
      data.user.is_demo || data.capabilities.email ? "email" : "invitation",
    ),
    [subject, setSubject] = useState(""),
    [body, setBody] = useState("");
  const { recipients, selected, missingContact, notOptedIn } =
    messagingAudience(data.guests, audience, channel);
  const emailReadiness = messagingAudience(data.guests, "everyone", "email");
  const templates = [
    {
      label: "RSVP reminder",
      audience: "pending",
      subject: `A little reminder · ${data.wedding.names}`,
      body: `We’re counting down to celebrating with you! Please let us know your plans by ${formatDate(data.wedding.rsvp_deadline)} using your personal invitation link.\n\nIf you need help finding it, reply to this message and we’ll help.\n\nWith love,\n${data.wedding.names}`,
    },
    {
      label: "Before you travel",
      audience: "attending",
      subject: `See you in ${data.wedding.location}`,
      body: `We can’t wait to see you in ${data.wedding.location}! Your personal invitation has the programme, venue details, and travel information in one place.\n\nTake a moment to check the latest details before you set off. Reply here if there’s anything we can help with.\n\nWith love,\n${data.wedding.names}`,
    },
  ];
  return (
    <>
      <PageHeading
        title="Keep everyone in the loop."
        description="A thoughtful note, a timely reminder, or a change of plans."
      >
        <button
          className="button primary"
          onClick={() => {
            setError("");
            setCompose(true);
          }}
        >
          <PlusIcon size={17} />
          Write a message
        </button>
      </PageHeading>
      <Notice>
        {data.user.is_demo
          ? "Demo messages are recorded in your development outbox. No email or SMS is sent."
          : "Email your guests, or post an update inside their private invitations. Published updates appear when guests visit."}
      </Notice>
      <section
        className="message-readiness"
        aria-labelledby="message-readiness-title"
      >
        <span className="eyebrow">READY TO REACH YOUR PEOPLE</span>
        <h2 id="message-readiness-title">
          Guests choose updates in their RSVP.
        </h2>
        <div className="message-readiness-stats">
          <span>
            <strong>{emailReadiness.recipients.length}</strong> ready for email
          </span>
          <span>
            <strong>{emailReadiness.notOptedIn}</strong> have not opted in
          </span>
          <span>
            <strong>{emailReadiness.missingContact}</strong> missing an email
          </span>
        </div>
        <p>
          Share each household’s private invitation link from your guest list.
          At the end of their RSVP, guests can choose{" "}
          <strong>Stay in the loop</strong> and add their contact details. They
          can also choose updates before or after replying under{" "}
          <strong>Contact & wedding updates</strong> in their invitation.
        </p>
        <p>
          Attending does not automatically subscribe a guest. While you wait,
          post a note <strong>inside the invitation</strong>; guests will see it
          when they visit. No email or text is sent.
        </p>
        <button
          className="button outline small"
          onClick={() => {
            setChannel("invitation");
            setError("");
            setCompose(true);
          }}
        >
          Write an invitation update <Arrow />
        </button>
        <Link
          className="button text"
          href={`/studio/guests?wid=${data.wedding.id}`}
        >
          Open guest list <Arrow />
        </Link>
      </section>
      <div className="message-list">
        {data.messages.map((m) => {
          const eligible = messagingAudience(data.guests, m.audience, m.channel)
            .recipients.length;
          return (
            <article className="message-card" key={m.id}>
              <EnvelopeSimpleIcon size={26} />
              <div>
                <div className="message-meta">
                  <span>
                    {m.channel.toUpperCase()} · {m.audience}
                  </span>
                  <span
                    className={
                      "status " +
                      (m.status === "draft" ? "pending" : "attending")
                    }
                  >
                    {m.status === "development"
                      ? "Development outbox"
                      : m.status === "published" &&
                          m.scheduled_at &&
                          new Date(m.scheduled_at) > new Date()
                        ? "Scheduled"
                        : m.status}
                  </span>
                </div>
                <h2>{m.subject}</h2>
                <p>{m.body}</p>
                {m.scheduled_at && (
                  <small>
                    Scheduled: {new Date(m.scheduled_at).toLocaleString()}
                  </small>
                )}
              </div>
              {m.status === "draft" && (
                <div className="message-blocked">
                  <p>
                    {eligible} {eligible === 1 ? "guest" : "guests"}{" "}
                    {m.channel === "invitation"
                      ? "can see this update"
                      : "can receive this message"}
                    .
                  </p>
                  {!eligible && (
                    <p>
                      {m.channel === "invitation"
                        ? "No guests match this audience."
                        : "Guests need to choose wedding updates and add contact details first."}
                    </p>
                  )}
                  {!eligible && m.channel !== "invitation" && (
                    <button
                      className="text-link"
                      onClick={() => {
                        setSubject(m.subject);
                        setBody(m.body);
                        setAudience(m.audience);
                        setChannel("invitation");
                        setError("");
                        setCompose(true);
                      }}
                    >
                      Use this note inside invitations
                    </button>
                  )}
                  <button
                    className="button outline small"
                    disabled={sending === m.id || !eligible}
                    onClick={async () => {
                      setSending(m.id);
                      try {
                        const result = (await mutate("send/" + m.id, {})) as {
                          development: boolean;
                          count: number;
                          published?: boolean;
                        };
                        notify(
                          result.published
                            ? `${result.count} guests can see this update in their invitation when it is due.`
                            : result.development
                              ? `${result.count} messages recorded in the development outbox.`
                              : `${result.count} messages accepted by the provider.`,
                        );
                      } catch (e) {
                        notify((e as Error).message);
                      } finally {
                        setSending("");
                      }
                    }}
                  >
                    {sending === m.id
                      ? "Processing…"
                      : m.channel === "invitation"
                        ? "Publish update"
                        : data.user.is_demo
                          ? "Preview send"
                          : "Send message"}
                    <Arrow />
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
      {!data.messages.length && (
        <div className="empty-state">
          <EnvelopeSimpleIcon size={36} />
          <h2>A little note goes a long way.</h2>
          <p>Write to everyone, or just the guests who need an update.</p>
        </div>
      )}
      {compose && (
        <Modal title="A note for your people" onClose={() => setCompose(false)}>
          {error && <Notice error>{error}</Notice>}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              setBusy(true);
              setError("");
              try {
                await mutate("messages", {
                  ...Object.fromEntries(f),
                  scheduled_at: f.get("scheduled_at")
                    ? eventInstant(
                        String(f.get("scheduled_at")),
                        data.wedding.timezone,
                      )
                    : "",
                });
                setCompose(false);
                setSubject("");
                setBody("");
                notify("Message draft saved.");
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="message-starters">
              <span className="eyebrow">A THOUGHTFUL START</span>
              <p>Start with a note for the moment. Make it sound like you.</p>
              <div>
                {templates.map((t) => (
                  <button
                    type="button"
                    className="button outline small"
                    key={t.label}
                    onClick={() => {
                      setSubject(t.subject);
                      setBody(t.body);
                      setAudience(t.audience);
                    }}
                  >
                    {t.label}
                    <Arrow size={14} />
                  </button>
                ))}
              </div>
            </div>
            <Field label="Subject">
              <input
                name="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                placeholder="A little note before we celebrate"
              />
            </Field>
            <div className="form-grid">
              <Field label="For whom?">
                <select
                  name="audience"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                >
                  <option value="everyone">Everyone</option>
                  <option value="pending">Awaiting reply</option>
                  <option value="attending">Attending</option>
                  <option value="declined">Unable to attend</option>
                  {[
                    ...new Set(
                      data.guests
                        .flatMap((g) => g.tags.split(",").map((t) => t.trim()))
                        .filter(Boolean),
                    ),
                  ].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="Channel">
                <select
                  name="channel"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                >
                  <option
                    value="email"
                    disabled={!data.user.is_demo && !data.capabilities.email}
                  >
                    Email
                  </option>
                  <option value="invitation">Inside the invitation</option>
                  {data.capabilities.sms && <option value="sms">SMS</option>}
                </select>
              </Field>
            </div>
            <Field label="Your message">
              <textarea
                name="body"
                rows={6}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
              />
            </Field>
            <div className="audience-preview" role="status">
              <strong>
                {recipients.length}{" "}
                {recipients.length === 1 ? "guest" : "guests"} can receive this{" "}
                {channel === "invitation"
                  ? "invitation update"
                  : channel === "email"
                    ? "email"
                    : "text"}
              </strong>
              <p>
                {recipients.length
                  ? recipients
                      .slice(0, 3)
                      .map((g) => g.name)
                      .join(", ") +
                    (recipients.length > 3
                      ? ` and ${recipients.length - 3} more.`
                      : ".")
                  : selected.length
                    ? "Guests can choose updates in their RSVP or in Contact & wedding updates in their invitation."
                    : "No guests match this audience. Choose another audience."}
              </p>
              <small>
                {channel === "invitation"
                  ? "Updates are visible inside the selected guests’ private household invitations."
                  : `${selected.length} in this audience. ${notOptedIn} have not opted in; ${missingContact} are missing ${channel === "email" ? "an email address" : "a mobile number"}. These groups can overlap.`}
              </small>
              {channel !== "invitation" &&
                !recipients.length &&
                selected.length > 0 && (
                  <button
                    className="button outline small"
                    type="button"
                    onClick={() => setChannel("invitation")}
                  >
                    Post inside their invitations instead <Arrow />
                  </button>
                )}
            </div>
            <Field label="Delivery">
              <span>Save now, review, then send from your message list.</span>
            </Field>
            <Field
              label="Schedule (optional)"
              hint={`Time in ${data.wedding.timezone}. Invitation updates become visible at this time. Scheduled email is dispatched by the daily delivery run after this time.`}
            >
              <input name="scheduled_at" type="datetime-local" />
            </Field>
            <Submit pending={busy}>
              Save draft <Arrow />
            </Submit>
          </form>
        </Modal>
      )}
    </>
  );
}
