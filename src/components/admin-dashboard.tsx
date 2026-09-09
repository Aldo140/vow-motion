"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowSquareOutIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";
import { Brand } from "./ui";
import type { AdminOverview, AdminAccountRow } from "@/lib/admin";

const n = (value: unknown) => Number(value ?? 0);
const pct = (part: number, whole: number) =>
  whole > 0 ? Math.round((part / whole) * 100) : 0;

function ago(value: unknown) {
  if (!value) return "—";
  const then = new Date(String(value)).getTime();
  if (Number.isNaN(then)) return "—";
  const secs = Math.max(1, Math.round((Date.now() - then) / 1000));
  const steps: [number, string][] = [
    [60, "s"],
    [60, "m"],
    [24, "h"],
    [7, "d"],
    [4.35, "w"],
    [12, "mo"],
    [Number.POSITIVE_INFINITY, "y"],
  ];
  let value2 = secs;
  for (let i = 0; i < steps.length; i++) {
    if (value2 < steps[i][0]) return `${Math.floor(value2)}${steps[i][1]} ago`;
    value2 /= steps[i][0];
  }
  return "—";
}
const day = (value: unknown) =>
  value
    ? new Date(String(value)).toLocaleDateString("en-CA", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

type Tab = "accounts" | "enquiries" | "activity";
type Filter = "all" | "real" | "demo" | "paid" | "unverified" | "admin";
type Sort = "recent" | "guests" | "weddings" | "active";

export default function AdminDashboard({
  data,
  me,
}: {
  data: AdminOverview;
  me: string;
}) {
  const [tab, setTab] = useState<Tab>("accounts");
  const [filter, setFilter] = useState<Filter>("real");
  const [sort, setSort] = useState<Sort>("recent");
  const [query, setQuery] = useState("");

  const a = data.accounts as Record<string, unknown>;
  const w = data.weddings as Record<string, unknown>;
  const g = data.guests as Record<string, unknown>;
  const e = data.engagement as Record<string, unknown>;
  const c = data.commerce as Record<string, unknown>;
  const f = data.funnel as Record<string, unknown>;
  const rows = data.accountRows as AdminAccountRow[];

  const weeks = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of data.signups as Record<string, unknown>[]) {
      const key = new Date(String(row.week)).toISOString().slice(0, 10);
      counts.set(key, n(row.n));
    }
    const out: { label: string; count: number }[] = [];
    const monday = new Date();
    monday.setUTCHours(0, 0, 0, 0);
    monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
    for (let i = 11; i >= 0; i--) {
      const d = new Date(monday);
      d.setUTCDate(d.getUTCDate() - i * 7);
      const key = d.toISOString().slice(0, 10);
      out.push({
        label: d.toLocaleDateString("en-CA", { month: "short", day: "numeric" }),
        count: counts.get(key) ?? 0,
      });
    }
    return out;
  }, [data.signups]);
  const weekMax = Math.max(1, ...weeks.map((x) => x.count));

  const funnelSteps = [
    ["Signed up", n(f.signed_up)],
    ["Created a wedding", n(f.created_wedding)],
    ["Added guests", n(f.added_guests)],
    ["Published", n(f.published)],
    ["Sent invitations", n(f.sent_invites)],
    ["Received an RSVP", n(f.got_rsvps)],
    ["Paid", n(f.paid)],
  ] as const;
  const funnelTop = Math.max(1, n(f.signed_up));

  const accounts = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = rows.filter((r) => {
      if (filter === "real" && r.is_demo) return false;
      if (filter === "demo" && !r.is_demo) return false;
      if (filter === "paid" && !r.paid) return false;
      if (filter === "unverified" && (r.email_verified || r.is_demo))
        return false;
      if (filter === "admin" && !r.is_admin) return false;
      if (
        q &&
        !r.email.toLowerCase().includes(q) &&
        !r.name.toLowerCase().includes(q) &&
        !(r.first_wedding || "").toLowerCase().includes(q)
      )
        return false;
      return true;
    });
    list = [...list].sort((x, y) => {
      if (sort === "guests") return n(y.guests) - n(x.guests);
      if (sort === "weddings") return n(y.weddings) - n(x.weddings);
      if (sort === "active")
        return (
          new Date(String(y.last_activity || 0)).getTime() -
          new Date(String(x.last_activity || 0)).getTime()
        );
      return (
        new Date(String(y.created_at)).getTime() -
        new Date(String(x.created_at)).getTime()
      );
    });
    return list;
  }, [rows, filter, sort, query]);

  const filters: [Filter, string, number][] = [
    ["real", "Accounts", n(a.real_accounts)],
    ["paid", "Paying", n(c.paid)],
    ["unverified", "Unverified", n(a.real_accounts) - n(a.verified_accounts)],
    ["admin", "Admins", n(a.admin_accounts)],
    ["demo", "Demo", n(a.demo_accounts)],
    ["all", "Everything", rows.length],
  ];

  return (
    <div className="ops">
      <header className="ops-bar">
        <div>
          <Brand />
          <span className="ops-tag">OPERATIONS</span>
        </div>
        <div className="ops-bar-right">
          <span>{me}</span>
          <Link href="/studio" className="button outline small">
            Studio
          </Link>
        </div>
      </header>

      <div className="ops-shell">
        <div className="page-heading">
          <div>
            <p className="eyebrow">PLATFORM</p>
            <h1>Every account, and what they have done with it</h1>
          </div>
          <p className="ops-generated">
            as of{" "}
            {new Date(data.generatedAt).toLocaleString("en-CA", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>

        <section className="ops-stats">
          <Stat
            value={n(a.real_accounts)}
            label="Signed-up accounts"
            sub={`${n(a.demo_accounts)} demo sessions · ${n(a.signups_7d)} new this week`}
          />
          <Stat
            value={n(a.verified_accounts)}
            label="Email verified"
            sub={`${pct(n(a.verified_accounts), n(a.real_accounts))}% of accounts`}
          />
          <Stat
            value={n(w.total)}
            label="Weddings created"
            sub={`${n(w.published)} published · ${n(w.draft)} draft · ${n(w.memories)} memories`}
          />
          <Stat
            value={n(g.total)}
            label="Guests on the platform"
            sub={`${n(g.attending)} attending · ${n(g.pending)} awaiting · ${n(g.declined)} declined`}
          />
          <Stat
            value={n(e.invites_opened)}
            label="Invitations opened"
            sub={`of ${n(e.invites_issued)} issued · ${pct(n(e.invites_opened), n(e.invites_issued))}% open rate`}
          />
          <Stat
            value={n(e.rsvp_responses)}
            label="RSVP responses"
            sub={`${n(e.messages)} messages sent · ${n(e.photos)} guest photos`}
          />
          <Stat
            value={n(c.paid)}
            label="Paid subscriptions"
            sub={String(c.plan_mix || "no paid plans yet")}
          />
          <Stat
            value={n(c.enquiries_open)}
            label="Open contact enquiries"
            sub={`${n(c.enquiries)} received all-time`}
          />
        </section>

        <section className="ops-grid">
          <div className="ops-card">
            <div className="panel-title">
              <h2>New accounts</h2>
              <span>LAST 12 WEEKS</span>
            </div>
            <div className="ops-bars">
              {weeks.map((week, i) => (
                <div className="ops-bar-col" key={i}>
                  <span className="ops-bar-count">{week.count || ""}</span>
                  <div
                    className="ops-bar-fill"
                    style={{
                      height: `${Math.round((week.count / weekMax) * 100)}%`,
                    }}
                    data-empty={week.count === 0 || undefined}
                  />
                  <span className="ops-bar-label">{week.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="ops-card">
            <div className="panel-title">
              <h2>Activation funnel</h2>
              <span>REAL ACCOUNTS</span>
            </div>
            <div className="ops-funnel">
              {funnelSteps.map(([label, count], i) => (
                <div className="ops-funnel-row" key={label}>
                  <span className="ops-funnel-label">{label}</span>
                  <div className="ops-funnel-track">
                    <div
                      className="ops-funnel-fill"
                      style={{
                        width: `${Math.max(2, Math.round((count / funnelTop) * 100))}%`,
                      }}
                    />
                  </div>
                  <span className="ops-funnel-value">
                    {count}
                    {i > 0 && (
                      <i>{pct(count, n(funnelSteps[i - 1][1]))}%</i>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <nav className="ops-tabs" aria-label="Operations sections">
          {(
            [
              ["accounts", `Accounts (${rows.length})`],
              ["enquiries", `Enquiries (${(data.enquiries as unknown[]).length})`],
              ["activity", "Activity"],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              className={tab === key ? "active" : ""}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </nav>

        {tab === "accounts" && (
          <>
            <div className="table-toolbar">
              <div className="filter-tabs">
                {filters.map(([key, label, count]) => (
                  <button
                    key={key}
                    className={filter === key ? "active" : ""}
                    onClick={() => setFilter(key)}
                  >
                    {label}
                    <span>{count}</span>
                  </button>
                ))}
              </div>
              <div className="ops-toolbar-right">
                <label className="search">
                  <MagnifyingGlassIcon size={14} />
                  <input
                    value={query}
                    onChange={(ev) => setQuery(ev.target.value)}
                    placeholder="Name, email, wedding"
                    aria-label="Search accounts"
                  />
                </label>
                <select
                  value={sort}
                  onChange={(ev) => setSort(ev.target.value as Sort)}
                  aria-label="Sort accounts"
                  className="ops-sort"
                >
                  <option value="recent">Newest first</option>
                  <option value="active">Recently active</option>
                  <option value="guests">Most guests</option>
                  <option value="weddings">Most weddings</option>
                </select>
              </div>
            </div>

            <div className="table-container">
              <table className="ops-table">
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>Signed up</th>
                    <th>Weddings</th>
                    <th>Guests</th>
                    <th>RSVP progress</th>
                    <th>Plan</th>
                    <th>Last active</th>
                    <th aria-label="Open" />
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((r) => {
                    const guests = n(r.guests);
                    return (
                      <tr key={r.id}>
                        <td>
                          <div className="guest-cell">
                            <span className="avatar">
                              {r.name.slice(0, 2).toUpperCase()}
                            </span>
                            <div>
                              <b>
                                {r.name}
                                {r.is_admin && (
                                  <ShieldCheckIcon
                                    size={13}
                                    weight="fill"
                                    className="ops-admin-mark"
                                  />
                                )}
                              </b>
                              <small>{r.email}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          {day(r.created_at)}
                          <small className="ops-sub">{ago(r.created_at)}</small>
                        </td>
                        <td>
                          {n(r.weddings) === 0 ? (
                            <span className="ops-dim">none</span>
                          ) : (
                            <>
                              {n(r.weddings)}
                              <small className="ops-sub">
                                {r.first_wedding}
                              </small>
                            </>
                          )}
                        </td>
                        <td>{guests || <span className="ops-dim">0</span>}</td>
                        <td>
                          {guests > 0 ? (
                            <div className="ops-rsvp">
                              <div className="rsvp-track">
                                <span
                                  style={{
                                    width: `${pct(n(r.attending), guests)}%`,
                                  }}
                                />
                                <i
                                  style={{
                                    width: `${pct(n(r.declined), guests)}%`,
                                  }}
                                />
                              </div>
                              <small>
                                {n(r.attending)} yes · {n(r.declined)} no ·{" "}
                                {n(r.pending)} open
                              </small>
                            </div>
                          ) : (
                            <span className="ops-dim">—</span>
                          )}
                        </td>
                        <td>
                          {r.paid ? (
                            <span className="status attending">
                              {r.plans || "paid"}
                            </span>
                          ) : r.is_demo ? (
                            <span className="status">demo</span>
                          ) : (
                            <span className="ops-dim">free</span>
                          )}
                          {!r.email_verified && !r.is_demo && (
                            <span className="status pending ops-mt">
                              unverified
                            </span>
                          )}
                        </td>
                        <td>{ago(r.last_activity)}</td>
                        <td>
                          <Link
                            href={`/admin/${r.id}`}
                            className="icon-button"
                            aria-label={`Open ${r.name}`}
                          >
                            <ArrowSquareOutIcon size={15} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {accounts.length === 0 && (
                <div className="empty-state">
                  <p>No accounts match this view.</p>
                </div>
              )}
            </div>
            <p className="table-footer">
              <span>
                {accounts.length} of {rows.length} accounts
              </span>
            </p>
          </>
        )}

        {tab === "enquiries" && (
          <div className="table-container">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>From</th>
                  <th>Role</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Received</th>
                </tr>
              </thead>
              <tbody>
                {(data.enquiries as Record<string, unknown>[]).map((row) => (
                  <tr key={String(row.id)}>
                    <td>
                      <b>{String(row.name)}</b>
                      <small className="ops-sub">{String(row.email)}</small>
                    </td>
                    <td className="ops-capitalize">{String(row.role)}</td>
                    <td className="ops-message">{String(row.message)}</td>
                    <td>
                      <span className="status ops-capitalize">
                        {String(row.status)}
                      </span>
                    </td>
                    <td>
                      {day(row.created_at)}
                      <small className="ops-sub">{ago(row.created_at)}</small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(data.enquiries as unknown[]).length === 0 && (
              <div className="empty-state">
                <p>No contact enquiries yet.</p>
              </div>
            )}
          </div>
        )}

        {tab === "activity" && (
          <ul className="ops-activity">
            {(data.activity as Record<string, unknown>[]).map((row, i) => (
              <li key={i}>
                <span className="activity-dot" />
                <div>
                  <p>{String(row.action)}</p>
                  <small>
                    {row.names ? `${String(row.names)} · ` : ""}
                    {ago(row.created_at)}
                    {row.actor_id === "guest" ? " · guest" : ""}
                  </small>
                </div>
                {row.owner_id ? (
                  <Link
                    href={`/admin/${String(row.owner_id)}`}
                    className="text-link"
                  >
                    Account
                  </Link>
                ) : null}
              </li>
            ))}
            {(data.activity as unknown[]).length === 0 && (
              <div className="empty-state">
                <p>Nothing has happened yet.</p>
              </div>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({
  value,
  label,
  sub,
}: {
  value: number;
  label: string;
  sub: string;
}) {
  return (
    <div className="ops-stat">
      <strong>{value.toLocaleString("en-CA")}</strong>
      <span>{label}</span>
      <small>{sub}</small>
    </div>
  );
}
