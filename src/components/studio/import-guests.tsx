"use client";
import { type PanelProps } from "@/components/studio/shared";
import { Arrow, Field, Modal, Notice } from "@/components/ui";
import Papa from "papaparse";
import { useState } from "react";

export function ImportGuests({
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
  const [duplicatesReviewed, setDuplicatesReviewed] = useState(false);
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
      r[mapping.name]?.trim() ||
      [r[mapping["first name"]], r[mapping["last name"]]]
        .filter(Boolean)
        .join(" ")
        .trim(),
    email: (r[mapping.email] || "").trim(),
    phone: (r[mapping.phone] || "").trim(),
    household: (r[mapping.household] || "").trim(),
    tags: (r[mapping.tags] || "").trim(),
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
      .some(
        (g) =>
          g.name.toLowerCase() === r.name.toLowerCase() ||
          (!!r.email && g.email.toLowerCase() === r.email.toLowerCase()),
      );
  const selectedDuplicates = mapped.filter(
    (r, i) => !skip.includes(i) && duplicate(r, i),
  ).length;
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
            setRecords([]);
            setSkip([]);
            setDuplicatesReviewed(false);
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
                  onChange={(e) => {
                    setMapping({ ...mapping, [f]: e.target.value });
                    setDuplicatesReviewed(false);
                  }}
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
                  <th>Household</th>
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
                    <td>{r.household || `${r.name} household`}</td>
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
            {selectedDuplicates > 0 && (
              <div className="import-review-actions">
                <button
                  type="button"
                  className="button outline"
                  onClick={() =>
                    setSkip([
                      ...new Set([
                        ...skip,
                        ...mapped.flatMap((r, i) =>
                          duplicate(r, i) ? [i] : [],
                        ),
                      ]),
                    ])
                  }
                >
                  Exclude possible duplicates
                </button>
                <label>
                  <input
                    type="checkbox"
                    checked={duplicatesReviewed}
                    onChange={(e) => setDuplicatesReviewed(e.target.checked)}
                  />{" "}
                  I reviewed the {selectedDuplicates} possible duplicates and
                  want to include them.
                </label>
              </div>
            )}
            <button className="button outline" onClick={onClose}>
              Cancel
            </button>
            <button
              className="button primary"
              disabled={
                busy ||
                (selectedDuplicates > 0 && !duplicatesReviewed) ||
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
