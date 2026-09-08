"use client";
import { PageHeading, type PanelProps } from "@/components/studio/shared";
import { Arrow, Field, Modal, Submit } from "@/components/ui";
import { ArmchairIcon, PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";

export function SeatingManager({ data, mutate, notify }: PanelProps) {
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
