"use client";
import { PageHeading, type PanelProps } from "@/components/studio/shared";
import { Arrow, Field, Modal, Notice, Submit } from "@/components/ui";
import { eventInstant, localEventTime } from "@/lib/event-time";
import type { Event } from "@/lib/types";
import { eventTime, formatDate } from "@/lib/worlds";
import {
  CalendarBlankIcon,
  LockSimpleIcon,
  PencilSimpleIcon,
  PlusIcon,
} from "@phosphor-icons/react";
import { TimezoneField } from "@/components/timezone-field";
import { useState } from "react";

export function EventsManager({ data, mutate, notify }: PanelProps) {
  const [editing, setEditing] = useState<Event | null | undefined>(undefined),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [visibility, setVisibility] = useState("all");
  return (
    <>
      <PageHeading
        title="Every moment, considered."
        description="Give each gathering its own place in your wedding story."
      >
        <button
          className="button primary"
          onClick={() => {
            setVisibility("all");
            setEditing(null);
          }}
        >
          <PlusIcon size={17} />
          Add an event
        </button>
      </PageHeading>
      <div className="event-list">
        {data.events.map((event, i) => (
          <article className="event-studio" key={event.id}>
            <div className="event-date">
              <span>
                {formatDate(event.starts_at, "en", {
                  month: "short",
                  timeZone: event.timezone,
                })}
              </span>
              <strong>
                {formatDate(event.starts_at, "en", {
                  day: "2-digit",
                  timeZone: event.timezone,
                })}
              </strong>
            </div>
            <div className="event-detail">
              <span className="eyebrow">MOMENT 0{i + 1}</span>
              <h2>{event.title}</h2>
              <p>
                {eventTime(event.starts_at, event.timezone)} –{" "}
                {eventTime(event.ends_at, event.timezone)} · {event.timezone}
              </p>
              <p>
                {event.venue} · {event.address}
              </p>
              <div className="tags">
                <span>
                  {event.visibility === "private" ? (
                    <>
                      <LockSimpleIcon size={13} />
                      Selected households
                    </>
                  ) : (
                    "All invited guests"
                  )}
                </span>
                <span>{event.dress_code || "Dress code not set"}</span>
                <span>Capacity {event.capacity}</span>
              </div>
            </div>
            <button
              className="button outline small"
              onClick={() => {
                setVisibility(event.visibility);
                setError("");
                setEditing(event);
              }}
            >
              <PencilSimpleIcon size={16} />
              Edit event
            </button>
          </article>
        ))}
      </div>
      {!data.events.length && (
        <div className="empty-state">
          <CalendarBlankIcon size={36} />
          <h2>What’s on the programme?</h2>
          <p>
            Add your ceremony, reception, or a little something before the big
            day.
          </p>
        </div>
      )}
      {editing !== undefined && (
        <Modal
          title={editing ? "Edit this moment" : "A new moment"}
          onClose={() => setEditing(undefined)}
          wide
        >
          {error && <Notice error>{error}</Notice>}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              const f = new FormData(e.currentTarget);
              try {
                await mutate(
                  "events" + (editing ? "/" + editing.id : ""),
                  {
                    ...Object.fromEntries(f),
                    starts_at: eventInstant(
                      String(f.get("starts_at")),
                      String(f.get("timezone")),
                    ),
                    ends_at: eventInstant(
                      String(f.get("ends_at")),
                      String(f.get("timezone")),
                    ),
                    capacity: Number(f.get("capacity")),
                    rsvp_required: f.has("rsvp_required"),
                    household_ids: f.getAll("household_ids"),
                    visibility,
                  },
                  editing ? "PATCH" : "POST",
                );
                setEditing(undefined);
                notify("Your event is saved.");
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="form-grid">
              <Field label="Event title">
                <input
                  name="title"
                  list="event-title-ideas"
                  defaultValue={editing?.title}
                  required
                />
                <datalist id="event-title-ideas">
                  {[
                    "Wedding ceremony",
                    "Reception",
                    "Welcome drinks",
                    "Rehearsal dinner",
                    "Farewell brunch",
                  ].map((title) => (
                    <option key={title}>{title}</option>
                  ))}
                </datalist>
              </Field>
              <Field label="Spanish title">
                <input name="title_es" defaultValue={editing?.title_es} />
              </Field>
              <Field
                label="Starts"
                hint="Use the local time at your venue. We handle the timezone."
              >
                <input
                  name="starts_at"
                  type="datetime-local"
                  defaultValue={
                    editing
                      ? localEventTime(editing.starts_at, editing.timezone)
                      : data.wedding.date + "T16:00"
                  }
                  required
                />
              </Field>
              <Field label="Ends">
                <input
                  name="ends_at"
                  type="datetime-local"
                  defaultValue={
                    editing
                      ? localEventTime(editing.ends_at, editing.timezone)
                      : data.wedding.date + "T23:00"
                  }
                  required
                />
              </Field>
              <TimezoneField
                label="Venue timezone"
                defaultValue={editing?.timezone || data.wedding.timezone}
              />
              <Field label="Capacity">
                <input
                  name="capacity"
                  type="number"
                  min={1}
                  max={10000}
                  defaultValue={
                    editing?.capacity || Math.max(1, data.guests.length || 100)
                  }
                  required
                />
              </Field>
              <Field label="Venue">
                <input name="venue" defaultValue={editing?.venue} required />
              </Field>
              <Field label="Address">
                <input
                  name="address"
                  defaultValue={editing?.address ?? data.wedding.location}
                />
              </Field>
            </div>
            <Field label="The details">
              <textarea
                name="description"
                defaultValue={editing?.description}
              />
            </Field>
            <Field label="Dress code">
              <input
                name="dress_code"
                list="dress-code-ideas"
                defaultValue={editing?.dress_code}
                placeholder="Choose a suggestion or write your own"
              />
              <datalist id="dress-code-ideas">
                {[
                  "Black tie",
                  "Formal",
                  "Cocktail attire",
                  "Garden party",
                  "Smart casual",
                  "Come as you feel comfortable",
                ].map((code) => (
                  <option key={code}>{code}</option>
                ))}
              </datalist>
            </Field>
            <Field label="Who is invited?">
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
              >
                <option value="all">All invited guests</option>
                <option value="private">Selected households only</option>
              </select>
            </Field>
            {visibility === "private" && (
              <fieldset className="household-checkboxes">
                <legend>Invited households</legend>
                {data.households.map((h) => (
                  <label className="check-label" key={h.id}>
                    <input
                      type="checkbox"
                      name="household_ids"
                      value={h.id}
                      defaultChecked={editing?.household_ids?.includes(h.id)}
                    />
                    {h.name}
                  </label>
                ))}
              </fieldset>
            )}
            <label className="check-label">
              <input
                type="checkbox"
                name="rsvp_required"
                defaultChecked={editing?.rsvp_required ?? true}
              />
              Ask for an RSVP to this event
            </label>
            <div className="form-actions">
              <button
                type="button"
                className="button outline"
                onClick={() => setEditing(undefined)}
              >
                Cancel
              </button>
              <Submit pending={busy}>
                Save event
                <Arrow />
              </Submit>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
