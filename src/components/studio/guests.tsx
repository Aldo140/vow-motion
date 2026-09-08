"use client";
import { PageHeading, type PanelProps } from "@/components/studio/shared";
import { Arrow, Field, Modal, Notice, Submit } from "@/components/ui";
import type { Guest } from "@/lib/types";
import {
  DownloadSimpleIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  PlusIcon,
  TrashIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import { ImportGuests } from "./import-guests";
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
