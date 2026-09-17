"use client";
import { useEffect, useRef, useState } from "react";
import { Arrow, Brand, Field, Notice, Submit, api } from "./ui";
import { TimezoneField } from "./timezone-field";
import { formatDate, getWorld, worlds } from "@/lib/worlds";
import { trackMomentum } from "@/lib/momentum-telemetry-client";
import Link from "next/link";

export function WeddingBeginning() {
  const [step, setStep] = useState(0),
    [names, setNames] = useState(""),
    [date, setDate] = useState(""),
    [location, setLocation] = useState(""),
    [timezone, setTimezone] = useState("Europe/Rome"),
    [world, setWorld] = useState("riviera"),
    [weddingId, setWeddingId] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  const selected = getWorld(world);
  const titles = [
    "First, the two of you.",
    "A place. A day. Your people.",
    "Give your story a world.",
    "Look what you’ve already begun.",
  ];
  return (
    <main id="main" className="beginning-layout">
      <header>
        <Brand />
        <Link href="/studio">
          Return to your account <Arrow size={15} />
        </Link>
      </header>
      <div className="beginning-workspace">
        <section className="beginning-copy">
          <span className="eyebrow">
            A BEAUTIFUL BEGINNING · {Math.min(step + 1, 3)} OF 3
          </span>
          <nav aria-label="Your first essentials">
            {["The couple", "The day", "The world"].map((label, i) => (
              <button
                key={label}
                type="button"
                disabled={busy || step === 3 || i > step}
                aria-current={i === step ? "step" : undefined}
                onClick={() => setStep(i)}
              >
                <span>{i < step ? "✓" : i + 1}</span>
                {label}
              </button>
            ))}
          </nav>
          <h1 ref={heading} tabIndex={-1}>
            {titles[step]}
          </h1>
          <p>
            {
              [
                "The names on the paper are where it all starts.",
                `${names}, your invitation is already taking shape. Set the date and the place you’ll gather.`,
                "See your own names and date in each collection. You can change this later.",
                "Your names, day and world are saved. Your Studio has a real invitation to build on.",
              ][step]
            }
          </p>
          {error && <Notice error>{error}</Notice>}
          {step < 3 ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setError("");
                if (step < 2) {
                  trackMomentum("onboarding_step_completed", {
                    screen: "onboarding",
                    step: step === 0 ? "couple" : "day",
                  });
                  setStep(step + 1);
                  return;
                }
                setBusy(true);
                try {
                  const result = await api("/api/weddings", "POST", {
                    names: names.trim(),
                    date,
                    location: location.trim(),
                    timezone,
                    world,
                  });
                  setWeddingId(result.id);
                  trackMomentum("onboarding_step_completed", {
                    screen: "onboarding",
                    step: "world",
                  });
                  setStep(3);
                } catch (cause) {
                  setError((cause as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {step === 0 && (
                <Field label="Your names">
                  <input
                    name="names"
                    value={names}
                    onChange={(e) => setNames(e.target.value)}
                    placeholder="Elena & Matteo"
                    required
                    maxLength={150}
                  />
                </Field>
              )}
              {step === 1 && (
                <>
                  <Field label="Wedding date">
                    <input
                      name="date"
                      type="date"
                      value={date}
                      required
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </Field>
                  <Field label="Location">
                    <input
                      name="location"
                      value={location}
                      required
                      maxLength={200}
                      placeholder="Lake Como, Italy"
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </Field>
                  <TimezoneField
                    label="Wedding timezone"
                    location={location}
                    value={timezone}
                    onChange={setTimezone}
                  />
                </>
              )}
              {step === 2 && (
                <fieldset className="world-pick">
                  <legend>Choose your design world</legend>
                  {worlds.map((w) => (
                    <label
                      key={w.id}
                      className={world === w.id ? "selected" : ""}
                    >
                      <input
                        type="radio"
                        name="world"
                        value={w.id}
                        checked={world === w.id}
                        onChange={() => setWorld(w.id)}
                      />
                      <img src={w.image} alt="" />
                      <span>{w.name}</span>
                    </label>
                  ))}
                </fieldset>
              )}
              <div className="beginning-actions">
                {step > 0 && (
                  <button
                    className="button outline"
                    type="button"
                    disabled={busy}
                    onClick={() => setStep(step - 1)}
                  >
                    Back
                  </button>
                )}
                <Submit pending={busy}>
                  {step === 0
                    ? "Set the day"
                    : step === 1
                      ? "Explore your world"
                      : "Create your wedding"}
                  <Arrow />
                </Submit>
              </div>
              <p className="form-note">
                {step === 2
                  ? "Your wedding starts as a private draft. Review the details before sharing."
                  : "Your details stay here while you move between these steps."}
              </p>
            </form>
          ) : (
            <div className="beginning-reveal">
              <p className="eyebrow">THREE FOUNDATIONS, ALREADY YOURS</p>
              <ul>
                <li>Your names on the invitation</li>
                <li>
                  {formatDate(date)} · {location}
                </li>
                <li>The {selected.name} collection</li>
              </ul>
              <Link
                className="button primary"
                href={`/studio/setup?wid=${weddingId}`}
              >
                Review your invitation <Arrow />
              </Link>
              <p>
                Next, check the events and add your first household. The five
                setup reviews will help you decide when to publish.
              </p>
            </div>
          )}
        </section>
        <aside
          className={`beginning-preview identity-suite world-${world}`}
          aria-label="Your invitation taking shape"
        >
          <img src={selected.image} alt="" />
          <div className="beginning-paper" aria-live="polite">
            <span>THE CELEBRATION OF</span>
            <h2>{names.trim() || "Your names, here."}</h2>
            <p>
              {date ? formatDate(date) : "A day to look forward to"}
              <br />
              {location || "Somewhere you love"}
            </p>
            <span>{selected.name.toUpperCase()} COLLECTION</span>
          </div>
          <p className="beginning-caption">
            {step === 3
              ? "A beginning worth keeping."
              : "Made from the details you give us."}
          </p>
        </aside>
      </div>
    </main>
  );
}
