"use client";
import { ActionList } from "@/components/studio-pilot";
import { Arrow } from "@/components/ui";
import { formatDate, getWorld } from "@/lib/worlds";
import {
  CalendarBlankIcon,
  CheckIcon,
  ClockIcon,
  EnvelopeSimpleIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { PageHeading, type PanelProps } from "./shared";
export function Overview(props: PanelProps) {
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
      <ActionList {...props} />
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
