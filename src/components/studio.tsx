"use client";
import Link from "next/link";
import { useEffect, useState, useRef, type ReactNode } from "react";
import {
  HouseIcon,
  UsersIcon,
  CalendarBlankIcon,
  SwatchesIcon,
  EnvelopeSimpleIcon,
  CheckSquareIcon,
  ChatCircleTextIcon,
  ArmchairIcon,
  MapTrifoldIcon,
  ImagesIcon,
  ChartBarIcon,
  GearSixIcon,
  UserPlusIcon,
  ListIcon,
  XIcon,
  PlusIcon,
  CheckIcon,
  ClockIcon,
  SignOutIcon,
} from "@phosphor-icons/react";
import type { StudioData } from "@/lib/types";
import { Brand, Arrow, api, Notice, Modal, Field, Submit } from "./ui";
import { formatDate, getWorld, worlds } from "@/lib/worlds";
import { GuestManager, EventsManager, RsvpManager } from "./studio-guests";
import {
  ExperienceManager,
  MessagesManager,
  SeatingManager,
  TravelManager,
  PhotosManager,
  SettingsManager,
  CollaboratorsManager,
} from "./studio-tools";
const navigation = [
  ["Overview", "", HouseIcon],
  ["Guest list", "guests", UsersIcon],
  ["Events", "events", CalendarBlankIcon],
  ["Your experience", "experience", SwatchesIcon],
  ["Invitations", "invitations", EnvelopeSimpleIcon],
  ["RSVPs", "rsvps", CheckSquareIcon],
  ["Messages", "messages", ChatCircleTextIcon],
  ["Seating", "seating", ArmchairIcon],
  ["Travel & stay", "travel", MapTrifoldIcon],
  ["Photos & memories", "photos", ImagesIcon],
  ["Insights", "analytics", ChartBarIcon],
  ["Collaborators", "collaborators", UserPlusIcon],
  ["Settings", "settings", GearSixIcon],
] as const;
export type PanelProps = {
  data: StudioData;
  refresh: () => Promise<void>;
  mutate: (path: string, body?: unknown, method?: string) => Promise<unknown>;
  notify: (text: string) => void;
};
export default function Studio({
  section = "",
  initialId,
}: {
  section?: string;
  initialId: string;
}) {
  const [data, setData] = useState<StudioData | null>(null),
    [weddingId, setWeddingId] = useState(initialId),
    [error, setError] = useState(""),
    [toast, setToast] = useState(""),
    [mobile, setMobile] = useState(false),
    [create, setCreate] = useState(false),
    [smallScreen, setSmallScreen] = useState(false);
  const sidebar = useRef<HTMLElement>(null);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const sync = () => setSmallScreen(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    if (!mobile || !smallScreen) return;
    const trigger = document.activeElement as HTMLElement | null;
    const nav = sidebar.current;
    nav?.querySelector<HTMLElement>("button")?.focus();
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setMobile(false);
      }
      if (e.key === "Tab") {
        const items = Array.from(
          nav?.querySelectorAll<HTMLElement>(
            "a[href],button:not([disabled]),select",
          ) || [],
        ).filter((el) => el.getClientRects().length);
        const first = items[0],
          last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("keydown", handle);
      trigger?.focus();
    };
  }, [mobile, smallScreen]);
  const refresh = async () => {
    try {
      const next = await api("/api/studio?wedding=" + weddingId);
      setData(next);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  };
  useEffect(() => {
    let mounted = true;
    api("/api/studio?wedding=" + weddingId)
      .then((d) => {
        if (mounted) setData(d);
      })
      .catch((e) => setError(e.message));
    return () => {
      mounted = false;
    };
  }, [weddingId]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(t);
  }, [toast]);
  const mutate = async (path: string, body?: unknown, method = "POST") => {
    const result = await api(
      "/api/studio/" + path + "?wedding=" + weddingId,
      method,
      body,
    );
    await refresh();
    return result;
  };
  if (!data)
    return (
      <main id="main" className="loading-studio">
        <Brand />
        {error ? (
          <Notice error>
            {error}
            <a href="/login"> Sign in</a>
          </Notice>
        ) : (
          <>
            <div className="skeleton" />
            <h1>Opening your Studio.</h1>
            <p>A place for all your people.</p>
          </>
        )}
      </main>
    );
  const props: PanelProps = { data, refresh, mutate, notify: setToast };
  const current = navigation.find((n) => n[1] === section)?.[0] || "Overview";
  const render: Record<string, ReactNode> = {
    "": <Overview {...props} />,
    guests: <GuestManager {...props} />,
    events: <EventsManager {...props} />,
    experience: <ExperienceManager {...props} />,
    invitations: <Invitations {...props} />,
    rsvps: <RsvpManager {...props} />,
    messages: <MessagesManager {...props} />,
    seating: <SeatingManager {...props} />,
    travel: <TravelManager {...props} />,
    photos: <PhotosManager {...props} />,
    analytics: <Insights {...props} />,
    collaborators: <CollaboratorsManager {...props} />,
    settings: <SettingsManager {...props} />,
  };
  return (
    <div className="studio-shell">
      <aside
        ref={sidebar}
        inert={smallScreen && !mobile}
        className={"studio-sidebar " + (mobile ? "mobile-open" : "")}
      >
        <div className="sidebar-brand">
          <Brand />
          <button
            className="icon-button mobile-toggle"
            aria-label="Close navigation"
            onClick={() => setMobile(false)}
          >
            <XIcon size={22} />
          </button>
        </div>
        <div className="wedding-selector">
          <label htmlFor="wedding-select">YOUR WEDDING STUDIO</label>
          <select
            id="wedding-select"
            value={weddingId}
            onChange={(e) => {
              setWeddingId(e.target.value);
              document.cookie = `vow_wedding=${e.target.value}; path=/; SameSite=Lax`;
              window.location.href = "/studio?wid=" + e.target.value;
            }}
          >
            {data.weddings.map((w) => (
              <option key={w.id} value={w.id}>
                {w.names}
              </option>
            ))}
          </select>
          <span>{formatDate(data.wedding.date)}</span>
        </div>
        <nav aria-label="Studio navigation">
          {navigation.map(([name, path, Icon], index) => (
            <Link
              key={path}
              onClick={() => setMobile(false)}
              aria-current={section === path ? "page" : undefined}
              href={"/studio/" + path + "?wid=" + weddingId}
              className={
                (section === path ? "active " : "") +
                (index === 10 ? "nav-separated" : "")
              }
            >
              <Icon size={19} weight={section === path ? "fill" : "regular"} />
              {name}
              {path === "guests" && <small>{data.guests.length}</small>}
              {path === "messages" &&
                data.messages.filter((m) => m.status === "draft").length >
                  0 && <span className="nav-dot" />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="new-wedding" onClick={() => setCreate(true)}>
            <PlusIcon size={16} /> Create another wedding
          </button>
          <div className="account-block">
            <span className="avatar">{data.user.name.slice(0, 1)}</span>
            <div>
              <b>{data.user.name}</b>
              <small>
                {data.user.is_demo
                  ? "Your private demo"
                  : data.role + " access"}
              </small>
            </div>
            <button
              className="icon-button"
              aria-label="Sign out"
              onClick={async () => {
                await api("/api/auth/logout", "POST");
                window.location.href = "/";
              }}
            >
              <SignOutIcon size={18} />
            </button>
          </div>
        </div>
      </aside>
      <div className="studio-workspace" inert={smallScreen && mobile}>
        <header className="studio-topbar">
          <div>
            <button
              className="icon-button mobile-toggle"
              onClick={() => setMobile(true)}
              aria-label="Open navigation"
              aria-expanded={mobile}
            >
              <ListIcon size={24} />
            </button>
            <span>Studio</span>
            <span className="breadcrumb">/</span>
            <strong>{current}</strong>
          </div>
          <div>
            <span
              className={
                "publish-state " +
                (data.wedding.status !== "draft" ? "live" : "")
              }
            >
              <i />
              {data.wedding.status === "draft"
                ? "Draft"
                : data.wedding.status === "memories"
                  ? "Memories mode"
                  : "Published"}
            </span>
            <PreviewButton {...props} />
          </div>
        </header>
        {data.user.is_demo && (
          <div className="demo-banner">
            <span>You’re in your own demo Studio. Make yourself at home.</span>
            <a href="/start">
              Create your wedding <Arrow diagonal size={14} />
            </a>
          </div>
        )}
        <main id="main" className="studio-main">
          {error && <Notice error>{error}</Notice>}
          {data.role === "viewer" && (
            <Notice>You have view-only access to this wedding.</Notice>
          )}
          {render[section] || (
            <Notice>
              This Studio page could not be found.{" "}
              <Link href="/studio">Back to overview</Link>
            </Notice>
          )}
        </main>
        <footer className="studio-footer">
          <span>Thoughtfully together.</span>
          <span>VOW MOTION STUDIO</span>
        </footer>
      </div>
      {toast && (
        <div className="toast" role="status">
          <CheckIcon size={18} />
          {toast}
          <button onClick={() => setToast("")} aria-label="Dismiss">
            <XIcon size={16} />
          </button>
        </div>
      )}
      {create && (
        <Modal title="A new beginning" onClose={() => setCreate(false)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = Object.fromEntries(new FormData(e.currentTarget));
              try {
                const result = await api("/api/weddings", "POST", form);
                window.location.href = "/studio?wid=" + result.id;
              } catch (e) {
                setToast((e as Error).message);
              }
            }}
          >
            <Field label="Couple names">
              <input name="names" required />
            </Field>
            <Field label="Wedding date">
              <input type="date" name="date" required />
            </Field>
            <Field label="Location">
              <input name="location" required />
            </Field>
            <Field label="Design world">
              <select name="world">
                {worlds.map((w) => (
                  <option value={w.id} key={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </Field>
            <Submit>
              Create wedding <Arrow />
            </Submit>
          </form>
        </Modal>
      )}
    </div>
  );
}
export function PageHeading({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="heading-actions">{children}</div>
    </div>
  );
}
export function PreviewButton({ data, mutate, notify }: PanelProps) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="button outline small"
      disabled={busy}
      onClick={async () => {
        const household = data.households[0];
        if (!household) {
          notify("Add a guest to preview their personal invitation.");
          return;
        }
        setBusy(true);
        try {
          const result = (await mutate("invitations", {
            household_id: household.id,
          })) as { url: string };
          window.location.href = result.url;
        } catch (e) {
          notify((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? "Opening…" : "Guest preview"}
      <Arrow diagonal size={15} />
    </button>
  );
}
function Overview(props: PanelProps) {
  const [now] = useState(() => Date.now());
  const { data } = props,
    w = data.wedding,
    attending = data.guests.filter((g) => g.status === "attending").length,
    pending = data.guests.filter((g) => g.status === "pending").length,
    declined = data.guests.filter((g) => g.status === "declined").length,
    days = Math.max(
      0,
      Math.ceil((new Date(w.date + "T12:00:00Z").getTime() - now) / 86400000),
    );
  const link = (p: string) => "/studio/" + p + "?wid=" + w.id;
  return (
    <>
      <PageHeading
        title={`A beautiful day in the making.`}
        description={`Welcome back, ${data.user.name}. Let’s bring your people together.`}
      >
        <span className="date-note">
          <CalendarBlankIcon size={16} />
          {formatDate(w.date)}
        </span>
      </PageHeading>
      <div className="overview-hero">
        <div className="overview-photo">
          <img
            src={getWorld(w.world).image}
            alt={`${getWorld(w.world).name} wedding venue art direction`}
          />
          <div className="overview-photo-copy">
            <span>{w.location.toUpperCase()}</span>
            <h2>{w.names}</h2>
            <p>
              {formatDate(w.date)} <i /> {getWorld(w.world).name} collection
            </p>
          </div>
          <a className="image-edit" href={link("experience")}>
            Your experience <Arrow diagonal size={16} />
          </a>
        </div>
        <div className="countdown">
          <span>THE NEXT CHAPTER</span>
          <strong>{days}</strong>
          <p>days until “we do”</p>
          <div className="countdown-rule" />
          <small>
            A place. A date.
            <br />
            All your favourite people.
          </small>
          <a href={link("events")}>
            View your events <Arrow size={16} />
          </a>
        </div>
      </div>
      <div className="guest-summary">
        <div>
          <span>Your people</span>
          <a href={link("guests")}>
            Manage guest list <Arrow diagonal size={15} />
          </a>
        </div>
        <div className="summary-numbers">
          {[
            [data.guests.length, "Invited", ""],
            [attending, "Attending", "green"],
            [pending, "Awaiting reply", "gold"],
            [declined, "Unable to attend", "muted"],
          ].map(([n, label, color]) => (
            <a href={link("guests")} key={String(label)}>
              <span className={"stat-dot " + color} />
              <strong>{n}</strong>
              <span>{label}</span>
            </a>
          ))}
        </div>
        <div className="rsvp-track">
          <span
            style={{
              width: `${(attending / Math.max(1, data.guests.length)) * 100}%`,
            }}
          />
          <i
            style={{
              width: `${(declined / Math.max(1, data.guests.length)) * 100}%`,
            }}
          />
        </div>
        <p>
          {data.guests.length
            ? Math.round(((attending + declined) / data.guests.length) * 100)
            : 0}
          % of your guests have responded{" "}
          <span>RSVP by {formatDate(w.rsvp_deadline)}</span>
        </p>
      </div>
      <section className="planning-pulse" aria-label="Planning priorities">
        <div>
          <span className="eyebrow">WORTH A MOMENT</span>
          <h2>
            {pending
              ? `${pending} replies still to come.`
              : "The little details make the day."}
          </h2>
          <p>
            {pending
              ? "A gentle nudge keeps your guest count moving. Write only to the people you’re waiting on."
              : "Give every guest a place, a plan, and something to look forward to."}
          </p>
          <Link
            className="text-link"
            href={link(pending ? "messages" : "invitations")}
          >
            {pending ? "Write an RSVP reminder" : "Review your invitations"}
            <Arrow size={17} />
          </Link>
        </div>
        <div className="planning-checks">
          <Link href={link("seating")}>
            <strong>
              {
                data.guests.filter(
                  (g) => g.status === "attending" && !g.table_id,
                ).length
              }
            </strong>
            <span>attending guests need a seat</span>
            <Arrow diagonal size={17} />
          </Link>
          <Link href={link("guests")}>
            <strong>
              {data.guests.filter((g) => !g.email && !g.phone).length}
            </strong>
            <span>guests without contact details</span>
            <Arrow diagonal size={17} />
          </Link>
          <Link href={link("photos")}>
            <strong>{data.photos.filter((p) => !p.approved).length}</strong>
            <span>photos waiting for your review</span>
            <Arrow diagonal size={17} />
          </Link>
        </div>
      </section>
      <div className="overview-bottom">
        <section className="next-steps">
          <div className="panel-title">
            <h2>A little closer to the day</h2>
            <span>YOUR NEXT STEPS</span>
          </div>
          {[
            [
              data.guests.length > 0,
              "Bring your people together",
              "Add your guest list and organize households.",
              "guests",
            ],
            [
              data.events.length > 0,
              "Make room for every moment",
              "Set the schedule, from welcome drinks to goodbyes.",
              "events",
            ],
            [
              w.status !== "draft",
              "Make the experience yours",
              "Choose your world and publish when you’re ready.",
              "experience",
            ],
          ].map(([done, title, desc, path], i) => (
            <a
              className="step-row"
              href={link(String(path))}
              key={String(title)}
            >
              <span className={"step-circle " + (done ? "done" : "")}>
                {done ? <CheckIcon size={16} /> : i + 1}
              </span>
              <div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
              <Arrow diagonal size={18} />
            </a>
          ))}
        </section>
        <section className="activity">
          <div className="panel-title">
            <h2>Little updates</h2>
            <ClockIcon size={18} />
          </div>
          {data.activity.length ? (
            data.activity.slice(0, 4).map((a) => (
              <div className="activity-row" key={a.id}>
                <span className="activity-dot" />
                <div>
                  <p>{a.action}</p>
                  <small>
                    {new Date(a.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </small>
                </div>
              </div>
            ))
          ) : (
            <p className="muted-copy">
              Your wedding’s story starts here. Activity will appear as you
              plan.
            </p>
          )}
          <a className="text-link" href={link("analytics")}>
            See the full picture
            <Arrow size={16} />
          </a>
        </section>
      </div>
      <div className="studio-tip">
        <EnvelopeSimpleIcon size={25} />
        <div>
          <b>An invitation worth opening.</b>
          <p>
            A personal link for every household. A first impression that feels
            like you.
          </p>
        </div>
        <a href={link("invitations")}>
          Prepare your invitations <Arrow diagonal size={16} />
        </a>
      </div>
    </>
  );
}
function Invitations({ data, mutate, notify }: PanelProps) {
  const [links, setLinks] = useState<Record<string, string>>({}),
    [busy, setBusy] = useState("");
  return (
    <>
      <PageHeading
        title="It starts with an invitation."
        description="Personal links connect each household to the events meant for them."
      />
      <div className="invitation-workspace">
        <div className={"invitation-live-preview world-" + data.wedding.world}>
          <span>TOGETHER WITH OUR FAMILIES</span>
          <h2>{data.wedding.names.replace(" & ", "\n&\n")}</h2>
          <p>
            {formatDate(data.wedding.date)}
            <br />
            {data.wedding.location}
          </p>
          <div className="envelope-seal">
            {data.wedding.names
              .split(" & ")
              .map((n) => n[0])
              .join("")}
          </div>
          <small>We’ve saved a place for you.</small>
        </div>
        <div>
          <h2 className="serif-heading">Addressed with love.</h2>
          <p className="muted-copy">
            Create a private invitation, then copy it or share through WhatsApp.
            Regenerating a link retires the household’s older links.
          </p>
          {data.households.length === 0 ? (
            <Notice>
              Add your first guest in the guest list to prepare an invitation.
            </Notice>
          ) : (
            data.households.map((h) => (
              <div className="household-invite" key={h.id}>
                <div>
                  <b>{h.name}</b>
                  <small>
                    {data.guests
                      .filter((g) => g.household_id === h.id)
                      .map((g) => g.name)
                      .join(" & ")}
                  </small>
                </div>
                {!links[h.id] ? (
                  <button
                    className="button outline small"
                    disabled={busy === h.id}
                    onClick={async () => {
                      setBusy(h.id);
                      try {
                        const result = (await mutate("invitations", {
                          household_id: h.id,
                        })) as { url: string };
                        setLinks({ ...links, [h.id]: result.url });
                      } catch (e) {
                        notify((e as Error).message);
                      } finally {
                        setBusy("");
                      }
                    }}
                  >
                    Create link <Arrow size={14} />
                  </button>
                ) : (
                  <div className="invite-actions">
                    <button
                      className="text-link"
                      onClick={async () => {
                        await navigator.clipboard.writeText(links[h.id]);
                        notify("Invitation link copied.");
                      }}
                    >
                      Copy
                    </button>
                    <a href={links[h.id]}>
                      Open <Arrow diagonal size={13} />
                    </a>
                    <a
                      href={
                        "https://wa.me/?text=" +
                        encodeURIComponent(
                          `We would love you to join us. ${data.wedding.names} — your invitation: ${links[h.id]}`,
                        )
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      WhatsApp
                    </a>
                    <button
                      className="text-link"
                      onClick={async () => {
                        const r = (await mutate("invitations", {
                          household_id: h.id,
                          revoke: true,
                        })) as { url: string };
                        setLinks({ ...links, [h.id]: r.url });
                        notify("Previous links revoked. New link ready.");
                      }}
                    >
                      Regenerate
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
function Insights({ data }: PanelProps) {
  const attending = data.guests.filter((g) => g.status === "attending"),
    meals = [...new Set(attending.map((g) => g.meal).filter(Boolean))];
  return (
    <>
      <PageHeading
        title="The full picture."
        description="Real responses from your guest list, beautifully in view."
      >
        <a
          className="button outline"
          href={"/api/studio/export?wedding=" + data.wedding.id}
        >
          Export guest report <Arrow diagonal />
        </a>
      </PageHeading>
      {/* The documents a planner otherwise rebuilds by hand for each vendor. */}
      <section className="day-documents">
        <div>
          <h2>Day-of documents</h2>
          <p className="muted-copy">
            Built from the replies you already have, in the form each supplier
            asks for. They open in any spreadsheet.
          </p>
        </div>
        <div className="day-document-list">
          {(
            [
              [
                "kitchen",
                "Kitchen sheet",
                "Covers by meal, every dietary requirement with its table, and covers per table.",
                "For the caterer",
              ],
              [
                "shuttle",
                "Shuttle manifest",
                "Everyone who asked for a seat, by household, with the number of seats required.",
                "For the transport company",
              ],
              [
                "placecards",
                "Place cards",
                "Every attending guest alphabetically, with table, meal and dietary note.",
                "For the calligrapher and the venue",
              ],
            ] as const
          ).map(([sheet, title, description, audience]) => (
            <a
              key={sheet}
              className="day-document"
              href={`/api/studio/export?wedding=${data.wedding.id}&sheet=${sheet}`}
            >
              <span className="day-document-for">{audience}</span>
              <h3>
                {title}
                <Arrow diagonal size={15} />
              </h3>
              <p>{description}</p>
            </a>
          ))}
        </div>
      </section>
      <div className="insight-grid">
        <section>
          <h2>Attendance</h2>
          {(["attending", "pending", "declined"] as const).map((status) => {
            const count = data.guests.filter((g) => g.status === status).length;
            return (
              <div className="insight-bar" key={status}>
                <p>
                  <span>
                    {status === "pending"
                      ? "Awaiting reply"
                      : status === "declined"
                        ? "Unable to attend"
                        : "Attending"}
                  </span>
                  <strong>{count}</strong>
                </p>
                <div>
                  <span
                    style={{
                      width: `${(count / Math.max(1, data.guests.length)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </section>
        <section>
          <h2>At the table</h2>
          {meals.length ? (
            meals.map((meal) => (
              <div className="report-line" key={meal}>
                <span>{meal}</span>
                <strong>
                  {attending.filter((g) => g.meal === meal).length}
                </strong>
              </div>
            ))
          ) : (
            <p>No meal choices yet.</p>
          )}
          <h3>Dietary notes</h3>
          {attending
            .filter((g) => g.dietary)
            .map((g) => (
              <div className="report-line" key={g.id}>
                <span>{g.name}</span>
                <b>{g.dietary}</b>
              </div>
            ))}
        </section>
        <section>
          <h2>Invitation delivery</h2>
          <p className="muted-copy">
            Provider acceptance is separate from delivery. Email opens are not a
            reliable measure of readership.
          </p>
          {["sent", "delivered", "failed", "development"].map((status) => (
            <div className="report-line" key={status}>
              <span>
                {status === "development" ? "Development outbox" : status}
              </span>
              <strong>
                {data.deliveries.filter((d) => d.status === status).length}
              </strong>
            </div>
          ))}
        </section>
        <section>
          <h2>Studio activity</h2>
          {data.activity.map((a) => (
            <div className="report-line" key={a.id}>
              <span>{a.action}</span>
              <small>{new Date(a.created_at).toLocaleDateString()}</small>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
