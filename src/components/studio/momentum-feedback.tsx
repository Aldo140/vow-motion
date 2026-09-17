"use client";
import Link from "next/link";
import { Arrow } from "../ui";
import { CherryBlossomMark } from "../guest-botanical";
export function MomentumFeedback({
  title,
  detail,
  href,
  cta,
  level = "productive",
  botanical = false,
  onDismiss,
}: {
  title: string;
  detail: string;
  href?: string;
  cta?: string;
  level?: "productive" | "chapter" | "milestone";
  botanical?: boolean;
  onDismiss?: () => void;
}) {
  return (
    <section className={`momentum-feedback ${level}`} aria-label="What changed">
      {botanical ? (
        <CherryBlossomMark />
      ) : (
        <span className="momentum-seal" aria-hidden="true">
          ✓
        </span>
      )}
      <div>
        <div role="status">
          <span className="eyebrow">A LITTLE CLOSER</span>
          <h2>{title}</h2>
          <p>{detail}</p>
        </div>
        {href && cta && (
          <Link className="text-link" href={href}>
            {cta}
            <Arrow size={16} />
          </Link>
        )}
      </div>
      {onDismiss && (
        <button
          className="icon-button"
          onClick={onDismiss}
          aria-label="Dismiss progress update"
        >
          ×
        </button>
      )}
    </section>
  );
}
