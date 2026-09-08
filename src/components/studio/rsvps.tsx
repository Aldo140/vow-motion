"use client";
import { PageHeading, type PanelProps } from "@/components/studio/shared";
import { Arrow, Field, Modal, Notice, Submit } from "@/components/ui";
import { formatDate } from "@/lib/worlds";
import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useState } from "react";

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
