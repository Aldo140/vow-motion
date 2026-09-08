"use client";
import { useState } from "react";
import type { Event } from "@/lib/types";
import { eventInstant, localEventTime } from "@/lib/event-time";
import {
  eventConflicts,
  eventStarters,
  starterTimes,
} from "@/lib/planning-assist";
import { Arrow, Field, Modal, Notice, Submit } from "@/components/ui";
import { TimezoneField } from "@/components/timezone-field";
import type { PanelProps } from "./shared";
import { DraftStatus } from "./draft-status";
import { useDraft } from "./use-draft";

export function EventEditor({
  data,
  mutate,
  notify,
  event,
  onClose,
}: PanelProps & { event: Event | null; onClose: () => void }) {
  const draft = useDraft(
    `${data.user.email}:${data.wedding.id}:event:${event?.id || "new"}`,
    {
      title: event?.title || "",
      title_es: event?.title_es || "",
      starts_at: event
        ? localEventTime(event.starts_at, event.timezone)
        : `${data.wedding.date}T16:00`,
      ends_at: event
        ? localEventTime(event.ends_at, event.timezone)
        : `${data.wedding.date}T23:00`,
      timezone: event?.timezone || data.wedding.timezone,
      venue: event?.venue || "",
      address: event?.address ?? data.wedding.location,
      description: event?.description || "",
      dress_code: event?.dress_code || "",
      capacity: String(
        event?.capacity || Math.max(1, data.guests.length || 100),
      ),
      visibility: event?.visibility || "all",
      household_ids: event?.household_ids || [],
      rsvp_required: event?.rsvp_required ?? true,
    },
  );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const value = draft.value;
  const change = <K extends keyof typeof value>(
    key: K,
    next: (typeof value)[K],
  ) => draft.update((previous) => ({ ...previous, [key]: next }));
  const conflicts = eventConflicts(
    value.starts_at,
    value.ends_at,
    value.timezone,
    data.events,
    event?.id,
  );
  return (
    <Modal
      title={event ? "Edit this moment" : "A new moment"}
      onClose={onClose}
      wide
    >
      <DraftStatus status={draft.status} discard={draft.discard} />
      {!event && (
        <section className="event-starters" aria-label="Event starters">
          <h3>Start with a familiar moment.</h3>
          <p>
            These replace the title, times and description below. Your venue and
            guest choices stay yours to decide.
          </p>
          <div className="setup-shortcuts">
            {eventStarters.map((starter) => (
              <button
                type="button"
                className="button outline small"
                key={starter.title}
                onClick={() => {
                  try {
                    draft.update((previous) => ({
                      ...previous,
                      title: starter.title,
                      description: starter.description,
                      ...starterTimes(data.wedding.date, starter),
                    }));
                  } catch (cause) {
                    setError((cause as Error).message);
                  }
                }}
              >
                {starter.title} · {starter.duration / 60}h
              </button>
            ))}
          </div>
        </section>
      )}
      {error && <Notice error>{error}</Notice>}
      {conflicts.length > 0 && (
        <div className="planning-advice" role="status">
          {conflicts.map((text) => (
            <p key={text}>{text}</p>
          ))}
        </div>
      )}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            const starts_at = eventInstant(value.starts_at, value.timezone),
              ends_at = eventInstant(value.ends_at, value.timezone);
            if (Date.parse(ends_at) <= Date.parse(starts_at))
              throw new Error("The end must be after the start.");
            await mutate(
              `events${event ? "/" + event.id : ""}`,
              {
                ...value,
                starts_at,
                ends_at,
                capacity: Number(value.capacity),
              },
              event ? "PATCH" : "POST",
            );
            draft.clear();
            onClose();
            notify("Your event is saved.");
          } catch (cause) {
            setError((cause as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="form-grid">
          <Field label="Event title">
            <input
              name="title"
              value={value.title}
              onChange={(e) => change("title", e.target.value)}
              required
            />
          </Field>
          <Field label="Spanish title">
            <input
              name="title_es"
              value={value.title_es}
              onChange={(e) => change("title_es", e.target.value)}
            />
          </Field>
          <Field
            label="Starts"
            hint="Use the local time at your venue. We handle the timezone."
          >
            <input
              name="starts_at"
              type="datetime-local"
              value={value.starts_at}
              onChange={(e) => change("starts_at", e.target.value)}
              required
            />
          </Field>
          <Field label="Ends">
            <input
              name="ends_at"
              type="datetime-local"
              value={value.ends_at}
              onChange={(e) => change("ends_at", e.target.value)}
              required
            />
          </Field>
          <TimezoneField
            label="Venue timezone"
            value={value.timezone}
            onChange={(zone) => change("timezone", zone)}
            location={`${value.venue} ${value.address}`}
          />
          <Field label="Capacity">
            <input
              name="capacity"
              type="number"
              min={1}
              max={10000}
              value={value.capacity}
              onChange={(e) => change("capacity", e.target.value)}
              required
            />
          </Field>
          <Field label="Venue">
            <input
              name="venue"
              value={value.venue}
              onChange={(e) => change("venue", e.target.value)}
              required
            />
          </Field>
          <Field label="Address">
            <input
              name="address"
              value={value.address}
              onChange={(e) => change("address", e.target.value)}
            />
          </Field>
        </div>
        <Field label="The details">
          <textarea
            name="description"
            value={value.description}
            onChange={(e) => change("description", e.target.value)}
          />
        </Field>
        <Field label="Dress code">
          <input
            name="dress_code"
            list="event-dress-codes"
            value={value.dress_code}
            onChange={(e) => change("dress_code", e.target.value)}
          />
          <datalist id="event-dress-codes">
            {[
              "Black tie",
              "Formal",
              "Cocktail attire",
              "Garden party",
              "Smart casual",
            ].map((code) => (
              <option key={code}>{code}</option>
            ))}
          </datalist>
        </Field>
        <Field label="Who is invited?">
          <select
            value={value.visibility}
            onChange={(e) => change("visibility", e.target.value)}
          >
            <option value="all">All invited guests</option>
            <option value="private">Selected households only</option>
          </select>
        </Field>
        {value.visibility === "private" && (
          <fieldset className="household-checkboxes">
            <legend>Invited households</legend>
            {data.households.map((household) => (
              <label className="check-label" key={household.id}>
                <input
                  type="checkbox"
                  name="household_ids"
                  value={household.id}
                  checked={value.household_ids.includes(household.id)}
                  onChange={(e) =>
                    change(
                      "household_ids",
                      e.target.checked
                        ? [...value.household_ids, household.id]
                        : value.household_ids.filter(
                            (id) => id !== household.id,
                          ),
                    )
                  }
                />
                {household.name}
              </label>
            ))}
          </fieldset>
        )}
        <label className="check-label">
          <input
            name="rsvp_required"
            type="checkbox"
            checked={value.rsvp_required}
            onChange={(e) => change("rsvp_required", e.target.checked)}
          />
          Ask for an RSVP to this event
        </label>
        <div className="form-actions">
          <button type="button" className="button outline" onClick={onClose}>
            Close and keep draft
          </button>
          <Submit pending={busy}>
            Save event
            <Arrow />
          </Submit>
        </div>
      </form>
    </Modal>
  );
}
