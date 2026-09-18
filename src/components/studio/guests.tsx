"use client";
import { PageHeading, type PanelProps } from "@/components/studio/shared";
import { Arrow, Modal } from "@/components/ui";
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
import { GuestEditor } from "./guest-editor";
import { useDraft } from "./use-draft";
import { ImportGuests } from "./import-guests";
import { weddingHealth, matchesGuestFilter } from "@/lib/momentum";
import { useWorkFilter } from "./use-work-filter";
export function GuestManager({ data, mutate, notify }: PanelProps) {
  const health = weddingHealth(data);
  const [filter, setFilter] = useWorkFilter([
    "all",
    "attending",
    "pending",
    "declined",
    "missing-email",
    "unnamed-plus-ones",
    "awaiting",
  ]);
  const [search, setSearch] = useState(""),
    [remove, setRemove] = useState<Guest | null>(null);
  const active = useDraft(
    data.user.email + ":" + data.wedding.id + ":guest-editor",
    { id: "", importing: false },
  );
  const edit =
    active.value.id === "new"
      ? null
      : data.guests.find((g) => g.id === active.value.id);
  const setEdit = (guest: Guest | null | undefined) =>
    active.update((previous) => ({
      ...previous,
      id: guest === null ? "new" : guest?.id || "",
    }));
  const importing = active.value.importing;
  const setImporting = (importing: boolean) =>
    active.update((previous) => ({ ...previous, importing }));
  const guests = data.guests.filter(
    (g) =>
      matchesGuestFilter(g, filter, health) &&
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
            setEdit(null);
          }}
        >
          <PlusIcon size={17} />
          Add guest
        </button>
      </PageHeading>
      {!!data.guests.length && (
        <section className="work-health" aria-label="Guest list health">
          <span className="eyebrow">YOUR PEOPLE, ACCOUNTED FOR</span>
          <h2>
            {data.guests.length} guests · {health.households.length} households
          </h2>
          <p>
            {health.missingEmail.length
              ? "One email per household makes their private invitation reachable."
              : "Every household has an email for their invitation."}
          </p>
          <div className="work-health-actions">
            <button
              aria-pressed={filter === "missing-email"}
              onClick={() => {
                setSearch("");
                setFilter("missing-email");
              }}
            >
              {health.missingEmail.length} households need an email →
            </button>
            <button
              aria-pressed={filter === "unnamed-plus-ones"}
              onClick={() => {
                setSearch("");
                setFilter("unnamed-plus-ones");
              }}
            >
              {health.unnamed.length} plus-ones need names →
            </button>
          </div>
        </section>
      )}
      {!["all", "attending", "pending", "declined"].includes(filter) && (
        <div className="exception-filter" role="status">
          <span>
            {filter === "missing-email"
              ? "Showing every member of households without an email. Add an email to one member to resolve the household."
              : filter === "awaiting"
                ? "Showing invited guests who have not replied."
                : "Showing plus-ones whose names need confirming."}
          </span>
          <button onClick={() => setFilter("all")}>Show all guests</button>
        </div>
      )}
      {!data.guests.length && (
        <section className="pilot-panel">
          <h2>Start with your first household.</h2>
          <p>
            Add guests individually or bring your existing spreadsheet. Guests
            with the same household name share one invitation.
          </p>
          <a
            className="text-link"
            download="wedding-guests-template.csv"
            href={
              "data:text/csv;charset=utf-8," +
              encodeURIComponent(
                "name,email,household,phone\nAlex Example,alex@example.com,Example household,\nSam Example,,Example household,\n",
              )
            }
          >
            Download a sample guest spreadsheet
          </a>
          <p className="muted-copy">
            Replace the example rows with your guests. You can review columns
            and duplicates before anything is imported.
          </p>
        </section>
      )}
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
                        {g.is_child ? " · Child" : ""}
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
        <GuestEditor
          key={edit?.id || "new"}
          data={data}
          mutate={mutate}
          notify={notify}
          guest={edit}
          onClose={() => setEdit(undefined)}
        />
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
