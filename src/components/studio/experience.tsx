"use client";
import IdentityEditor from "@/components/identity-editor";
import {
  PageHeading,
  PreviewButton,
  type PanelProps,
} from "@/components/studio/shared";
import { Field } from "@/components/ui";
import type { Opening, World } from "@/lib/types";
import { getWorld, worlds } from "@/lib/worlds";
import { CheckIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { GuestQuestions } from "./guest-questions";
export const OPENINGS: {
  id: Opening;
  name: string;
  description: string;
  detail: string;
  preview: React.ReactNode;
}[] = [
  {
    id: "envelope",
    name: "The suite",
    description:
      "A photograph, a card and a lined envelope laid out together. The guest presses a seal to open it.",
    detail: "Unfolds across the page · best on a large screen",
    preview: (
      <span className="preview-suite">
        <i className="preview-photo" />
        <i className="preview-card" />
        <i className="preview-seal" />
      </span>
    ),
  },
  {
    id: "seal",
    name: "The sealed envelope",
    description:
      "One printed envelope, held closed by a wax seal. The guest breaks the seal and the card rises out.",
    detail: "Reads as one object · best in a hand",
    preview: (
      <span className="preview-sealed">
        <i className="preview-flap" />
        <i className="preview-wax" />
      </span>
    ),
  },
];

export function ExperienceManager(props: PanelProps) {
  const { data, mutate, notify } = props;
  const [selected, setSelected] = useState<World>(data.wedding.world),
    [opening, setOpening] = useState<Opening>(
      data.wedding.opening === "seal" ? "seal" : "envelope",
    ),
    [story, setStory] = useState(data.wedding.story),
    [busy, setBusy] = useState(false);
  return (
    <>
      <PageHeading
        title="A world that feels like you."
        description="Considered choices. A complete identity. Your own point of view."
      >
        <PreviewButton {...props} />
        <button
          className="button primary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await mutate(
                "settings",
                { ...data.wedding, world: selected, opening, story },
                "PATCH",
              );
              notify("Your wedding identity is saved.");
            } catch (e) {
              notify((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Saving…" : "Save your experience"}
          <CheckIcon size={17} />
        </button>
      </PageHeading>
      <div className="world-choice-grid">
        {worlds.map((w) => (
          <button
            className={
              "world-choice world-" +
              w.id +
              " " +
              (selected === w.id ? "selected" : "")
            }
            key={w.id}
            onClick={() => setSelected(w.id)}
            aria-pressed={selected === w.id}
          >
            <div>
              <img src={w.image} alt={w.name + " scene direction"} />
              <h2>{w.name}</h2>
              {selected === w.id && (
                <span className="world-check">
                  <CheckIcon size={18} />
                </span>
              )}
            </div>
            <h3>{w.name}</h3>
            <p>{w.description}</p>
            <span className="swatches">
              {w.palette.map((c) => (
                <i style={{ background: c }} key={c} />
              ))}
            </span>
          </button>
        ))}
      </div>
      <section className="opening-choice">
        <div className="opening-choice-intro">
          <h2>How your invitation arrives.</h2>
          <p className="muted-copy">
            The first thing a guest sees. Both open into the same invitation, so
            you can change your mind whenever you like.
          </p>
        </div>
        <div className="opening-choice-grid">
          {OPENINGS.map((choice) => (
            <button
              key={choice.id}
              className={
                "opening-option " + (opening === choice.id ? "selected" : "")
              }
              onClick={() => setOpening(choice.id)}
              aria-pressed={opening === choice.id}
            >
              <span className="opening-preview" aria-hidden="true">
                {choice.preview}
              </span>
              <h3>
                {choice.name}
                {opening === choice.id && (
                  <span className="opening-check">
                    <CheckIcon size={15} />
                  </span>
                )}
              </h3>
              <p>{choice.description}</p>
              <small>{choice.detail}</small>
            </button>
          ))}
        </div>
      </section>
      <section className="content-editor">
        <div>
          <h2>Your story, in your words.</h2>
          <p className="muted-copy">
            This becomes part of your invitation experience. Write the way you
            would speak to your favourite people.
          </p>
        </div>
        <Field label="Your story">
          <textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            rows={6}
          />
        </Field>
      </section>
      <IdentityEditor {...props} />
      <GuestQuestions {...props} />
      <div className="identity-summary">
        <span>YOUR IDENTITY</span>
        <h3>{getWorld(selected).name}</h3>
        <p>Invitation · Website · RSVP · Wedding pass · Memories</p>
        <div className="swatches">
          {getWorld(selected).palette.map((c) => (
            <span style={{ background: c }} key={c} />
          ))}
        </div>
      </div>
    </>
  );
}
