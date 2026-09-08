"use client";
import { useState } from "react";
import type { Guest } from "@/lib/types";
import { Arrow, Field, Modal, Notice, Submit } from "@/components/ui";
import type { PanelProps } from "./shared";
import { DraftStatus } from "./draft-status";
import { useDraft } from "./use-draft";

export function GuestEditor({
  data,
  mutate,
  notify,
  guest,
  onClose,
}: Pick<PanelProps, "data" | "mutate" | "notify"> & {
  guest: Guest | null;
  onClose: () => void;
}) {
  const draft = useDraft(
    `${data.user.email}:${data.wedding.id}:guest:${guest?.id || "new"}`,
    {
      name: guest?.name || "",
      email: guest?.email || "",
      phone: guest?.phone || "",
      household: "",
      address: guest?.address || "",
      tags: guest?.tags || "",
      language: guest?.language || data.wedding.locale,
      notes: guest?.notes || "",
      is_plus_one: guest?.is_plus_one || false,
      consent: guest?.consent || false,
    },
  );
  const value = draft.value;
  const change = <K extends keyof typeof value>(
    key: K,
    next: (typeof value)[K],
  ) => draft.update((previous) => ({ ...previous, [key]: next }));
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <Modal
      title={guest ? "A guest’s details" : "Add someone you love"}
      onClose={onClose}
    >
      <DraftStatus status={draft.status} discard={draft.discard} />
      {error && <Notice error>{error}</Notice>}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await mutate(
              `guests${guest ? "/" + guest.id : ""}`,
              value,
              guest ? "PATCH" : "POST",
            );
            draft.clear();
            onClose();
            notify(
              guest
                ? "Guest details saved."
                : "A place for one more. Guest added.",
            );
          } catch (cause) {
            setError((cause as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field label="Full name">
          <input
            name="name"
            value={value.name}
            onChange={(e) => change("name", e.target.value)}
            required
            placeholder="Jessica Williams"
          />
        </Field>
        <div className="form-grid">
          <Field label="Email">
            <input
              name="email"
              type="email"
              value={value.email}
              onChange={(e) => change("email", e.target.value)}
            />
          </Field>
          <Field label="Phone">
            <input
              name="phone"
              type="tel"
              value={value.phone}
              onChange={(e) => change("phone", e.target.value)}
            />
          </Field>
        </div>
        {!guest && (
          <Field
            label="Household"
            hint="Use the same household name to group people on one invitation."
          >
            <input
              name="household"
              list="households"
              value={value.household}
              onChange={(e) => change("household", e.target.value)}
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
          <textarea
            name="address"
            value={value.address}
            onChange={(e) => change("address", e.target.value)}
            rows={2}
          />
        </Field>
        <div className="form-grid">
          <Field label="Tags" hint="Separate tags with commas.">
            <input
              name="tags"
              value={value.tags}
              onChange={(e) => change("tags", e.target.value)}
              placeholder="Family, Out of town"
            />
          </Field>
          <Field label="Language">
            <select
              name="language"
              value={value.language}
              onChange={(e) => change("language", e.target.value)}
            >
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </Field>
        </div>
        <Field label="Private notes">
          <textarea
            name="notes"
            value={value.notes}
            onChange={(e) => change("notes", e.target.value)}
            rows={2}
          />
        </Field>
        {!guest && (
          <label className="check-label">
            <input
              name="is_plus_one"
              type="checkbox"
              checked={value.is_plus_one}
              onChange={(e) => change("is_plus_one", e.target.checked)}
            />
            This is an assigned plus-one (they can update their name)
          </label>
        )}
        <label className="check-label">
          <input
            name="consent"
            type="checkbox"
            checked={value.consent}
            onChange={(e) => change("consent", e.target.checked)}
          />
          This guest has agreed to receive wedding messages
        </label>
        <div className="form-actions">
          <button type="button" className="button outline" onClick={onClose}>
            Close and keep draft
          </button>
          <Submit pending={busy}>
            Save guest
            <Arrow />
          </Submit>
        </div>
      </form>
    </Modal>
  );
}
