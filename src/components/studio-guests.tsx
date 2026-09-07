"use client";
import { useState } from "react";
import Papa from "papaparse";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  UploadSimpleIcon,
  DownloadSimpleIcon,
  PencilSimpleIcon,
  TrashIcon,
  LockSimpleIcon,
  CalendarBlankIcon,
} from "@phosphor-icons/react";
import { PageHeading, type PanelProps } from "./studio";
import { Modal, Field, Submit, Notice, Arrow } from "./ui";
import { formatDate, eventTime } from "@/lib/worlds";
import { eventInstant, localEventTime } from "@/lib/event-time";
import type { Guest, Event } from "@/lib/types";
export function GuestManager({ data, mutate, notify }: PanelProps) {
  const [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all"),
    [edit, setEdit] = useState<Guest | null | undefined>(undefined),
    [importing, setImporting] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [remove, setRemove] = useState<Guest | null>(null);
  const guests = data.guests.filter(
    (g) =>
      (filter === "all" || g.status === filter) &&
      (g.name + " " + g.email + " " + g.tags)
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        title="Your people, together."
        description="Every household, every plus-one, every detail. One guest list."
      >
        <button className="button outline" onClick={() => setImporting(true)}>
          <UploadSimpleIcon size={17} />
          Import guests
        </button>
        <button
          className="button primary"
          onClick={() => {
            setError("");
            setEdit(null);
          }}
        >
          <PlusIcon size={17} />
          Add guest
        </button>
      </PageHeading>
      <div className="table-toolbar">
        <div className="filter-tabs">
          {[
            ["all", "All guests"],
            ["attending", "Attending"],
            ["pending", "Awaiting reply"],
            ["declined", "Declined"],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={filter === value ? "active" : ""}
            >
              {label}
              <span>
                {value === "all"
                  ? data.guests.length
                  : data.guests.filter((g) => g.status === value).length}
              </span>
            </button>
          ))}
        </div>
        <div className="search">
          <MagnifyingGlassIcon size={18} />
          <input
            aria-label="Search guests"
            placeholder="Search your guests"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="table-container">
        <table className="guest-table">
          <thead>
            <tr>
              <th>Guest</th>
              <th>Household</th>
              <th>RSVP</th>
              <th>Tags</th>
              <th>Meal & dietary</th>
              <th>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {guests.map((g) => (
              <tr key={g.id}>
                <td>
                  <div className="guest-cell">
                    <span className="avatar">
                      {g.name
                        .split(" ")
                        .map((s) => s[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <div>
                      <b>{g.name}</b>
                      <small>
                        {g.email || "No email yet"}
                        {g.is_plus_one ? " · Plus-one" : ""}
                      </small>
                    </div>
                  </div>
                </td>
                <td data-label="Household">
                  {data.households.find((h) => h.id === g.household_id)?.name}
                </td>
                <td>
                  <span className={"status " + g.status}>
                    {g.status === "pending"
                      ? "Awaiting reply"
                      : g.status === "attending"
                        ? "Attending"
                        : "Declined"}
                  </span>
                </td>
                <td>
                  <div className="tags">
                    {g.tags
                      .split(",")
                      .filter(Boolean)
                      .map((t) => (
                        <span key={t}>{t.trim()}</span>
                      ))}
                  </div>
                </td>
                <td data-label="Meal & dietary">
                  {g.meal || "—"}
                  {g.dietary && (
                    <small className="dietary-note">{g.dietary}</small>
                  )}
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      className="icon-button"
                      aria-label={"Edit " + g.name}
                      onClick={() => {
                        setError("");
                        setEdit(g);
                      }}
                    >
                      <PencilSimpleIcon size={17} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={"Remove " + g.name}
                      onClick={() => setRemove(g)}
                    >
                      <TrashIcon size={17} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!guests.length && (
          <div className="empty-state">
            <h2>
              {data.guests.length
                ? "No matching guests."
                : "Start with your people."}
            </h2>
            <p>
              {data.guests.length
                ? "Try another name, tag, or RSVP filter."
                : "Add someone you love, or bring your guest list in from a spreadsheet."}
            </p>
            <button
              className="button outline"
              onClick={() =>
                data.guests.length
                  ? (setSearch(""), setFilter("all"))
                  : setEdit(null)
              }
            >
              {data.guests.length ? "Clear filters" : "Add your first guest"}
              <Arrow />
            </button>
          </div>
        )}
      </div>
      <div className="table-footer">
        <span>
          {guests.length} guests · {data.households.length} households
        </span>
        <a
          className="text-link"
          href={"/api/studio/export?wedding=" + data.wedding.id}
        >
          <DownloadSimpleIcon size={16} />
          Export CSV
        </a>
      </div>
      {edit !== undefined && (
        <Modal
          title={edit ? "A guest’s details" : "Add someone you love"}
          onClose={() => setEdit(undefined)}
        >
          {error && <Notice error>{error}</Notice>}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              const f = new FormData(e.currentTarget);
              const input = {
                ...Object.fromEntries(f),
                is_plus_one: f.has("is_plus_one"),
                consent: f.has("consent"),
              };
              try {
                await mutate(
                  "guests" + (edit ? "/" + edit.id : ""),
                  input,
                  edit ? "PATCH" : "POST",
                );
                setEdit(undefined);
                notify(
                  edit
                    ? "Guest details saved."
                    : "A place for one more. Guest added.",
                );
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <Field label="Full name">
              <input
                name="name"
                defaultValue={edit?.name}
                required
                placeholder="Jessica Williams"
              />
            </Field>
            <div className="form-grid">
              <Field label="Email">
                <input name="email" type="email" defaultValue={edit?.email} />
              </Field>
              <Field label="Phone">
                <input name="phone" type="tel" defaultValue={edit?.phone} />
              </Field>
            </div>
            {!edit && (
              <Field
                label="Household"
                hint="Use the same household name to group people on one invitation."
              >
                <input
                  name="household"
                  list="households"
                  placeholder="Williams household"
                />
                <datalist id="households">
                  {data.households.map((h) => (
                    <option key={h.id}>{h.name}</option>
                  ))}
                </datalist>
              </Field>
            )}
            <Field label="Postal address">
              <textarea name="address" defaultValue={edit?.address} rows={2} />
            </Field>
            <div className="form-grid">
              <Field label="Tags" hint="Separate tags with commas.">
                <input
                  name="tags"
                  defaultValue={edit?.tags}
                  placeholder="Family, Out of town"
                />
              </Field>
              <Field label="Language">
                <select name="language" defaultValue={edit?.language || "en"}>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </Field>
            </div>
            <Field label="Private notes">
              <textarea name="notes" defaultValue={edit?.notes} rows={2} />
            </Field>
            {!edit && (
              <label className="check-label">
                <input type="checkbox" name="is_plus_one" />
                This is an assigned plus-one (they can update their name)
              </label>
            )}
            <label className="check-label">
              <input
                type="checkbox"
                name="consent"
                defaultChecked={edit?.consent}
              />
              This guest has agreed to receive wedding messages
            </label>
            <div className="form-actions">
              <button
                type="button"
                className="button outline"
                onClick={() => setEdit(undefined)}
              >
                Cancel
              </button>
              <Submit pending={busy}>
                Save guest <Arrow />
              </Submit>
            </div>
          </form>
        </Modal>
      )}
      {remove && (
        <Modal
          title={"Remove " + remove.name + "?"}
          onClose={() => setRemove(null)}
        >
          <p>Their RSVP and seat assignment will also be removed.</p>
          <div className="form-actions">
            <button className="button outline" onClick={() => setRemove(null)}>
              Keep guest
            </button>
            <button
              className="button danger"
              onClick={async () => {
                try {
                  await mutate("guests/" + remove.id, undefined, "DELETE");
                  setRemove(null);
                  notify("Guest removed.");
                } catch (e) {
                  notify((e as Error).message);
                }
              }}
            >
              Remove guest
            </button>
          </div>
        </Modal>
      )}
      {importing && (
        <ImportGuests
          data={data}
          mutate={mutate}
          onClose={() => setImporting(false)}
          notify={notify}
        />
      )}
    </>
  );
}
function ImportGuests({
  data,
  mutate,
  onClose,
  notify,
}: {
  data: PanelProps["data"];
  mutate: PanelProps["mutate"];
  onClose: () => void;
  notify: PanelProps["notify"];
}) {
  const [records, setRecords] = useState<Record<string, string>[]>([]),
    [mapping, setMapping] = useState<Record<string, string>>({}),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [skip, setSkip] = useState<number[]>([]);
  const fields = [
    "name",
    "first name",
    "last name",
    "email",
    "phone",
    "household",
    "tags",
  ];
  const aliases: Record<string, string[]> = {
    name: ["name", "full name", "guest name"],
    "first name": ["first", "first name", "firstname"],
    "last name": ["last", "last name", "surname", "lastname"],
    email: ["email", "email address"],
    phone: ["phone", "phone #", "mobile", "telephone"],
    household: ["household", "family", "group", "guest of"],
    tags: ["tags", "relationship"],
  };
  const mapped = records.map((r) => ({
    name:
      r[mapping.name] ||
      [r[mapping["first name"]], r[mapping["last name"]]]
        .filter(Boolean)
        .join(" "),
    email: r[mapping.email] || "",
    phone: r[mapping.phone] || "",
    household: r[mapping.household] || "",
    tags: r[mapping.tags] || "",
  }));
  const invalid = (r: (typeof mapped)[number]) =>
    !r.name.trim() ||
    (!!r.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email));
  const duplicate = (r: (typeof mapped)[number], i: number) =>
    data.guests.some(
      (g) =>
        g.name.toLowerCase() === r.name.toLowerCase() ||
        (r.email && g.email.toLowerCase() === r.email.toLowerCase()),
    ) ||
    mapped
      .slice(0, i)
      .some((g) => g.name.toLowerCase() === r.name.toLowerCase());
  return (
    <Modal title="Bring your people with you." onClose={onClose} wide>
      <p className="muted-copy">
        Import a CSV from Excel, Numbers, or Google Sheets. Map your columns,
        review every row, then add your guests.
      </p>
      {error && <Notice error>{error}</Notice>}
      <Field label="Choose a CSV file">
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 2_000_000) {
              setError("Choose a CSV under 2 MB.");
              return;
            }
            Papa.parse<Record<string, string>>(file, {
              header: true,
              skipEmptyLines: "greedy",
              complete: (result) => {
                if (result.errors.length) {
                  setError(result.errors.map((e) => e.message).join(" "));
                  return;
                }
                const headers = result.meta.fields || [];
                setMapping(
                  Object.fromEntries(
                    fields.map((f) => [
                      f,
                      headers.find((h) =>
                        aliases[f].includes(h.toLowerCase().trim()),
                      ) || "",
                    ]),
                  ),
                );
                setRecords(result.data);
                setSkip([]);
                setError("");
              },
            });
          }}
        />
      </Field>
      {records.length > 0 && (
        <>
          <div className="import-mapping">
            {fields.map((f) => (
              <Field label={f} key={f}>
                <select
                  value={mapping[f] || ""}
                  onChange={(e) =>
                    setMapping({ ...mapping, [f]: e.target.value })
                  }
                >
                  <option value="">Not mapped</option>
                  {Object.keys(records[0]).map((h) => (
                    <option key={h}>{h}</option>
                  ))}
                </select>
              </Field>
            ))}
          </div>
          <div className="table-container import-preview">
            <table>
              <thead>
                <tr>
                  <th>Include</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Review</th>
                </tr>
              </thead>
              <tbody>
                {mapped.map((r, i) => (
                  <tr key={i}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={"Include row " + (i + 1)}
                        checked={!skip.includes(i)}
                        onChange={(e) =>
                          setSkip(
                            e.target.checked
                              ? skip.filter((v) => v !== i)
                              : [...skip, i],
                          )
                        }
                      />
                    </td>
                    <td>{r.name || "Missing name"}</td>
                    <td>{r.email || "—"}</td>
                    <td>
                      <span
                        className={
                          "status " +
                          (invalid(r)
                            ? "declined"
                            : duplicate(r, i)
                              ? "pending"
                              : "attending")
                        }
                      >
                        {invalid(r)
                          ? "Fix name or email"
                          : duplicate(r, i)
                            ? "Possible duplicate"
                            : "Ready"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            {mapped.length - skip.length} rows selected.{" "}
            {mapped.filter((r, i) => !skip.includes(i) && invalid(r)).length}{" "}
            errors. Correct errors in your CSV and re-upload, or explicitly
            deselect rows to leave them out.
          </p>
          <div className="form-actions">
            <button className="button outline" onClick={onClose}>
              Cancel
            </button>
            <button
              className="button primary"
              disabled={
                busy ||
                mapped.every((_, i) => skip.includes(i)) ||
                mapped.some((r, i) => !skip.includes(i) && invalid(r))
              }
              onClick={async () => {
                setBusy(true);
                try {
                  await mutate(
                    "guests",
                    mapped.filter((_, i) => !skip.includes(i)),
                  );
                  notify(`${mapped.length - skip.length} guests imported.`);
                  onClose();
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Importing…" : "Import selected guests"}
              <Arrow />
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
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
                <input name="title" defaultValue={editing?.title} required />
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
              <Field
                label="Venue timezone"
                hint="Changing this keeps the times you entered in the selected timezone."
              >
                <input
                  name="timezone"
                  list="event-timezones"
                  defaultValue={editing?.timezone || data.wedding.timezone}
                  required
                />
              </Field>
              <datalist id="event-timezones">
                {Intl.supportedValuesOf("timeZone").map((zone) => (
                  <option key={zone} value={zone} />
                ))}
              </datalist>
              <Field label="Capacity">
                <input
                  name="capacity"
                  type="number"
                  min={1}
                  max={10000}
                  defaultValue={editing?.capacity || 200}
                  required
                />
              </Field>
              <Field label="Venue">
                <input name="venue" defaultValue={editing?.venue} required />
              </Field>
              <Field label="Address">
                <input name="address" defaultValue={editing?.address} />
              </Field>
            </div>
            <Field label="The details">
              <textarea
                name="description"
                defaultValue={editing?.description}
              />
            </Field>
            <Field label="Dress code">
              <input name="dress_code" defaultValue={editing?.dress_code} />
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
export function RsvpManager({ data, mutate, notify }: PanelProps) {
  const [add, setAdd] = useState(false),
    [error, setError] = useState("");
  return (
    <>
      <PageHeading
        title="A yes. A little anticipation."
        description="Keep responses and the questions you ask in one place."
      >
        <button className="button primary" onClick={() => setAdd(true)}>
          <PlusIcon size={16} />
          Add a question
        </button>
        <a
          className="button outline"
          href={"/api/studio/export?wedding=" + data.wedding.id}
        >
          Export responses
          <Arrow diagonal />
        </a>
      </PageHeading>
      <div className="rsvp-management">
        <section>
          <h2>The replies</h2>
          {data.guests.map((g) => (
            <div className="response-row" key={g.id}>
              <div>
                <b>{g.name}</b>
                <small>
                  {g.meal || "No meal selected"}
                  {g.dietary ? " · " + g.dietary : ""}
                </small>
              </div>
              <span className={"status " + g.status}>
                {g.status === "pending" ? "Awaiting reply" : g.status}
              </span>
            </div>
          ))}
        </section>
        <section>
          <h2>A few thoughtful questions</h2>
          <p className="muted-copy">
            Attendance and meal choice are built in. Additional questions can
            appear only when a guest attends.
          </p>
          {data.questions.map((q) => (
            <div className="question-row" key={q.id}>
              <div>
                <b>{q.label}</b>
                <small>
                  {q.type} · {q.scope} ·{" "}
                  {q.condition === "attending"
                    ? "When attending"
                    : "Always shown"}
                  {q.required ? " · Required" : ""}
                </small>
              </div>
              <button
                className="icon-button"
                aria-label={"Remove " + q.label}
                onClick={async () => {
                  try {
                    await mutate("questions/" + q.id, undefined, "DELETE");
                    notify("Question removed.");
                  } catch (e) {
                    notify((e as Error).message);
                  }
                }}
              >
                <TrashIcon size={17} />
              </button>
            </div>
          ))}
          <Notice>
            Guests can update their response until{" "}
            {formatDate(data.wedding.rsvp_deadline)}. Change the deadline in
            Settings.
          </Notice>
        </section>
      </div>
      {add && (
        <Modal title="Ask something thoughtful" onClose={() => setAdd(false)}>
          {error && <Notice error>{error}</Notice>}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              try {
                await mutate("questions", {
                  ...Object.fromEntries(f),
                  options: String(f.get("options")).split("\n").filter(Boolean),
                  required: f.has("required"),
                });
                setAdd(false);
                notify("RSVP question added.");
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <Field label="Your question">
              <input name="label" required />
            </Field>
            <Field label="Spanish translation">
              <input name="label_es" />
            </Field>
            <div className="form-grid">
              <Field label="Answer format">
                <select name="type">
                  <option value="text">Text</option>
                  <option value="select">Choose an option</option>
                  <option value="yes-no">Yes / no</option>
                  <option value="number">Number</option>
                </select>
              </Field>
              <Field label="Ask">
                <select name="scope">
                  <option value="household">Once per household</option>
                  <option value="person">For each person</option>
                </select>
              </Field>
            </div>
            <Field label="Options (one per line)">
              <textarea name="options" />
            </Field>
            <Field label="When to ask">
              <select name="condition">
                <option value="attending">Only when attending</option>
                <option value="always">Always</option>
              </select>
            </Field>
            <label className="check-label">
              <input type="checkbox" name="required" />
              Require an answer
            </label>
            <Submit>
              Save question
              <Arrow />
            </Submit>
          </form>
        </Modal>
      )}
    </>
  );
}
