"use client";
import {
  PageHeading,
  PreviewButton,
  type PanelProps,
} from "@/components/studio/shared";
import { planningActions, setupSteps } from "@/lib/pilot";
import Link from "next/link";
import type { Wedding } from "@/lib/types";
import { useDraft } from "./studio/use-draft";
import { LiveInvitation } from "./studio/live-invitation";
import { setupEncouragement } from "@/lib/setup-assist";
import { useCallback, useRef, useState } from "react";
import { EventsManager, GuestManager } from "./studio-guests";
import { ExperienceManager, SettingsManager } from "./studio-tools";
import { Field, Modal, Notice, Submit } from "./ui";

export function SetupManager(props: PanelProps) {
  const steps = setupSteps(props.data);
  const journey = useDraft(
    props.data.user.email + ":" + props.data.wedding.id + ":chapter",
    {
      index: Math.max(
        0,
        steps.findIndex((s) => !s.done),
      ),
    },
  );
  const index = Math.max(0, Math.min(4, journey.value.index));
  const setIndex = (index: number) => journey.update({ index });
  const [preview, setPreview] = useState<Partial<Wedding>>({});
  const updatePreview = useCallback(
    (value: Partial<Wedding>) =>
      setPreview((previous) => ({ ...previous, ...value })),
    [],
  );
  const [busy, setBusy] = useState(false);
  const [milestone, setMilestone] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const step = steps[index];
  const completed = steps.filter((s) => s.done).length;
  const complete = async () => {
    await props.mutate("setup", { step: step.id, done: true }, "PATCH");
    if (!step.done) setMilestone(setupEncouragement[index].reward);
    setIndex(Math.min(4, index + 1));
    requestAnimationFrame(() => heading.current?.focus());
  };
  const reviewed = steps.every((s) => s.done);
  return (
    <>
      <section className="pilot-panel" aria-label="Wedding setup">
        <span className="eyebrow">YOUR CELEBRATION, TAKING SHAPE</span>
        <h2 ref={heading} tabIndex={-1}>
          {reviewed
            ? "Ready for your people."
            : setupEncouragement[index].title}
        </h2>
        <p>{setupEncouragement[index].hint}</p>
        <progress
          className="setup-progress"
          aria-label="Wedding setup progress"
          max={steps.length}
          value={completed}
        />
        <p>
          Your completed steps stay saved. Return whenever it suits you.{" "}
          {steps.filter((s) => s.done).length} of {steps.length} reviewed.
        </p>
        <a className="text-link" href="#setup-live-preview">
          See live invitation preview
        </a>
        <nav className="setup-steps" aria-label="Setup steps">
          {steps.map((s, i) => (
            <button
              key={s.id}
              className="button outline small"
              aria-current={i === index ? "step" : undefined}
              onClick={() => setIndex(i)}
            >
              {s.done ? "✓" : i + 1} {s.title}
            </button>
          ))}
        </nav>
      </section>
      {milestone && (
        <div className="setup-reward" role="status">
          <span aria-hidden="true">✧</span>
          <div>
            <b>A little closer.</b>
            <p>{milestone}</p>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Dismiss milestone"
            onClick={() => setMilestone("")}
          >
            ×
          </button>
        </div>
      )}
      <div className="setup-workbench">
        <div key={step.id}>
          {index === 0 && (
            <ExperienceManager
              {...props}
              onSaved={complete}
              onPreviewChange={updatePreview}
            />
          )}
          {index === 1 && (
            <SettingsManager
              {...props}
              onSaved={complete}
              onPreviewChange={updatePreview}
            />
          )}
          {index === 2 && <EventsManager {...props} />}
          {index === 3 && <GuestManager {...props} />}
          {index === 4 && (
            <section className="pilot-panel">
              <h1>See it through their eyes.</h1>
              <p>
                Open a household’s preview and check their events, RSVP
                questions, travel information and wedding pass. Preview links
                expire after an hour and cannot change guest information.
              </p>
              <PreviewButton {...props} />
            </section>
          )}
        </div>
        <div id="setup-live-preview">
          <LiveInvitation
            wedding={{ ...props.data.wedding, ...preview }}
            events={props.data.events}
          />
        </div>
      </div>
      <section className="pilot-panel setup-completion">
        {index >= 2 && (
          <button
            className="button primary"
            disabled={
              busy ||
              props.data.role === "viewer" ||
              (index === 2 && !props.data.events.length) ||
              (index >= 3 && !props.data.guests.length)
            }
            onClick={async () => {
              setBusy(true);
              try {
                await complete();
              } catch (e) {
                props.notify((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Mark reviewed{index < 4 ? " and continue" : ""}
          </button>
        )}
        <p>
          {reviewed
            ? "Your setup review is complete."
            : "Finish the five review steps before publishing here."}
        </p>
        {props.data.wedding.status === "draft" ? (
          <button
            className="button outline"
            disabled={
              !reviewed ||
              busy ||
              !["owner", "partner"].includes(props.data.role)
            }
            onClick={async () => {
              setBusy(true);
              try {
                await props.mutate("publish", {});
                props.notify("Your wedding is published.");
              } catch (e) {
                props.notify((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Publish wedding
          </button>
        ) : (
          <p>Wedding status: {props.data.wedding.status}.</p>
        )}
        {!["owner", "partner"].includes(props.data.role) && (
          <p>The couple completes the final publishing step.</p>
        )}
      </section>
    </>
  );
}

export function ActionList(props: PanelProps) {
  const { data } = props;
  const actions = planningActions(data);
  const link = (section: string) => `/studio/${section}?wid=${data.wedding.id}`;
  return (
    <section className="pilot-panel" aria-label="Your action list">
      <div className="panel-title">
        <h2>Your next actions</h2>
        <Link href={link("setup")}>Continue wedding setup →</Link>
      </div>
      <details>
        <summary>{actions.awaiting.length} households awaiting replies</summary>
        <ul>
          {actions.awaiting.map((h) => (
            <li key={h.id}>{h.name}</li>
          ))}
        </ul>
        <Link href={link("messages")}>Prepare a reminder</Link>
      </details>
      <details>
        <summary>{actions.meals.length} event replies missing a meal</summary>
        <ul>
          {actions.meals.map((r) => (
            <li key={r.guest_id + r.event_id}>
              {data.guests.find((g) => g.id === r.guest_id)?.name} ·{" "}
              {data.events.find((e) => e.id === r.event_id)?.title}
            </li>
          ))}
        </ul>
        <Link href={link("rsvps")}>Review RSVP details</Link>
      </details>
      <details>
        <summary>
          {actions.missingTravel.length} households missing required travel
          answers
        </summary>
        <p>
          Based on required travel, hotel, arrival or transport questions in
          your RSVP.
        </p>
        <ul>
          {actions.missingTravel.map((id) => (
            <li key={id}>{data.households.find((h) => h.id === id)?.name}</li>
          ))}
        </ul>
        <Link href={link("rsvps")}>Review travel questions</Link>
      </details>
      <details>
        <summary>
          {actions.unanswered.length} guest questions awaiting an answer
        </summary>
        <Link href={link("requests")}>Open guest questions</Link>
      </details>
    </section>
  );
}

export function FeedbackButton(props: PanelProps & { section: string }) {
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <>
      <button
        className="button outline small"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
      >
        Pilot feedback
      </button>
      {open && (
        <Modal
          title="Help shape the planner experience"
          onClose={() => setOpen(false)}
        >
          <p>
            This note is saved with this wedding for your collaborators to
            review. It is not emailed automatically.
          </p>
          <p>Screen: {props.section || "Overview"}</p>
          {error && <Notice error>{error}</Notice>}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const body = String(new FormData(e.currentTarget).get("body"));
              setBusy(true);
              try {
                await props.mutate("feedback", {
                  screen:
                    "/studio" + (props.section ? "/" + props.section : ""),
                  body,
                });
                setOpen(false);
                props.notify("Feedback saved to this wedding.");
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <Field label="What happened, or what would help?">
              <textarea
                name="body"
                minLength={5}
                maxLength={4000}
                required
                rows={5}
              />
            </Field>
            <Submit pending={busy}>Save feedback</Submit>
          </form>
        </Modal>
      )}
    </>
  );
}

export function FeedbackManager(props: PanelProps) {
  const [busy, setBusy] = useState<string | null>(null);
  return (
    <>
      <PageHeading
        title="A better workflow, together."
        description="Notes and progress from this wedding’s pilot."
      >
        <FeedbackButton {...props} section="feedback" />
      </PageHeading>
      {!props.data.feedback?.length && (
        <Notice>No feedback yet. Leave a note from any Studio screen.</Notice>
      )}
      {props.data.feedback?.map((f) => (
        <article className="pilot-panel" key={f.id}>
          <Link href={`${f.screen}?wid=${props.data.wedding.id}`}>
            {f.screen}
          </Link>
          <p className="preserve-lines">{f.body}</p>
          <Field label="Progress">
            <select
              value={f.status}
              disabled={busy === f.id || props.data.role === "viewer"}
              onChange={async (e) => {
                setBusy(f.id);
                try {
                  await props.mutate(
                    "feedback/" + f.id,
                    { status: e.target.value },
                    "PATCH",
                  );
                } catch (e) {
                  props.notify((e as Error).message);
                } finally {
                  setBusy(null);
                }
              }}
            >
              <option value="open">Open</option>
              <option value="in-progress">In progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </Field>
        </article>
      ))}
    </>
  );
}

export function RequestsManager(props: PanelProps) {
  const [busy, setBusy] = useState<string | null>(null);
  return (
    <>
      <PageHeading
        title="A question, answered."
        description="Private questions from each household. Answers appear in their invitation."
      />
      {!props.data.guestRequests?.length && (
        <Notice>No guest questions yet.</Notice>
      )}
      {props.data.guestRequests?.map((q) => (
        <article className="pilot-panel" key={q.id}>
          <h2>
            {props.data.households.find((h) => h.id === q.household_id)?.name}
          </h2>
          <p className="preserve-lines">{q.question}</p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const answer = String(
                new FormData(e.currentTarget).get("answer"),
              );
              setBusy(q.id);
              try {
                await props.mutate("requests/" + q.id, { answer }, "PATCH");
                props.notify("Answer saved in the household’s invitation.");
              } catch (e) {
                props.notify((e as Error).message);
              } finally {
                setBusy(null);
              }
            }}
          >
            <Field label="Your answer">
              <textarea
                name="answer"
                defaultValue={q.answer}
                required
                maxLength={4000}
                rows={3}
                disabled={props.data.role === "viewer"}
              />
            </Field>
            <Submit
              pending={busy === q.id}
              disabled={props.data.role === "viewer"}
            >
              Save answer
            </Submit>
          </form>
        </article>
      ))}
    </>
  );
}
