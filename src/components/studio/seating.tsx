"use client";
import { PageHeading, type PanelProps } from "@/components/studio/shared";
import { Arrow, Field, Modal, Submit } from "@/components/ui";
import { ArmchairIcon, PlusIcon, QrCodeIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { finderConfig } from "@/lib/finder";

export function SeatingManager({ data, mutate, notify, refresh }: PanelProps) {
  const [add, setAdd] = useState(false),
    [search, setSearch] = useState("");
  const attending = data.guests.filter((g) => g.status === "attending"),
    unassigned = attending.filter(
      (g) => !g.table_id && g.name.toLowerCase().includes(search.toLowerCase()),
    );
  const assign = async (guestId: string, tableId: string | null) => {
    try {
      await mutate("seating", { guest_id: guestId, table_id: tableId });
      notify(
        tableId ? "A place at the table, saved." : "Guest moved to unassigned.",
      );
    } catch (e) {
      notify((e as Error).message);
    }
  };
  return (
    <>
      <PageHeading
        title="A place for everyone."
        description={`${attending.filter((g) => g.table_id).length} of ${attending.length} attending guests seated. Drag a guest, or use their table menu.`}
      >
        <a
          className="button outline"
          href={"/api/studio/export?wedding=" + data.wedding.id}
        >
          Export seating <Arrow diagonal />
        </a>
        <button className="button primary" onClick={() => setAdd(true)}>
          <PlusIcon size={17} />
          Add table
        </button>
      </PageHeading>
      <DayOfFinder
        data={data}
        mutate={mutate}
        notify={notify}
        refresh={refresh}
      />
      <div className="seating-layout">
        <aside className="unassigned">
          <h2>
            Still finding their place <span>{unassigned.length}</span>
          </h2>
          <input
            aria-label="Search unassigned guests"
            placeholder="Find a guest"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {unassigned.map((g) => (
            <div
              className="seating-guest"
              key={g.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("text/plain", g.id)}
            >
              <span className="avatar">
                {g.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
              <div>
                <b>{g.name}</b>
                <small>{g.dietary || g.meal}</small>
                <select
                  aria-label={"Table for " + g.name}
                  value=""
                  onChange={(e) => assign(g.id, e.target.value)}
                >
                  <option value="">Choose a table</option>
                  {data.tables.map((t) => (
                    <option value={t.id} key={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
          {!unassigned.length && (
            <p className="muted-copy">
              {attending.length
                ? "Everyone has a place."
                : "Guests will appear here when they accept their invitation."}
            </p>
          )}
        </aside>
        <div className="seating-floor">
          {data.tables.map((t) => {
            const seated = attending.filter((g) => g.table_id === t.id);
            return (
              <section
                className="seating-table"
                key={t.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  assign(e.dataTransfer.getData("text/plain"), t.id);
                }}
              >
                <div className="table-diagram">
                  <ArmchairIcon size={25} />
                  <h2>{t.name}</h2>
                  <span>
                    {seated.length} / {t.capacity} seats
                  </span>
                </div>
                <div className="seat-slots">
                  {seated.map((g) => (
                    <div key={g.id}>
                      <span>
                        {g.name}
                        <small>{g.dietary}</small>
                      </span>
                      <button
                        className="icon-button"
                        aria-label={"Unseat " + g.name}
                        onClick={() => assign(g.id, null)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {Array.from(
                    { length: Math.max(0, t.capacity - seated.length) },
                    (_, i) => (
                      <div className="empty-seat" key={i}>
                        <span>Open seat</span>
                        <PlusIcon size={13} />
                      </div>
                    ),
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
      {add && (
        <Modal title="Make room at the table" onClose={() => setAdd(false)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              try {
                await mutate("tables", {
                  name: f.get("name"),
                  capacity: Number(f.get("capacity")),
                });
                setAdd(false);
                notify("Table added.");
              } catch (e) {
                notify((e as Error).message);
              }
            }}
          >
            <Field label="Table name">
              <input name="name" required placeholder="Olivo" />
            </Field>
            <Field label="Seats">
              <input
                name="capacity"
                type="number"
                min={1}
                max={30}
                defaultValue={8}
                required
              />
            </Field>
            <Submit>
              Add table
              <Arrow />
            </Submit>
          </form>
        </Modal>
      )}
    </>
  );
}

function DayOfFinder({ data, mutate, notify, refresh }: PanelProps) {
  const config = finderConfig(data.wedding.settings);
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(config.notes);
  const [notesEs, setNotesEs] = useState(config.notes_es);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/f/${data.wedding.slug}`
      : `/f/${data.wedding.slug}`;

  const patch = async (body: Record<string, unknown>, message: string) => {
    try {
      await mutate("finder", body, "PATCH");
      await refresh();
      notify(message);
    } catch (e) {
      notify((e as Error).message, "error");
    }
  };

  return (
    <section className="finder-admin">
      <div className="finder-admin-top">
        <div>
          <h2>
            <QrCodeIcon size={16} /> Day-of table finder
          </h2>
          <p>
            A page guests scan at the venue to find their table, their people,
            and what is next. Anyone with the link can look up a name, so it
            only goes live from the day before to two days after the wedding.
          </p>
        </div>
        <label className="finder-admin-switch">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) =>
              patch(
                { enabled: e.target.checked },
                e.target.checked ? "Table finder is on." : "Table finder is off.",
              )
            }
          />
          {config.enabled ? "On" : "Off"}
        </label>
      </div>

      {config.enabled && (
        <>
          <div className="finder-admin-share">
            <img
              src={`/api/studio/day-of-qr?wedding=${data.wedding.id}`}
              alt="Finder QR code"
              width={104}
              height={104}
            />
            <div>
              <code>{url}</code>
              <div className="finder-admin-links">
                <a
                  href={`/api/studio/day-of-qr?wedding=${data.wedding.id}`}
                  download="table-finder-qr.svg"
                  className="text-link"
                >
                  Download QR
                </a>
                <button
                  className="text-link"
                  onClick={() => {
                    navigator.clipboard?.writeText(url);
                    notify("Link copied.");
                  }}
                >
                  Copy link
                </button>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-link"
                >
                  Open it
                </a>
              </div>
            </div>
          </div>

          <button
            className="text-link finder-admin-config"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Hide options" : "Map, notes and options"}
          </button>

          {open && (
            <div className="finder-admin-options">
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={config.always_on}
                  onChange={(e) =>
                    patch(
                      { always_on: e.target.checked },
                      "Saved.",
                    )
                  }
                />
                Keep it live all the time (not just around the wedding date)
              </label>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={config.tablemates}
                  onChange={(e) =>
                    patch({ tablemates: e.target.checked }, "Saved.")
                  }
                />
                Show each guest who else is at their table
              </label>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={config.guestbook}
                  onChange={(e) =>
                    patch({ guestbook: e.target.checked }, "Saved.")
                  }
                />
                Let guests leave you a note
              </label>

              <Field label="Venue plan (optional)">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={uploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploading(true);
                    try {
                      const form = new FormData();
                      form.append("file", file);
                      const r = await fetch(
                        `/api/studio/finder?wedding=${data.wedding.id}`,
                        { method: "POST", body: form },
                      );
                      if (!r.ok) throw new Error((await r.json()).error);
                      await refresh();
                      notify("Venue plan added.");
                    } catch (err) {
                      notify((err as Error).message, "error");
                    } finally {
                      setUploading(false);
                    }
                  }}
                />
              </Field>
              {config.map && (
                <img
                  className="finder-admin-map"
                  src={config.map}
                  alt="Venue plan"
                />
              )}

              <Field label="Notes for guests — one per line (optional)">
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    "Bar on the terrace\nCoat check by the entrance\nLast shuttle 11 PM"
                  }
                />
              </Field>
              {data.wedding.locale === "es" ||
              data.guests.some((g) => g.language === "es") ? (
                <Field label="Notes in Spanish (optional)">
                  <textarea
                    rows={3}
                    value={notesEs}
                    onChange={(e) => setNotesEs(e.target.value)}
                  />
                </Field>
              ) : null}
              <div className="form-actions">
                <button
                  className="button primary small"
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    await patch(
                      { notes, notes_es: notesEs },
                      "Notes saved.",
                    );
                    setSaving(false);
                  }}
                >
                  {saving ? "Saving…" : "Save notes"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
