"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  momentumHref,
  weddingMomentum,
  type MomentumAction,
} from "@/lib/momentum";
import { trackMomentum } from "@/lib/momentum-telemetry-client";
import { SCREEN_IDS } from "@/lib/momentum-telemetry";
import type { StudioData } from "@/lib/types";
import { Arrow } from "../ui";
import { MomentumFeedback } from "./momentum-feedback";

export function MomentumLink({
  data,
  action,
  primary = false,
}: {
  data: StudioData;
  action: MomentumAction;
  primary?: boolean;
}) {
  return (
    <Link
      className={primary ? "button primary" : "text-link"}
      href={momentumHref(data.wedding.id, action.destination)}
      onClick={() => {
        trackMomentum("recommended_action_selected", {
          action: action.id,
          chapter: action.chapter,
        });
        try {
          sessionStorage.setItem(
            `vow-momentum-action:${data.wedding.id}`,
            action.id,
          );
        } catch {}
      }}
    >
      {data.role === "viewer" ? "View details" : action.cta}
      <Arrow size={17} />
    </Link>
  );
}

export function JourneyNavigation({
  data,
  section = "",
}: {
  data: StudioData;
  section?: string;
}) {
  const model = weddingMomentum(data);
  return (
    // On a phone, the full ledger belongs on the overview; every other page
    // keeps a one-line meter so the work itself starts above the fold.
    <div
      className={
        "journey-navigation" + (section ? " journey-navigation-compact" : "")
      }
    >
      <Link className="journey-current" href={`/studio?wid=${data.wedding.id}`}>
        <span className="eyebrow">YOUR WEDDING JOURNEY</span>
        <strong>
          {model.currentChapter.number.toString().padStart(2, "0")} /{" "}
          {model.currentChapter.title}
        </strong>
        <span className="journey-meter" aria-hidden="true">
          {model.chapters.map((c) => (
            <i
              key={c.id}
              className={
                c.complete
                  ? "done"
                  : c.id === model.currentChapter.id
                    ? "now"
                    : undefined
              }
            />
          ))}
        </span>
      </Link>
      <nav aria-label="Wedding chapters">
        {model.chapters.map((c) => (
          <Link
            key={c.id}
            href={momentumHref(data.wedding.id, c.destination)}
            aria-current={c.id === model.currentChapter.id ? "step" : undefined}
            title={`${c.title}: ${c.summary}`}
          >
            <span aria-hidden="true">
              {c.complete ? "✓" : c.number.toString().padStart(2, "0")}
            </span>
            <span>{c.shortTitle}</span>
            <span className="sr-only">{c.complete ? ", complete" : ""}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

/** Compare confirmed server snapshots, not optimistic clicks. First load never
 * celebrates demo fixtures or work completed in another session. */
export function MomentumObserver({
  data,
  section,
}: {
  data: StudioData;
  section: string;
}) {
  const previous = useRef<ReturnType<typeof weddingMomentum> | null>(null);
  const [milestone, setMilestone] = useState<{
    title: string;
    detail: string;
  } | null>(null);
  const screen =
    SCREEN_IDS.find((s) => s === (section || "overview")) || "overview";
  useEffect(() => {
    const key = `vow-momentum-session:${data.wedding.id}`;
    let session = {
      started: Date.now(),
      navigation: 0,
      screen: "",
      productive: false,
      household: data.households.length > 0,
      invitation: data.invitationDispatches.some((d) =>
        ["sent", "delivered", "development"].includes(d.status),
      ),
    };
    try {
      const saved = sessionStorage.getItem(key);
      if (saved) session = JSON.parse(saved);
    } catch {}
    const model = weddingMomentum(data);
    if (!session.screen) trackMomentum("studio_opened");
    if (session.screen !== screen) {
      session.navigation += session.screen ? 1 : 0;
      session.screen = screen;
      trackMomentum("screen_viewed", { screen });
    }
    const elapsed_ms = Math.min(
      43200000,
      Math.max(0, Date.now() - session.started),
    );
    const before = previous.current;
    if (before) {
      const added = data.guests.length - before.health.guestCount;
      const householdsAdded =
        model.health.households.length - before.health.households.length;
      const improved =
        added > 0 ||
        model.health.missingEmail.length < before.health.missingEmail.length ||
        model.health.unseated.length < before.health.unseated.length ||
        model.chapters.some(
          (c) =>
            c.completed >
            (before.chapters.find((b) => b.id === c.id)?.completed || 0),
        );
      const newlyComplete = model.actions.filter(
        (a) =>
          a.complete &&
          before.actions.some((b) => b.id === a.id && !b.complete),
      );
      for (const action of newlyComplete) {
        trackMomentum("recommended_action_completed", {
          action: action.id,
          chapter: action.chapter,
          screen,
          elapsed_ms,
          navigation_count: session.navigation,
        });
        if (["missing-meals", "missing-answers"].includes(action.id))
          trackMomentum("rsvp_blocker_resolved", { action: action.id, screen });
      }
      const chapter = model.chapters.find(
        (c) =>
          c.complete &&
          before.chapters.some((b) => b.id === c.id && !b.complete),
      );
      if (chapter) {
        setMilestone({
          title: `${chapter.title}, complete.`,
          detail: chapter.summary,
        });
        trackMomentum("chapter_completed", { chapter: chapter.id, screen });
      } else if (newlyComplete.length) {
        const action = newlyComplete[0];
        setMilestone({
          title: "That part is taken care of.",
          detail: action.consequence,
        });
      }
      if (added > 0)
        setMilestone({
          title: `${added} ${added === 1 ? "guest added" : "guests added"}.`,
          detail: `${householdsAdded > 0 ? `${householdsAdded} ${householdsAdded === 1 ? "household created" : "households created"}. ` : "Added to your existing households. "}${model.health.ready.length} households are ready for an invitation email. ${model.health.missingEmail.length} still need an email.`,
        });
      if ((newlyComplete.length || improved) && !session.productive) {
        session.productive = true;
        trackMomentum("first_productive_action", {
          screen,
          elapsed_ms,
          navigation_count: session.navigation,
        });
      }
      if (!session.household && data.households.length) {
        session.household = true;
        trackMomentum("first_household", { screen, elapsed_ms });
      }
      if (!session.invitation && model.health.sent.size) {
        session.invitation = true;
        trackMomentum("first_invitation", { screen, elapsed_ms });
      }
    }
    if (
      screen === "overview" &&
      model.primaryAction?.id !== before?.primaryAction?.id &&
      model.primaryAction
    )
      trackMomentum("recommended_action_shown", {
        screen,
        action: model.primaryAction.id,
        chapter: model.primaryAction.chapter,
        count: model.primaryAction.affectedCount,
      });
    previous.current = model;
    try {
      sessionStorage.setItem(key, JSON.stringify(session));
    } catch {}
  }, [data, screen]);
  useEffect(() => {
    const leave = () => {
      try {
        const selected = sessionStorage.getItem(
          `vow-momentum-action:${data.wedding.id}`,
        );
        const action = previous.current?.actions.find((a) => a.id === selected);
        if (action && !action.complete) {
          trackMomentum("workflow_abandoned", {
            screen,
            action: action.id,
            chapter: action.chapter,
          });
          sessionStorage.removeItem(`vow-momentum-action:${data.wedding.id}`);
        }
      } catch {}
    };
    window.addEventListener("pagehide", leave);
    return () => window.removeEventListener("pagehide", leave);
  }, [data.wedding.id, screen]);
  return milestone ? (
    <MomentumFeedback
      {...milestone}
      level="chapter"
      botanical={data.wedding.settings.botanical === "cherry-blossom"}
      onDismiss={() => setMilestone(null)}
    />
  ) : null;
}
