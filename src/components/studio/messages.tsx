"use client";
import { PageHeading, type PanelProps } from "@/components/studio/shared";
import { Arrow, Field, Modal, Notice, Submit } from "@/components/ui";
import { eventInstant } from "@/lib/event-time";
import { formatDate } from "@/lib/worlds";
import { EnvelopeSimpleIcon, PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";

export function MessagesManager({ data, mutate, notify }: PanelProps) {
  const [compose, setCompose] = useState(false),
    [error, setError] = useState(""),
    [sending, setSending] = useState(""),
    [busy, setBusy] = useState(false),
    [audience, setAudience] = useState("everyone"),
    [channel, setChannel] = useState("email"),
    [subject, setSubject] = useState(""),
    [body, setBody] = useState("");
  const recipients = data.guests.filter(
    (g) =>
      (channel === "invitation" ||
        (g.consent && (channel === "email" ? g.email : g.phone))) &&
      (audience === "everyone" ||
        g.status === audience ||
        g.tags
          .split(",")
          .map((t) => t.trim())
          .includes(audience)),
  );
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
      <div className="message-list">
        {data.messages.map((m) => (
          <article className="message-card" key={m.id}>
            <EnvelopeSimpleIcon size={26} />
            <div>
              <div className="message-meta">
                <span>
                  {m.channel.toUpperCase()} · {m.audience}
                </span>
                <span
                  className={
                    "status " + (m.status === "draft" ? "pending" : "attending")
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
              <button
                className="button outline small"
                disabled={sending === m.id}
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
            )}
          </article>
        ))}
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
                  <option value="everyone">Everyone with consent</option>
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
                  : "Choose another audience, or add contact details and messaging consent in your guest list."}
              </p>
              <small>
                {channel === "invitation"
                  ? "Updates are visible inside the selected guests’ private household invitations."
                  : "Only guests with contact details and messaging consent are included."}
              </small>
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
