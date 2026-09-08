"use client";
import Link from "next/link";
import { useHydrated } from "./use-hydrated";
import {
  useEffect,
  useRef,
  useState,
  useId,
  Children,
  isValidElement,
  cloneElement,
  type ReactElement,
  type ReactNode,
  type MouseEventHandler,
} from "react";
import {
  ArrowUpRightIcon,
  ArrowRightIcon,
  XIcon,
  CircleNotchIcon,
} from "@phosphor-icons/react";
export function Arrow({
  diagonal = false,
  size = 18,
}: {
  diagonal?: boolean;
  size?: number;
}) {
  return diagonal ? (
    <ArrowUpRightIcon size={size} />
  ) : (
    <ArrowRightIcon size={size} />
  );
}
export function Brand({
  light = false,
  onClick,
}: {
  light?: boolean;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <Link
      href="/"
      className={"brand " + (light ? "light" : "")}
      aria-label="Vow Motion home"
      onClick={onClick}
    >
      VOW<span>MOTION</span>
      <i>®</i>
    </Link>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
  className = "",
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    titleId = useId();
  useEffect(() => {
    const d = ref.current;
    const trigger = document.activeElement as HTMLElement | null;
    const { scrollX, scrollY } = window;
    const style = document.body.style;
    const previous = {
      position: style.position,
      top: style.top,
      left: style.left,
      width: style.width,
      overflow: style.overflow,
    };
    Object.assign(style, {
      position: "fixed",
      top: `-${scrollY}px`,
      left: `-${scrollX}px`,
      width: "100%",
      overflow: "hidden",
    });
    d?.showModal();
    return () => {
      d?.close();
      Object.assign(style, previous);
      window.scrollTo({ top: scrollY, left: scrollX, behavior: "instant" });
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      aria-labelledby={titleId}
      ref={ref}
      className={(wide ? "modal wide " : "modal ") + className}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-heading">
        <h2 id={titleId}>{title}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <XIcon size={22} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Submit({
  children,
  pending = false,
  disabled = false,
}: {
  children: ReactNode;
  pending?: boolean;
  disabled?: boolean;
}) {
  const ready = useHydrated();
  return (
    <button
      className="button primary"
      type="submit"
      disabled={!ready || pending || disabled}
    >
      {pending ? (
        <>
          <CircleNotchIcon className="spin" size={18} /> Saving…
        </>
      ) : (
        children
      )}
    </button>
  );
}
export function Notice({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <div
      className={"notice " + (error ? "error" : "")}
      role={error ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  const fieldId = useId();
  return (
    <div className="field">
      <label htmlFor={fieldId}>{label}</label>
      {Children.map(children, (child) =>
        isValidElement(child) &&
        ["input", "select", "textarea"].includes(String(child.type))
          ? cloneElement(
              child as ReactElement<{
                id: string;
                "aria-describedby"?: string;
              }>,
              {
                id: fieldId,
                "aria-describedby": hint ? fieldId + "-hint" : undefined,
              },
            )
          : child,
      )}
      {hint && <small id={fieldId + "-hint"}>{hint}</small>}
    </div>
  );
}
export function DemoButton({
  children = "Explore the Studio",
  className = "button primary",
}: {
  children?: ReactNode;
  className?: string;
}) {
  const ready = useHydrated();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <>
      <button
        className={className}
        disabled={!ready || busy}
        onClick={async () => {
          setBusy(true);
          try {
            const r = await fetch("/api/demo", { method: "POST" });
            const data = await r.json();
            if (!r.ok) throw Error(data.error);
            window.location.href = "/studio";
          } catch (e) {
            setError((e as Error).message);
            setBusy(false);
          }
        }}
      >
        {busy ? "Preparing your Studio…" : children}
        <Arrow />
      </button>
      {error && <Notice error>{error}</Notice>}
    </>
  );
}
export async function api(url: string, method = "GET", body?: unknown) {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Please try again.");
  return data;
}
