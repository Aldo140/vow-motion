"use client";
import { type PanelProps } from "@/components/studio/shared";
import { Field, Modal } from "@/components/ui";
import {
  CheckIcon,
  PencilSimpleIcon,
  PlusIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { useState } from "react";

export const FAQ_STARTERS: { question: string; answer: string }[] = [
  {
    question: "Can I bring a guest?",
    answer:
      "Your invitation names everyone we have space for. If it lists a guest, we would love to meet them.",
  },
  {
    question: "What should I wear?",
    answer:
      "The dress code for each gathering is on your invitation. If in doubt, wear the thing you feel best in.",
  },
  {
    question: "Are children invited?",
    answer:
      "Children named on your invitation are very welcome, and there is a children's meal for them.",
  },
  {
    question: "What time should I arrive?",
    answer:
      "Please arrive fifteen minutes before the ceremony so everyone is seated in time.",
  },
  {
    question: "Is there parking?",
    answer: "There is parking at the venue, and cars can be left overnight.",
  },
  {
    question: "Can I take photographs?",
    answer:
      "Please keep phones away during the ceremony; afterwards, photograph everything.",
  },
];

export function GuestQuestions({ data, mutate, notify }: PanelProps) {
  const [draft, setDraft] = useState<{
      id?: string;
      question: string;
      question_es: string;
      answer: string;
      answer_es: string;
    } | null>(null),
    [busy, setBusy] = useState(false);
  const faqs = data.faqs ?? [];
  const save = async () => {
    if (!draft) return;
    setBusy(true);
    try {
      const { id, ...fields } = draft;
      await mutate(
        id ? `faqs/${id}` : "faqs",
        { ...fields, position: id ? undefined : faqs.length },
        id ? "PATCH" : "POST",
      );
      notify(id ? "Answer updated." : "Question added.");
      setDraft(null);
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="faq-studio">
      <div className="faq-studio-intro">
        <h2>Answer it once.</h2>
        <p className="muted-copy">
          Every question here is one your guests do not have to send you. They
          appear inside the invitation, in whichever language a guest is
          reading.
        </p>
      </div>

      {faqs.length > 0 && (
        <ul className="faq-studio-list">
          {faqs.map((faq) => (
            <li key={faq.id}>
              <div>
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </div>
              <div className="faq-studio-actions">
                <button
                  className="icon-button"
                  aria-label={`Edit: ${faq.question}`}
                  onClick={() =>
                    setDraft({
                      id: faq.id,
                      question: faq.question,
                      question_es: faq.question_es ?? "",
                      answer: faq.answer,
                      answer_es: faq.answer_es ?? "",
                    })
                  }
                >
                  <PencilSimpleIcon size={17} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`Remove: ${faq.question}`}
                  onClick={async () => {
                    await mutate(`faqs/${faq.id}`, undefined, "DELETE");
                    notify("Question removed.");
                  }}
                >
                  <TrashIcon size={17} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="faq-starters">
        <span>Add a question guests ask</span>
        <div>
          {FAQ_STARTERS.filter(
            (starter) => !faqs.some((faq) => faq.question === starter.question),
          ).map((starter) => (
            <button
              key={starter.question}
              className="faq-starter"
              onClick={() =>
                setDraft({
                  question: starter.question,
                  question_es: "",
                  answer: starter.answer,
                  answer_es: "",
                })
              }
            >
              {starter.question}
              <PlusIcon size={14} />
            </button>
          ))}
          <button
            className="faq-starter faq-starter-blank"
            onClick={() =>
              setDraft({
                question: "",
                question_es: "",
                answer: "",
                answer_es: "",
              })
            }
          >
            Write your own
            <PlusIcon size={14} />
          </button>
        </div>
      </div>

      {draft && (
        <Modal
          title={draft.id ? "Edit this answer" : "A question guests ask"}
          onClose={() => setDraft(null)}
          wide
        >
          <Field label="Question">
            <input
              value={draft.question}
              onChange={(e) => setDraft({ ...draft, question: e.target.value })}
            />
          </Field>
          <Field label="Answer">
            <textarea
              rows={4}
              value={draft.answer}
              onChange={(e) => setDraft({ ...draft, answer: e.target.value })}
            />
          </Field>
          <Field label="Question in Spanish" hint="Optional">
            <input
              value={draft.question_es}
              onChange={(e) =>
                setDraft({ ...draft, question_es: e.target.value })
              }
            />
          </Field>
          <Field label="Answer in Spanish" hint="Optional">
            <textarea
              rows={3}
              value={draft.answer_es}
              onChange={(e) =>
                setDraft({ ...draft, answer_es: e.target.value })
              }
            />
          </Field>
          <button
            className="button primary"
            disabled={busy || !draft.question.trim() || !draft.answer.trim()}
            onClick={save}
          >
            {busy ? "Saving…" : draft.id ? "Save answer" : "Add question"}
            <CheckIcon size={16} />
          </button>
        </Modal>
      )}
    </section>
  );
}
