"use client";
import { PageHeading, type PanelProps } from "@/components/studio/shared";
import { Arrow, Field, Modal, Notice, Submit } from "@/components/ui";
import { formatDate } from "@/lib/worlds";
import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useState } from "react";
import {
  weddingHealth,
  matchesGuestFilter,
  momentumHref,
} from "@/lib/momentum";
import { useWorkFilter } from "./use-work-filter";
import Link from "next/link";
import { GuestEditor } from "./guest-editor";
import type { Guest } from "@/lib/types";

export function RsvpManager({ data, mutate, notify }: PanelProps) {
  const health = weddingHealth(data);
  const [filter, setFilter] = useWorkFilter([
    "all",
    "awaiting",
    "missing-meal",
    "missing-answers",
  ]);
  const [edit, setEdit] = useState<Guest | null>(null);
  const visible = data.guests.filter((g) =>
    matchesGuestFilter(g, filter, health),
  );
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
      <section className="work-health" aria-label="Reply priorities">
        <span className="eyebrow">
          {health.invited.size
            ? "HEARING FROM YOUR PEOPLE"
            : "BEFORE THE FIRST REPLY"}
        </span>
        <h2>
          {health.invited.size
            ? `${data.guests.filter((g) => g.status !== "pending").length} of ${data.guests.length} guests have replied.`
            : "Shape the questions, then open the invitation."}
        </h2>
        <p>
          {health.attending.length} attending ·{" "}
          {data.guests.filter((g) => g.status === "declined").length} declined ·{" "}
          {health.awaiting.length} invited guests awaiting a reply
        </p>
        {health.awaiting.length > 0 && (
          <Link
            className="button outline"
            href={momentumHref(data.wedding.id, {
              section: "messages",
              intent: "rsvp-reminder",
            })}
          >
            Prepare a reminder for {health.awaiting.length} awaiting guests{" "}
            <Arrow />
          </Link>
        )}
        <div className="work-health-actions">
          {[
            ["all", "All responses"],
            ["awaiting", `${health.awaiting.length} awaiting replies`],
            ["missing-meal", `${health.missingMeals.length} missing meals`],
            [
              "missing-answers",
              `${health.missingAnswers.length} missing required answers`,
            ],
          ].map(([value, label]) => (
            <button
              key={value}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>
      <div className="rsvp-management">
        <section>
          <h2>The replies</h2>
          {!visible.length && (
            <p role="status">
              {filter === "all"
                ? "Replies will appear here after you add your guests."
                : "No guests need attention in this view."}
            </p>
          )}
          {visible.map((g) => (
            <div className="response-row" key={g.id}>
              <div>
                <b>{g.name}</b>
                <small>
                  {g.meal || "No meal selected"}
                  {g.dietary ? " · " + g.dietary : ""}
                </small>
                {filter === "missing-answers" && (
                  <div className="response-details">
                    {data.questions
                      .filter(
                        (q) =>
                          q.required &&
                          (q.condition !== "attending" ||
                            g.status === "attending") &&
                          !data.responses?.some(
                            (r) =>
                              (q.scope === "household"
                                ? data.guests.some(
                                    (member) =>
                                      member.id === r.guest_id &&
                                      member.household_id === g.household_id,
                                  )
                                : r.guest_id === g.id) &&
                              String(r.answers[q.id] ?? "").trim(),
                          ),
                      )
                      .map((q) => (
                        <p key={q.id}>Needs: {q.label}</p>
                      ))}
                    <p>
                      Ask the guest to update these answers through their
                      private invitation.
                    </p>
                    <Link
                      className="text-link"
                      href={`/studio/invitations?wid=${data.wedding.id}&household=${g.household_id}`}
                    >
                      Open this household invitation
                    </Link>
                  </div>
                )}
                {filter === "missing-meal" && (
                  <Link
                    className="text-link"
                    href={`/studio/invitations?wid=${data.wedding.id}&household=${g.household_id}`}
                  >
                    Share their invitation to complete meal choices
                  </Link>
                )}
                <button
                  className="text-link"
                  disabled={data.role === "viewer"}
                  onClick={() => setEdit(g)}
                >
                  Review guest details
                </button>
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
      {edit && (
        <GuestEditor
          key={edit.id}
          guest={edit}
          data={data}
          mutate={mutate}
          notify={notify}
          onClose={() => setEdit(null)}
        />
      )}
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
