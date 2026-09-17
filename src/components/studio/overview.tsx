"use client";
import { formatDate } from "@/lib/worlds";
import WeddingPhoto from "../wedding-photo";
import { weddingMomentum, momentumHref } from "@/lib/momentum";
import { PageHeading, type PanelProps } from "./shared";
import { MomentumLink } from "./momentum";
import { CherryBlossomMark } from "../guest-botanical";
import { Arrow } from "../ui";
import Link from "next/link";

export function Overview({ data }: PanelProps) {
  const model = weddingMomentum(data),
    w = data.wedding,
    chapter = model.currentChapter,
    action = model.primaryAction;
  const link = (section: string, filter?: string) =>
    momentumHref(w.id, { section, filter });
  return (
    <>
      <PageHeading
        title="A beautiful day in the making."
        description={
          model.isPlanner
            ? "The wedding at a glance. Start with what needs your attention."
            : `Welcome back, ${data.user.name}. Your next useful step is right here.`
        }
      >
        <span className="date-note">{formatDate(w.date)}</span>
      </PageHeading>
      <section className="momentum-command" aria-labelledby="momentum-title">
        <div className="momentum-command-copy">
          <span className="eyebrow">
            CHAPTER {String(chapter.number).padStart(2, "0")} ·{" "}
            {chapter.title.toUpperCase()}
          </span>
          <p className="momentum-chapter-summary">{chapter.summary}</p>
          <h2 id="momentum-title">
            {action?.title || "A little space to enjoy what you’ve made."}
          </h2>
          <p>
            {action?.explanation ||
              "Your invitation and plans are here whenever you need them."}
          </p>
          {action && <MomentumLink data={data} action={action} primary />}
          {action && (
            <p className="momentum-consequence">
              <span>WHAT THIS MAKES POSSIBLE</span>
              {action.consequence}
            </p>
          )}
          {data.role === "viewer" && (
            <p className="muted-copy">
              You can review the plan. A wedding editor can resolve these items.
            </p>
          )}
        </div>
        <div className={`momentum-specimen identity-suite world-${w.world}`}>
          <WeddingPhoto wedding={w} placement="invitation" alt="" />
          <div className="momentum-specimen-paper">
            <span>THE CELEBRATION OF</span>
            <h3>{w.names}</h3>
            <p>
              {formatDate(w.date)}
              <br />
              {w.location}
            </p>
            {w.settings.botanical === "cherry-blossom" && (
              <CherryBlossomMark budding={w.status === "draft"} />
            )}
            <Link href={link("experience")}>
              Your invitation <Arrow size={15} />
            </Link>
          </div>
        </div>
      </section>
      <section
        className="momentum-attention"
        aria-label="Other attention items"
      >
        <div>
          <span className="eyebrow">
            {model.isPlanner
              ? "ALSO REQUIRES INTERVENTION"
              : "ALSO WORTH A MOMENT"}
          </span>
          <p>
            Start where it helps most. Time-sensitive details are brought to the
            front as your day approaches.
          </p>
        </div>
        <div>
          {model.secondaryActions.length ? (
            model.secondaryActions.map((a) => (
              <article key={a.id}>
                <h3>{a.title}</h3>
                <MomentumLink data={data} action={a} />
              </article>
            ))
          ) : (
            <p>
              Your current details are accounted for. Revisit the journey below
              whenever plans change.
            </p>
          )}
        </div>
      </section>
      <section className="momentum-journey" aria-labelledby="journey-title">
        <div className="panel-title">
          <h2 id="journey-title">Your wedding, taking shape.</h2>
          <span>
            {model.completedChapters} of {model.totalChapters} chapters complete
          </span>
        </div>
        <ol>
          {model.chapters.map((c) => (
            <li
              key={c.id}
              data-complete={c.complete}
              aria-current={c.id === chapter.id ? "step" : undefined}
            >
              <span className="journey-number">
                {c.complete ? "✓" : String(c.number).padStart(2, "0")}
              </span>
              <div>
                <Link href={momentumHref(w.id, c.destination)}>
                  {c.title}
                  <Arrow diagonal size={14} />
                </Link>
                <p>{c.summary}</p>
              </div>
              <span className="journey-state">
                {c.complete
                  ? "Complete"
                  : c.id === chapter.id
                    ? "In focus"
                    : "Open"}
              </span>
            </li>
          ))}
        </ol>
      </section>
      <section className="guest-summary">
        <div>
          <span>Your people</span>
          <Link href={link("guests")}>
            Manage guest list <Arrow diagonal size={15} />
          </Link>
        </div>
        <div className="summary-numbers">
          {[
            [data.guests.length, "On the guest list", "all"],
            [model.health.attending.length, "Attending", "attending"],
            [
              model.health.awaiting.length,
              "Invited, awaiting reply",
              "awaiting",
            ],
            [
              data.guests.filter((g) => g.status === "declined").length,
              "Unable to attend",
              "declined",
            ],
          ].map(([n, label, filter]) => (
            <Link href={link("guests", String(filter))} key={label}>
              <span className="stat-dot" />
              <strong>{n}</strong>
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </section>
      <section className="momentum-recent">
        <span className="eyebrow">WHAT HAS CHANGED</span>
        <h2>Little updates</h2>
        {data.activity.length ? (
          data.activity.slice(0, 4).map((a) => (
            <div className="report-line" key={a.id}>
              <span>{a.action}</span>
              <time dateTime={a.created_at}>
                {new Date(a.created_at).toLocaleDateString()}
              </time>
            </div>
          ))
        ) : (
          <p>
            Your names, date and world are saved. This is where your next pieces
            of work will appear.
          </p>
        )}
      </section>
    </>
  );
}
