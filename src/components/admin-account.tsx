"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeftIcon,
  ArrowSquareOutIcon,
  ShieldCheckIcon,
  SignOutIcon,
} from "@phosphor-icons/react";
import { api } from "./ui";

const n = (value: unknown) => Number(value ?? 0);
const pct = (part: number, whole: number) =>
  whole > 0 ? Math.round((part / whole) * 100) : 0;
const day = (value: unknown) =>
  value
    ? new Date(String(value)).toLocaleDateString("en-CA", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";
function ago(value: unknown) {
  if (!value) return "—";
  const then = new Date(String(value)).getTime();
  if (Number.isNaN(then)) return "—";
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

type Account = {
  user: Record<string, unknown>;
  weddings: Record<string, unknown>[];
  collaboratorOn: Record<string, unknown>[];
  activity: Record<string, unknown>[];
};

export default function AdminAccount({
  account,
  viewerId,
}: {
  account: Account;
  viewerId: string;
}) {
  const { user, weddings, collaboratorOn, activity } = account;
  const [admin, setAdmin] = useState(Boolean(user.is_admin));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const isDemo = Boolean(user.is_demo);
  const isSelf = user.id === viewerId;

  async function toggle() {
    setBusy(true);
    setError("");
    try {
      await api("/api/admin/role", "POST", {
        user_id: String(user.id),
        is_admin: !admin,
      });
      setAdmin(!admin);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ops">
      <header className="ops-bar">
        <Link href="/admin" className="ops-back">
          <ArrowLeftIcon size={15} /> All accounts
        </Link>
        <div className="ops-bar-right">
          <Link href="/studio" className="button outline small">
            Studio
          </Link>
          <button
            className="icon-button"
            aria-label="Sign out"
            onClick={async () => {
              await api("/api/auth/logout", "POST");
              window.location.href = "/";
            }}
          >
            <SignOutIcon size={17} />
          </button>
        </div>
      </header>

      <div className="ops-shell">
        <section className="ops-account-head">
          <span className="avatar ops-avatar-lg">
            {String(user.name).slice(0, 2).toUpperCase()}
          </span>
          <div className="ops-account-id">
            <h1>{String(user.name)}</h1>
            <p>{String(user.email)}</p>
            <div className="ops-badges">
              {admin && (
                <span className="status attending">
                  <ShieldCheckIcon size={12} weight="fill" /> admin
                </span>
              )}
              {isDemo && <span className="status">demo session</span>}
              {!isDemo &&
                (user.email_verified ? (
                  <span className="status attending">verified</span>
                ) : (
                  <span className="status pending">unverified</span>
                ))}
              <span className="status">
                joined {day(user.created_at)}
              </span>
              <span className="ops-mono">{String(user.id)}</span>
            </div>
          </div>
          {!isDemo && !isSelf && (
            <div className="ops-account-action">
              <button
                className={"button small " + (admin ? "outline" : "primary")}
                onClick={toggle}
                disabled={busy}
              >
                {busy
                  ? "Saving…"
                  : admin
                    ? "Revoke admin access"
                    : "Grant admin access"}
              </button>
              {error && <small className="ops-error">{error}</small>}
            </div>
          )}
          {isSelf && (
            <div className="ops-account-action">
              <small className="ops-sub">This is you.</small>
            </div>
          )}
        </section>

        {collaboratorOn.length > 0 && (
          <p className="ops-collab-note">
            Also a collaborator on{" "}
            {collaboratorOn.map((row, i) => (
              <span key={String(row.id)}>
                {i > 0 && ", "}
                <Link href={`/admin/${String(row.id)}`}>
                  {String(row.names)}
                </Link>{" "}
                ({String(row.role)})
              </span>
            ))}
            .
          </p>
        )}

        <div className="panel-title ops-section-title">
          <h2>
            Weddings{" "}
            <span className="ops-count">{weddings.length}</span>
          </h2>
        </div>

        {weddings.length === 0 && (
          <div className="empty-state">
            <p>This account has never created a wedding.</p>
          </div>
        )}

        <div className="ops-weddings">
          {weddings.map((wd) => {
            const guests = n(wd.guests);
            const stats: [string, string | number][] = [
              ["Households", n(wd.households)],
              ["Guests", guests],
              ["Events", n(wd.events)],
              [
                "Invites opened",
                `${n(wd.invites_opened)} / ${n(wd.invites_issued)}`,
              ],
              ["Messages sent", n(wd.messages)],
              [
                "Deliveries",
                `${n(wd.deliveries)}${n(wd.bounced) ? ` · ${n(wd.bounced)} bounced` : ""}`,
              ],
              ["Guest photos", n(wd.photos)],
              ["Guest questions", n(wd.guest_questions)],
              ["Consented to updates", n(wd.consented)],
              ["Pilot feedback", n(wd.feedback)],
            ];
            return (
              <article className="ops-wedding" key={String(wd.id)}>
                <div className="ops-wedding-head">
                  <div>
                    <span className="eyebrow">
                      {String(wd.world).toUpperCase()} ·{" "}
                      {String(wd.status).toUpperCase()} ·{" "}
                      {String(wd.privacy).toUpperCase()}
                    </span>
                    <h3>{String(wd.names)}</h3>
                    <p>
                      {day(wd.date)} · {String(wd.location)} · RSVP by{" "}
                      {day(wd.rsvp_deadline)}
                    </p>
                  </div>
                  <div className="ops-wedding-links">
                    {wd.subscription ? (
                      <span className="status attending ops-capitalize">
                        {String(wd.subscription)}
                      </span>
                    ) : (
                      <span className="ops-dim">free</span>
                    )}
                    <Link
                      href={`/studio?wid=${String(wd.id)}`}
                      className="text-link"
                    >
                      Studio <ArrowSquareOutIcon size={13} />
                    </Link>
                    <a
                      href={`/w/${String(wd.slug)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-link"
                    >
                      {wd.status === "draft" ? "Preview" : "Live site"}{" "}
                      <ArrowSquareOutIcon size={13} />
                    </a>
                  </div>
                </div>

                {guests > 0 && (
                  <div className="ops-wedding-rsvp">
                    <div className="rsvp-track">
                      <span
                        style={{ width: `${pct(n(wd.attending), guests)}%` }}
                      />
                      <i style={{ width: `${pct(n(wd.declined), guests)}%` }} />
                    </div>
                    <small>
                      {n(wd.attending)} attending · {n(wd.declined)} declined ·{" "}
                      {n(wd.pending)} awaiting reply
                    </small>
                  </div>
                )}

                <dl className="ops-wedding-stats">
                  {stats.map(([label, val]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{val}</dd>
                    </div>
                  ))}
                </dl>

                {Boolean(wd.collaborators || wd.domains) && (
                  <div className="ops-wedding-extra">
                    {wd.collaborators ? (
                      <p>
                        <span>Collaborators</span> {String(wd.collaborators)}
                      </p>
                    ) : null}
                    {wd.domains ? (
                      <p>
                        <span>Custom domains</span> {String(wd.domains)}
                      </p>
                    ) : null}
                  </div>
                )}
              </article>
            );
          })}
        </div>

        <div className="panel-title ops-section-title">
          <h2>Activity</h2>
        </div>
        <ul className="ops-activity">
          {activity.map((row, i) => (
            <li key={i}>
              <span className="activity-dot" />
              <div>
                <p>{String(row.action)}</p>
                <small>
                  {row.names ? `${String(row.names)} · ` : ""}
                  {ago(row.created_at)}
                </small>
              </div>
            </li>
          ))}
          {activity.length === 0 && (
            <div className="empty-state">
              <p>No recorded activity.</p>
            </div>
          )}
        </ul>
      </div>
    </div>
  );
}
