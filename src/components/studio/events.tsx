"use client";
import { PageHeading, type PanelProps } from "./shared";
import type { Event } from "@/lib/types";
import { eventTime, formatDate } from "@/lib/worlds";
import {
  CalendarBlankIcon,
  LockSimpleIcon,
  PencilSimpleIcon,
  PlusIcon,
} from "@phosphor-icons/react";
import { EventEditor } from "./event-editor";
import { useDraft } from "./use-draft";
export function EventsManager({ data, mutate, notify, refresh }: PanelProps) {
  const active = useDraft(
    data.user.email + ":" + data.wedding.id + ":event-editor",
    { id: "" },
  );
  const editing =
    active.value.id === "new"
      ? null
      : data.events.find((event) => event.id === active.value.id);
  const setEditing = (event: Event | null | undefined) =>
    active.update({ id: event === null ? "new" : event?.id || "" });
  return (
    <>
      <PageHeading
        title="Every moment, considered."
        description="Give each gathering its own place in your wedding story."
      >
        <button
          className="button primary"
          onClick={() => {
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
        <EventEditor
          key={editing?.id || "new"}
          data={data}
          mutate={mutate}
          notify={notify}
          refresh={refresh}
          event={editing}
          onClose={() => setEditing(undefined)}
        />
      )}
    </>
  );
}
