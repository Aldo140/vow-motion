"use client";
import { Arrow, Field, Modal } from "@/components/ui";
import type { StudioData } from "@/lib/types";
import { useState, type ReactNode } from "react";
export type PanelProps = {
  data: StudioData;
  refresh: () => Promise<void>;
  mutate: (path: string, body?: unknown, method?: string) => Promise<unknown>;
  notify: (text: string) => void;
};

export function PageHeading({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="heading-actions">{children}</div>
    </div>
  );
}

export function PreviewButton({ data, mutate, notify }: PanelProps) {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [householdId, setHouseholdId] = useState(data.households[0]?.id || "");
  const household = data.households.find((h) => h.id === householdId);
  const events = data.events.filter(
    (e) => e.visibility === "all" || e.household_ids?.includes(householdId),
  );
  return (
    <>
      <button className="button outline small" onClick={() => setOpen(true)}>
        Guest preview
        <Arrow diagonal size={15} />
      </button>
      {open && (
        <Modal
          title="Preview a household’s invitation"
          onClose={() => setOpen(false)}
        >
          <p>
            Choose who you are previewing. The preview is read-only and expires
            after one hour.
          </p>
          <Field label="Household">
            <select
              value={householdId}
              onChange={(e) => setHouseholdId(e.target.value)}
            >
              <option value="">Choose a household</option>
              {data.households.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </Field>
          {household && (
            <>
              <p>
                {data.guests
                  .filter((g) => g.household_id === householdId)
                  .map((g) => g.name)
                  .join(", ")}
              </p>
              <h3>Events they will see</h3>
              <ul>
                {events.map((e) => (
                  <li key={e.id}>
                    {e.title}
                    {e.visibility === "private" ? " · Private invitation" : ""}
                  </li>
                ))}
              </ul>
              <p>
                {data.events.length - events.length} other events are hidden
                from this household.
              </p>
            </>
          )}
          <button
            className="button outline small"
            disabled={busy || !household || data.role === "viewer"}
            onClick={async () => {
              if (!household) {
                notify("Add a guest to preview their personal invitation.");
                return;
              }
              setBusy(true);
              try {
                const result = (await mutate("preview", {
                  household_id: household.id,
                })) as { url: string };
                window.location.href = result.url;
              } catch (e) {
                notify((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Opening…" : "Open household preview"}
            <Arrow diagonal size={15} />
          </button>
        </Modal>
      )}
    </>
  );
}
