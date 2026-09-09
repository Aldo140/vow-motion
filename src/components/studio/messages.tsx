"use client";
import { PageHeading, type PanelProps } from "@/components/studio/shared";
import { Arrow, Field, Modal, Notice, Submit } from "@/components/ui";
import { eventInstant } from "@/lib/event-time";
import { formatDate } from "@/lib/worlds";
import {
  ArrowClockwiseIcon,
  EnvelopeSimpleIcon,
  PlusIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import Link from "next/link";
import { messagingAudience } from "@/lib/messaging-audience";
import { canRetry, despatchState } from "@/lib/message-state";
import type { Message } from "@/lib/types";

const channelNoun = (channel: string) =>
  channel === "invitation"
    ? "invitation update"
    : channel === "sms"
      ? "text message"
      : "email";

const contactNoun = (channel: string) =>
  channel === "sms" ? "mobile number" : "email address";

/** The venue's own clock, which is the one a couple schedules against. */
const atVenue = (instant: string, timezone: string) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(instant));

/** Why a guest is out of reach, stated as a count, a cause and a way to fix it. */
function ReachReasons({
  reasons,
}: {
  reasons: { count: number; cause: string; remedy: React.ReactNode }[];
}) {
  const live = reasons.filter((r) => r.count > 0);
  if (!live.length) return null;
  return (
    <ul className="reach-reasons">
      {live.map((reason) => (
        <li key={reason.cause}>
          <span className="reach-count">{reason.count}</span>
          <span>
            {reason.cause} <em>{reason.remedy}</em>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function MessagesManager({ data, mutate, notify }: PanelProps) {
  const [compose, setCompose] = useState(false),
    [error, setError] = useState(""),
    [working, setWorking] = useState(""),
    [busy, setBusy] = useState(false),
    [audience, setAudience] = useState("everyone"),
    [channel, setChannel] = useState(
      data.user.is_demo || data.capabilities.email ? "email" : "invitation",
    ),
    [subject, setSubject] = useState(""),
    [body, setBody] = useState("");

  const total = data.guests.length;
  const emailReady = data.user.is_demo || data.capabilities.email;
  const guestsLink = `/studio/guests?wid=${data.wedding.id}`;
  const invitationsLink = `/studio/invitations?wid=${data.wedding.id}`;
  const successfullyInvited = new Set(
    data.invitationDispatches
      .filter((delivery) => ["development", "sent", "delivered"].includes(delivery.status))
      .map((delivery) => delivery.household_id),
  );
  const householdsWithEmail = new Set(
    data.guests.filter((guest) => guest.email.trim()).map((guest) => guest.household_id),
  );
  const invitationsReady = data.households.filter(
    (household) => householdsWithEmail.has(household.id) && !successfullyInvited.has(household.id),
  ).length;
  const withoutLink = data.households.filter(
    (h) => !(data.invitedHouseholds || []).includes(h.id),
  ).length;

  const { recipients, selected, awaitingOptIn, awaitingContact, awaitingBoth } =
    messagingAudience(data.guests, audience, channel);

  const openCompose = (next?: { channel?: string; audience?: string }) => {
    setError("");
    if (next?.channel) setChannel(next.channel);
    if (next?.audience) setAudience(next.audience);
    setCompose(true);
  };

  // Every way of writing, what it asks of a guest, and how far it reaches now.
  const ways = [
    "invitation",
    "email",
    ...(data.capabilities.sms ? ["sms"] : []),
  ].map((id) => {
    const reach = messagingAudience(data.guests, "everyone", id);
    return {
      id,
      available: id === "email" ? emailReady : true,
      name:
        id === "invitation"
          ? "Inside the invitation"
          : id === "email"
            ? "Email"
            : "Text message",
      reach: reach.recipients.length,
      what:
        id === "invitation"
          ? "Posted on each household’s own invitation page. Nothing is asked of your guests — the note is waiting the next time they open their link."
          : id === "email"
            ? "Sent to the address a guest gave you, and only if they chose to hear from you. Both are theirs to give."
            : "Sent to the mobile number a guest gave you, and only if they chose to hear from you.",
      unavailable:
        id === "email" && !emailReady
          ? "Email delivery is not switched on for this Studio yet, so this channel cannot send. Everything below still works inside the invitation."
          : "",
      action:
        id === "invitation"
          ? "Write an invitation update"
          : id === "email"
            ? "Write an email"
            : "Write a text message",
      reasons:
        id === "invitation"
          ? [
              {
                count: withoutLink,
                cause: `${withoutLink === 1 ? "household has" : "households have"} no invitation link yet, so your note waits on a page they cannot open.`,
                remedy: <Link href={invitationsLink}>Create their links</Link>,
              },
            ]
          : [
              {
                count: reach.awaitingOptIn,
                cause:
                  "have not chosen wedding updates — guests opt in when they RSVP.",
                remedy: (
                  <Link href={invitationsLink}>Share their invitations</Link>
                ),
              },
              {
                count: reach.awaitingContact,
                cause: `chose updates but left no ${contactNoun(id)}.`,
                remedy: <Link href={guestsLink}>Add it to the guest list</Link>,
              },
              {
                count: reach.awaitingBoth,
                cause: `have given neither permission nor ${contactNoun(id) === "email address" ? "an email address" : "a mobile number"}.`,
                remedy: (
                  <Link href={invitationsLink}>Send their invitation</Link>
                ),
              },
            ],
    };
  });

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

  const outcomeOf = (messageId: string) => {
    const rows = (data.deliveries || []).filter(
      (d) => d.message_id === messageId,
    );
    return {
      delivered: rows.filter((d) =>
        ["sent", "development", "published"].includes(d.status),
      ).length,
      failed: rows.filter((d) => d.status === "failed").length,
      reason:
        rows.find((d) => d.status === "failed" && d.error)?.error?.trim() || "",
    };
  };

  const run = async (
    message: Message,
    payload: Record<string, unknown>,
    verb: string,
  ) => {
    setWorking(message.id);
    try {
      const result = (await mutate("send/" + message.id, payload)) as {
        development?: boolean;
        published?: boolean;
        count: number;
        failed?: number;
        skipped?: number;
      };
      const failed = result.failed || 0;
      notify(
        result.published
          ? `Published. ${result.count} ${result.count === 1 ? "guest" : "guests"} will see this in their invitation${message.scheduled_at ? " when it is due" : ""}.`
          : failed
            ? `${result.count} ${verb}, ${failed} could not be delivered. Open the message to see why.`
            : result.development
              ? `${result.count} recorded in your development outbox. Nothing left the building.`
              : `${result.count} ${verb}.`,
        failed ? "error" : "success",
      );
    } catch (e) {
      notify((e as Error).message, "error");
    } finally {
      setWorking("");
    }
  };

  return (
    <>
      <PageHeading
        title="The post room."
        description="Write to your guests here. Every note says who it can reach before it goes."
      >
        <button className="button primary" onClick={() => openCompose()}>
          <PlusIcon size={17} />
          Write a message
        </button>
      </PageHeading>

      {data.user.is_demo && (
        <Notice>
          You’re in your demo Studio, so nothing is really sent. Messages are
          recorded in a development outbox exactly as a real send would be.
        </Notice>
      )}

      <section className="message-journey" aria-labelledby="message-journey-title">
        <div className="message-journey-copy">
          <span className="eyebrow">STARTING THE CONVERSATION?</span>
          <h2 id="message-journey-title">The first invitation has its own send.</h2>
          <p>
            Vow Motion prepares one private email and link for every household at once.
            After guests reply and choose updates, return here for reminders and wedding notes.
          </p>
          <Link className="button primary" href={invitationsLink}>
            {invitationsReady
              ? `Prepare ${invitationsReady} ${invitationsReady === 1 ? "invitation" : "invitations"}`
              : "Review invitation delivery"} <Arrow />
          </Link>
        </div>
        <ol className="message-journey-steps">
          <li className="complete"><span>01</span><div><strong>Invite</strong><small>Private household emails</small></div></li>
          <li><span>02</span><div><strong>Reply</strong><small>Attendance, meals and consent</small></div></li>
          <li><span>03</span><div><strong>Keep in touch</strong><small>Updates from this post room</small></div></li>
        </ol>
      </section>

      <section className="post-room" aria-labelledby="post-room-title">
        <div className="post-room-head">
          <span className="eyebrow">WAYS TO REACH YOUR PEOPLE</span>
          <h2 id="post-room-title">
            {total
              ? `${total} ${total === 1 ? "guest" : "guests"} on your list. Here is how far each way of writing carries today.`
              : "Your guest list is empty, so there is nobody to write to yet."}
          </h2>
          <p>
            Guests choose updates in their RSVP. Attending a wedding does not
            subscribe anyone to email — permission and contact details are
            theirs to give, which is why a note posted{" "}
            <strong>inside the invitation</strong> always reaches further.
          </p>
        </div>

        {total === 0 ? (
          <div className="post-room-empty">
            <p>Add your households and the post room fills itself in.</p>
            <Link className="button outline small" href={guestsLink}>
              Build your guest list <Arrow />
            </Link>
          </div>
        ) : (
          <ol className="dispatch-ways">
            {ways.map((way) => (
              <li
                key={way.id}
                className={
                  "dispatch-way" + (way.available ? "" : " dispatch-way-off")
                }
              >
                <div className="dispatch-figure">
                  <strong>{way.available ? way.reach : "—"}</strong>
                  <span>
                    {way.available
                      ? `of ${total} can be reached`
                      : "unavailable"}
                  </span>
                </div>
                <div className="dispatch-body">
                  <h3>{way.name}</h3>
                  <p>{way.what}</p>
                  {way.unavailable ? (
                    <p className="dispatch-note">{way.unavailable}</p>
                  ) : (
                    <>
                      <ReachReasons reasons={way.reasons} />
                      {way.reach === total &&
                        !way.reasons.some((r) => r.count > 0) && (
                          <p className="dispatch-note">
                            Everyone on your list can be reached this way.
                          </p>
                        )}
                    </>
                  )}
                </div>
                <div className="dispatch-action">
                  <button
                    className="button outline small"
                    disabled={!way.available || data.role === "viewer"}
                    onClick={() => openCompose({ channel: way.id })}
                  >
                    {way.action} <Arrow />
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {data.messages.length > 0 && (
        <div className="despatch-book">
          <div className="despatch-book-head">
            <span className="eyebrow">WHAT YOU HAVE WRITTEN</span>
          </div>
          {data.messages.map((m) => {
            const reach = messagingAudience(data.guests, m.audience, m.channel);
            const eligible = reach.recipients.length;
            const state = despatchState(m);
            const outcome = outcomeOf(m.id);
            const scheduledAhead = Boolean(
              m.scheduled_at && new Date(m.scheduled_at) > new Date(),
            );
            // Only email and SMS wait: an invitation update is published now
            // and simply becomes visible when its time comes.
            const waitingItsTurn = scheduledAhead && m.channel !== "invitation";
            const retryable = canRetry(m);
            const removable = ["draft", "failed"].includes(m.status);
            const readOnly = data.role === "viewer";
            return (
              <article className="message-card" key={m.id}>
                <EnvelopeSimpleIcon size={26} />
                <div>
                  <div className="message-meta">
                    <span>
                      {channelNoun(m.channel).toUpperCase()} ·{" "}
                      {m.audience.toUpperCase()}
                    </span>
                    <span className={"status despatch-" + state.tone}>
                      {state.label}
                    </span>
                  </div>
                  <h2>{m.subject}</h2>
                  <p>{m.body}</p>
                  {m.scheduled_at && (
                    <small>
                      {scheduledAhead ? "Due" : "Was due"}{" "}
                      {atVenue(m.scheduled_at, data.wedding.timezone)} ·{" "}
                      {data.wedding.timezone}
                    </small>
                  )}
                  {(outcome.delivered > 0 || outcome.failed > 0) && (
                    <small className="despatch-outcome">
                      {outcome.delivered} delivered
                      {outcome.failed
                        ? ` · ${outcome.failed} failed${outcome.reason ? `: ${outcome.reason}` : ""}`
                        : ""}
                    </small>
                  )}
                </div>
                <div className="message-blocked">
                  <p>
                    <strong>{eligible}</strong>{" "}
                    {eligible === 1 ? "guest" : "guests"} in this audience{" "}
                    {m.channel === "invitation"
                      ? "can see this update"
                      : "can be reached today"}
                    .
                  </p>
                  {!eligible && (
                    <p className="dispatch-note">
                      {m.channel === "invitation"
                        ? "No guests match this audience, so there is nobody to publish it to."
                        : `Nobody here has both chosen updates and left ${m.channel === "sms" ? "a mobile number" : "an email address"} yet.`}
                    </p>
                  )}
                  {m.status === "draft" && (
                    <>
                      {!eligible && m.channel !== "invitation" && (
                        <button
                          className="text-link"
                          onClick={() => {
                            setSubject(m.subject);
                            setBody(m.body);
                            openCompose({
                              channel: "invitation",
                              audience: m.audience,
                            });
                          }}
                        >
                          Use this note inside invitations instead
                        </button>
                      )}
                      {/* A message waiting on its own schedule has no work for
                          anyone to do, so its action says so rather than
                          offering a press that the server will refuse. */}
                      <button
                        className="button outline small"
                        disabled={
                          working === m.id ||
                          !eligible ||
                          readOnly ||
                          waitingItsTurn
                        }
                        onClick={() =>
                          run(
                            m,
                            {},
                            m.channel === "invitation" ? "published" : "sent",
                          )
                        }
                      >
                        {working === m.id
                          ? "Working…"
                          : m.channel === "invitation"
                            ? "Publish update"
                            : waitingItsTurn
                              ? "Waiting for its time"
                              : data.user.is_demo
                                ? "Preview send"
                                : "Send message"}
                        {!waitingItsTurn && <Arrow />}
                      </button>
                      {waitingItsTurn && (
                        <>
                          <p className="dispatch-note">
                            The daily delivery run sends this once its time
                            passes. There is nothing you need to do.
                          </p>
                          <button
                            className="text-link"
                            disabled={working === m.id || !eligible || readOnly}
                            onClick={() => run(m, { now: true }, "sent")}
                          >
                            Send it now instead
                          </button>
                        </>
                      )}
                    </>
                  )}
                  {retryable && (
                    <>
                      <button
                        className="button outline small"
                        disabled={working === m.id || readOnly}
                        onClick={() => run(m, { now: true }, "sent")}
                      >
                        <ArrowClockwiseIcon size={15} />
                        {working === m.id ? "Working…" : "Try the rest again"}
                      </button>
                      <p className="dispatch-note">
                        Guests who already received it are skipped, so nobody is
                        written to twice.
                      </p>
                    </>
                  )}
                  {removable && !readOnly && (
                    <button
                      className="text-link quiet"
                      disabled={working === m.id}
                      onClick={async () => {
                        setWorking(m.id);
                        try {
                          await mutate("messages/" + m.id, undefined, "DELETE");
                          notify("Draft discarded.");
                        } catch (e) {
                          notify((e as Error).message, "error");
                        } finally {
                          setWorking("");
                        }
                      }}
                    >
                      Discard this draft
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!data.messages.length && (
        <div className="empty-state">
          <EnvelopeSimpleIcon size={36} />
          <h2>A little note goes a long way.</h2>
          <p>
            Nothing written yet. Start with an update inside the invitation — it
            reaches every household you have shared a link with, and asks
            nothing of them.
          </p>
          <button
            className="button outline small"
            onClick={() => openCompose({ channel: "invitation" })}
          >
            Write an invitation update <Arrow />
          </button>
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
                notify("Message draft saved. Review it, then send when ready.");
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
                  <option value="invitation">Inside the invitation</option>
                  <option value="email" disabled={!emailReady}>
                    Email{emailReady ? "" : " — not switched on"}
                  </option>
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
                {channelNoun(channel)}
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
                    ? "Nobody in this audience can be reached this way yet."
                    : "No guests match this audience. Choose another audience."}
              </p>
              {channel === "invitation" ? (
                <small>
                  {selected.length} in this audience. Updates appear inside each
                  household’s private invitation.
                  {withoutLink > 0 &&
                    ` ${withoutLink} ${withoutLink === 1 ? "household has" : "households have"} no link yet, so the note waits for them.`}
                </small>
              ) : (
                <>
                  <small>
                    {selected.length} in this audience
                    {selected.length > recipients.length
                      ? `, ${selected.length - recipients.length} of whom cannot be reached this way:`
                      : "."}
                  </small>
                  <ReachReasons
                    reasons={[
                      {
                        count: awaitingOptIn,
                        cause: "have not chosen wedding updates.",
                        remedy: null,
                      },
                      {
                        count: awaitingContact,
                        cause: `have no ${contactNoun(channel)} on file.`,
                        remedy: null,
                      },
                      {
                        count: awaitingBoth,
                        cause: "have given neither.",
                        remedy: null,
                      },
                    ]}
                  />
                </>
              )}
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
