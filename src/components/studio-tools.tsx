"use client";
import { eventInstant } from "@/lib/event-time";
import { useState } from "react";
import {
  PlusIcon,
  PencilSimpleIcon,
  CheckIcon,
  ArrowUpRightIcon,
  TrashIcon,
  EnvelopeSimpleIcon,
  ArmchairIcon,
  ImagesIcon,
  LockSimpleIcon,
} from "@phosphor-icons/react";
import { PageHeading, PreviewButton, type PanelProps } from "./studio";
import { Modal, Field, Submit, Notice, Arrow } from "./ui";
import { worlds, getWorld, formatDate } from "@/lib/worlds";
import type { World, Travel } from "@/lib/types";
export function ExperienceManager(props: PanelProps) {
  const { data, mutate, notify } = props;
  const [selected, setSelected] = useState<World>(data.wedding.world),
    [story, setStory] = useState(data.wedding.story),
    [busy, setBusy] = useState(false);
  return (
    <>
      <PageHeading
        title="A world that feels like you."
        description="Considered choices. A complete identity. Your own point of view."
      >
        <PreviewButton {...props} />
        <button
          className="button primary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await mutate(
                "settings",
                { ...data.wedding, world: selected, story },
                "PATCH",
              );
              notify("Your wedding identity is saved.");
            } catch (e) {
              notify((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Saving…" : "Save your experience"}
          <CheckIcon size={17} />
        </button>
      </PageHeading>
      <div className="world-choice-grid">
        {worlds.map((w) => (
          <button
            className={
              "world-choice world-" +
              w.id +
              " " +
              (selected === w.id ? "selected" : "")
            }
            key={w.id}
            onClick={() => setSelected(w.id)}
            aria-pressed={selected === w.id}
          >
            <div>
              <img src={w.image} alt={w.name + " scene direction"} />
              <h2>{w.name}</h2>
              {selected === w.id && (
                <span className="world-check">
                  <CheckIcon size={18} />
                </span>
              )}
            </div>
            <h3>{w.name}</h3>
            <p>{w.description}</p>
            <span className="swatches">
              {w.palette.map((c) => (
                <i style={{ background: c }} key={c} />
              ))}
            </span>
          </button>
        ))}
      </div>
      <section className="content-editor">
        <div>
          <h2>Your story, in your words.</h2>
          <p className="muted-copy">
            This becomes part of your invitation experience. Write the way you
            would speak to your favourite people.
          </p>
        </div>
        <Field label="Your story">
          <textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            rows={6}
          />
        </Field>
      </section>
      <div className="identity-summary">
        <span>YOUR IDENTITY</span>
        <h3>{getWorld(selected).name}</h3>
        <p>Invitation · Website · RSVP · Wedding pass · Memories</p>
        <div className="swatches">
          {getWorld(selected).palette.map((c) => (
            <span style={{ background: c }} key={c} />
          ))}
        </div>
      </div>
    </>
  );
}
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
      g.consent &&
      (channel === "email" ? g.email : g.phone) &&
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
          : "Messages use the configured email or SMS provider. Without credentials, they are saved to a development outbox."}
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
                  {m.status === "development" ? "Development outbox" : m.status}
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
                    };
                    notify(
                      result.development
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
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
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
                {channel === "email" ? "email" : "text"}
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
                Only guests with contact details and messaging consent are
                included.
              </small>
            </div>
            <Field label="Delivery">
              <span>Save now, review, then send from your message list.</span>
            </Field>
            <Field
              label="Schedule (optional)"
              hint={`Time in ${data.wedding.timezone}. Scheduled delivery requires the delivery worker to be running. Leave blank to send manually.`}
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
export function SeatingManager({ data, mutate, notify }: PanelProps) {
  const [add, setAdd] = useState(false),
    [search, setSearch] = useState("");
  const attending = data.guests.filter((g) => g.status === "attending"),
    unassigned = attending.filter(
      (g) => !g.table_id && g.name.toLowerCase().includes(search.toLowerCase()),
    );
  const assign = async (guestId: string, tableId: string | null) => {
    try {
      await mutate("seating", { guest_id: guestId, table_id: tableId });
      notify(
        tableId ? "A place at the table, saved." : "Guest moved to unassigned.",
      );
    } catch (e) {
      notify((e as Error).message);
    }
  };
  return (
    <>
      <PageHeading
        title="A place for everyone."
        description={`${attending.filter((g) => g.table_id).length} of ${attending.length} attending guests seated. Drag a guest, or use their table menu.`}
      >
        <a
          className="button outline"
          href={"/api/studio/export?wedding=" + data.wedding.id}
        >
          Export seating <Arrow diagonal />
        </a>
        <button className="button primary" onClick={() => setAdd(true)}>
          <PlusIcon size={17} />
          Add table
        </button>
      </PageHeading>
      <div className="seating-layout">
        <aside className="unassigned">
          <h2>
            Still finding their place <span>{unassigned.length}</span>
          </h2>
          <input
            aria-label="Search unassigned guests"
            placeholder="Find a guest"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {unassigned.map((g) => (
            <div
              className="seating-guest"
              key={g.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("text/plain", g.id)}
            >
              <span className="avatar">
                {g.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
              <div>
                <b>{g.name}</b>
                <small>{g.dietary || g.meal}</small>
                <select
                  aria-label={"Table for " + g.name}
                  value=""
                  onChange={(e) => assign(g.id, e.target.value)}
                >
                  <option value="">Choose a table</option>
                  {data.tables.map((t) => (
                    <option value={t.id} key={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
          {!unassigned.length && (
            <p className="muted-copy">
              {attending.length
                ? "Everyone has a place."
                : "Guests will appear here when they accept their invitation."}
            </p>
          )}
        </aside>
        <div className="seating-floor">
          {data.tables.map((t) => {
            const seated = attending.filter((g) => g.table_id === t.id);
            return (
              <section
                className="seating-table"
                key={t.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  assign(e.dataTransfer.getData("text/plain"), t.id);
                }}
              >
                <div className="table-diagram">
                  <ArmchairIcon size={25} />
                  <h2>{t.name}</h2>
                  <span>
                    {seated.length} / {t.capacity} seats
                  </span>
                </div>
                <div className="seat-slots">
                  {seated.map((g) => (
                    <div key={g.id}>
                      <span>
                        {g.name}
                        <small>{g.dietary}</small>
                      </span>
                      <button
                        className="icon-button"
                        aria-label={"Unseat " + g.name}
                        onClick={() => assign(g.id, null)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {Array.from(
                    { length: Math.max(0, t.capacity - seated.length) },
                    (_, i) => (
                      <div className="empty-seat" key={i}>
                        <span>Open seat</span>
                        <PlusIcon size={13} />
                      </div>
                    ),
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
      {add && (
        <Modal title="Make room at the table" onClose={() => setAdd(false)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              try {
                await mutate("tables", {
                  name: f.get("name"),
                  capacity: Number(f.get("capacity")),
                });
                setAdd(false);
                notify("Table added.");
              } catch (e) {
                notify((e as Error).message);
              }
            }}
          >
            <Field label="Table name">
              <input name="name" required placeholder="Olivo" />
            </Field>
            <Field label="Seats">
              <input
                name="capacity"
                type="number"
                min={1}
                max={30}
                defaultValue={8}
                required
              />
            </Field>
            <Submit>
              Add table
              <Arrow />
            </Submit>
          </form>
        </Modal>
      )}
    </>
  );
}
export function TravelManager({ data, mutate, notify }: PanelProps) {
  const [adding, setAdding] = useState<"travel" | "registry" | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [editing, setEditing] = useState<
      (Partial<Travel> & { id: string; title: string; url: string }) | null
    >(null);
  return (
    <>
      <PageHeading
        title="The journey is part of it."
        description="Help your guests arrive, settle in, and feel at home."
      >
        <button
          className="button outline"
          onClick={() => {
            setEditing(null);
            setError("");
            setAdding("registry");
          }}
        >
          Add registry link
          <PlusIcon size={16} />
        </button>
        <button
          className="button primary"
          onClick={() => {
            setEditing(null);
            setError("");
            setAdding("travel");
          }}
        >
          Add travel detail
          <PlusIcon size={16} />
        </button>
      </PageHeading>
      <div className="travel-studio">
        <img
          src={getWorld(data.wedding.world).image}
          alt="Your wedding destination"
        />
        <div>
          {data.travel.map((t) => (
            <article className="travel-item" key={t.id}>
              <span className="eyebrow">{t.type}</span>
              <h2>{t.title}</h2>
              <p>{t.description}</p>
              {t.price && <small>{t.price}</small>}
              <div>
                <a
                  href={
                    t.url ||
                    "https://www.google.com/maps/search/?api=1&query=" +
                      encodeURIComponent(t.address)
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="text-link"
                >
                  {t.url ? "Visit website" : "View directions"}
                  <Arrow diagonal size={15} />
                </a>
                <button
                  className="button outline small"
                  onClick={() => {
                    setEditing(t);
                    setError("");
                    setAdding("travel");
                  }}
                  aria-label={"Edit " + t.title}
                >
                  <PencilSimpleIcon size={16} />
                  Edit
                </button>
                <button
                  className="icon-button"
                  aria-label={"Remove " + t.title}
                  onClick={async () => {
                    await mutate("travel/" + t.id, undefined, "DELETE");
                    notify("Travel detail removed.");
                  }}
                >
                  <TrashIcon size={16} />
                </button>
              </div>
            </article>
          ))}
          {!data.travel.length && (
            <div className="empty-state">
              <h2>Help them find their way.</h2>
              <p>Add hotels, transport, and a few local favourites.</p>
            </div>
          )}
        </div>
      </div>
      <section className="registry-editor">
        <h2>A note on gifts.</h2>
        <p className="muted-copy">
          Link to a registry you already love. Your guests book or purchase
          directly with the provider.
        </p>
        {data.registry.map((r) => (
          <div className="report-line" key={r.id}>
            <a href={r.url} target="_blank" rel="noreferrer">
              {r.title}
              <Arrow diagonal />
            </a>
            <button
              className="button outline small"
              onClick={() => {
                setEditing(r);
                setError("");
                setAdding("registry");
              }}
              aria-label={"Edit " + r.title}
            >
              <PencilSimpleIcon size={16} />
              Edit
            </button>
            <button
              className="icon-button"
              aria-label={"Remove " + r.title}
              onClick={() => mutate("registry/" + r.id, undefined, "DELETE")}
            >
              <TrashIcon size={16} />
            </button>
          </div>
        ))}
      </section>
      {adding && (
        <Modal
          title={
            adding === "travel" ? "A thoughtful travel detail" : "Your registry"
          }
          onClose={() => setAdding(null)}
        >
          {error && <Notice error>{error}</Notice>}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              try {
                await mutate(
                  adding + (editing ? "/" + editing.id : ""),
                  Object.fromEntries(new FormData(e.currentTarget)),
                  editing ? "PATCH" : "POST",
                );
                setAdding(null);
                notify("Guest information saved.");
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <Field label="Title">
              <input name="title" defaultValue={editing?.title} required />
            </Field>
            {adding === "travel" && (
              <>
                <Field label="Type">
                  <select name="type" defaultValue={editing?.type || "hotel"}>
                    <option value="hotel">Accommodation</option>
                    <option value="transport">Transportation</option>
                    <option value="guide">Local guide</option>
                  </select>
                </Field>
                <Field label="Description">
                  <textarea
                    name="description"
                    defaultValue={editing?.description}
                    required
                    rows={4}
                  />
                </Field>
                <Field label="Address">
                  <input name="address" defaultValue={editing?.address} />
                </Field>
                <Field label="Price note (optional)">
                  <input name="price" defaultValue={editing?.price} />
                </Field>
              </>
            )}
            <Field label="Website link">
              <input
                name="url"
                defaultValue={editing?.url}
                type="url"
                placeholder="https://"
                required={adding === "registry"}
              />
            </Field>
            <Submit pending={busy}>
              Save detail
              <Arrow />
            </Submit>
          </form>
        </Modal>
      )}
    </>
  );
}
export function PhotosManager(props: PanelProps) {
  const { data, mutate, notify } = props;
  return (
    <>
      <PageHeading
        title="The moments between."
        description="A shared collection, seen through the eyes of your people."
      >
        <PreviewButton {...props} />
      </PageHeading>
      <Notice>
        Guests upload through their personal invitation. Photos stay private
        until you approve them.
      </Notice>
      {data.photos.length ? (
        <div className="photo-grid">
          {data.photos.map((p) => (
            <figure key={p.id}>
              <img
                src={"/api/photos/" + p.id}
                alt={p.caption || "A guest-shared wedding memory"}
              />
              <figcaption>
                <span>{p.caption || "A little memory"}</span>
                <span
                  className={"status " + (p.approved ? "attending" : "pending")}
                >
                  {p.approved ? "In the gallery" : "Awaiting approval"}
                </span>
              </figcaption>
              <div>
                <button
                  className="button outline small"
                  onClick={async () => {
                    await mutate(
                      "photos/" + p.id,
                      { approved: !p.approved },
                      "PATCH",
                    );
                    notify(
                      p.approved
                        ? "Photo hidden from guests."
                        : "Photo approved.",
                    );
                  }}
                >
                  {p.approved ? "Hide photo" : "Approve photo"}
                </button>
                <a
                  href={"/api/photos/" + p.id}
                  download={"memory-" + p.id + ".webp"}
                  className="text-link"
                >
                  Download <Arrow diagonal size={14} />
                </a>
              </div>
            </figure>
          ))}
        </div>
      ) : (
        <div className="empty-state photo-empty">
          <ImagesIcon size={40} />
          <h2>The best photos haven’t happened yet.</h2>
          <p>
            Invite your guests to add their perspective. Their uploads will
            arrive here for your approval.
          </p>
          <PreviewButton {...props} />
        </div>
      )}
    </>
  );
}
export function CollaboratorsManager({ data, mutate, notify }: PanelProps) {
  const [add, setAdd] = useState(false),
    [error, setError] = useState("");
  return (
    <>
      <PageHeading
        title="Good things take a team."
        description="Share your Studio with your partner, planner, or someone you trust."
      >
        <button className="button primary" onClick={() => setAdd(true)}>
          <PlusIcon size={17} />
          Add collaborator
        </button>
      </PageHeading>
      {!data.user.email_verified && !data.user.is_demo && (
        <Notice>
          To access weddings shared with your email,{" "}
          <a href="/verify">verify your email address</a>.
        </Notice>
      )}
      <div className="collaborator-list">
        <div className="collaborator">
          <span className="avatar">{data.user.name[0]}</span>
          <div>
            <b>{data.user.name}</b>
            <small>{data.user.email}</small>
          </div>
          <span className="status attending">{data.role}</span>
        </div>
        {data.collaborators.map((c) => (
          <div className="collaborator" key={c.id}>
            <span className="avatar">{c.email[0].toUpperCase()}</span>
            <div>
              <b>{c.email}</b>
              <small>Access after signing in with this email</small>
            </div>
            <span className="status">{c.role}</span>
            <button
              className="icon-button"
              aria-label={"Remove access for " + c.email}
              onClick={async () => {
                try {
                  await mutate("collaborators/" + c.id, undefined, "DELETE");
                  notify("Access removed.");
                } catch (e) {
                  notify((e as Error).message);
                }
              }}
            >
              <TrashIcon size={17} />
            </button>
          </div>
        ))}
      </div>
      <div className="permission-notes">
        <LockSimpleIcon size={26} />
        <div>
          <h2>Just the right level of access.</h2>
          <p>
            <b>Partner</b> can manage the wedding, privacy, and team.{" "}
            <b>Planner</b> manages the guest experience and logistics.{" "}
            <b>Viewer</b> can read and export, but cannot make changes.
          </p>
          <p>
            Adding an email grants access; it does not send an invitation. Share
            the sign-in link with your collaborator.
          </p>
        </div>
      </div>
      {add && (
        <Modal
          title="Bring someone into your Studio"
          onClose={() => setAdd(false)}
        >
          {error && <Notice error>{error}</Notice>}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await mutate(
                  "collaborators",
                  Object.fromEntries(new FormData(e.currentTarget)),
                );
                setAdd(false);
                notify("Collaborator access added.");
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <Field label="Email address">
              <input type="email" name="email" required />
            </Field>
            <Field label="Role">
              <select name="role">
                <option value="partner">Partner</option>
                <option value="planner">Planner</option>
                <option value="viewer">Viewer</option>
              </select>
            </Field>
            <Submit>
              Add collaborator
              <Arrow />
            </Submit>
          </form>
        </Modal>
      )}
    </>
  );
}
export function SettingsManager({ data, mutate, notify }: PanelProps) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [privacy, setPrivacy] = useState(data.wedding.privacy);
  return (
    <>
      <PageHeading
        title="The details behind the day."
        description="Your wedding essentials, privacy, and publishing controls."
      />
      {error && <Notice error>{error}</Notice>}
      <form
        className="settings-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          const form = Object.fromEntries(new FormData(e.currentTarget));
          if (!form.password) delete form.password;
          try {
            await mutate(
              "settings",
              { ...data.wedding, ...form, privacy },
              "PATCH",
            );
            notify("Wedding settings saved.");
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <section>
          <div>
            <h2>Your wedding</h2>
            <p>The essentials that carry through your guest experience.</p>
          </div>
          <div>
            <Field label="Names">
              <input name="names" defaultValue={data.wedding.names} required />
            </Field>
            <div className="form-grid">
              <Field label="Date">
                <input
                  name="date"
                  type="date"
                  defaultValue={data.wedding.date}
                  required
                />
              </Field>
              <Field label="RSVP deadline">
                <input
                  name="rsvp_deadline"
                  type="date"
                  defaultValue={data.wedding.rsvp_deadline}
                  required
                />
              </Field>
            </div>
            <Field label="Location">
              <input
                name="location"
                defaultValue={data.wedding.location}
                required
              />
            </Field>
            <Field label="Timezone">
              <input
                name="timezone"
                defaultValue={data.wedding.timezone}
                required
              />
            </Field>
            <Field label="Default guest language">
              <select name="locale" defaultValue={data.wedding.locale}>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </Field>
          </div>
        </section>
        <section>
          <div>
            <h2>Privacy & publishing</h2>
            <p>
              Personal events always require a guest invitation, even when your
              story is public.
            </p>
          </div>
          <div>
            <Field label="Who can see your wedding story?">
              <select
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value)}
              >
                <option value="invite-only">
                  Only guests with a personal link
                </option>
                <option value="public">
                  Public story, private guest details
                </option>
                <option value="password">Password-protected story</option>
              </select>
            </Field>
            {privacy === "password" && (
              <Field
                label="Wedding password"
                hint="At least 8 characters. Leave blank to keep an existing password."
              >
                <input
                  name="password"
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                />
              </Field>
            )}
            <Field label="Experience mode">
              <select name="status" defaultValue={data.wedding.status}>
                <option value="draft">Draft</option>
                <option value="published">
                  Published · Before the wedding
                </option>
                <option value="memories">Memories · After the wedding</option>
              </select>
            </Field>
            <p className="muted-copy">
              Your story address:{" "}
              <a href={"/w/" + data.wedding.slug}>
                {"/w/" + data.wedding.slug} <ArrowUpRightIcon size={13} />
              </a>
            </p>
          </div>
        </section>
        <div className="form-actions">
          <Submit pending={busy}>
            Save settings
            <CheckIcon size={17} />
          </Submit>
        </div>
      </form>
      <section className="settings-extra">
        <div>
          <h2>A name of your own.</h2>
          <p className="muted-copy">
            Connect a custom domain when deployed. DNS verification and SSL are
            managed through your hosting provider.
          </p>
        </div>
        <div>
          {data.domains.map((d) => (
            <div className="report-line" key={d.id}>
              <b>{d.hostname}</b>
              <span className="status pending">
                {d.status === "pending" ? "Awaiting DNS setup" : d.status}
              </span>
            </div>
          ))}
          <form
            className="inline-form"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await mutate(
                  "domains",
                  Object.fromEntries(new FormData(e.currentTarget)),
                );
                notify(
                  "Domain saved. See deployment instructions for DNS setup.",
                );
              } catch (e) {
                notify((e as Error).message);
              }
            }}
          >
            <input
              name="hostname"
              aria-label="Custom domain"
              placeholder="elenaandmatteo.com"
              required
            />
            <button className="button outline">
              Add domain
              <PlusIcon size={16} />
            </button>
          </form>
        </div>
      </section>
      <section className="settings-extra">
        <div>
          <h2>Your collection</h2>
          <p className="muted-copy">
            No card data is stored here. Checkout opens securely with Stripe
            when production billing is configured.
          </p>
        </div>
        <div className="billing-buttons">
          {["essential", "signature", "bespoke"].map((plan) => (
            <button
              key={plan}
              className="button outline"
              onClick={async () => {
                try {
                  const r = (await mutate("checkout", { plan })) as {
                    url: string;
                  };
                  window.location.href = r.url;
                } catch (e) {
                  notify((e as Error).message);
                }
              }}
            >
              {plan}
              <Arrow diagonal size={16} />
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
