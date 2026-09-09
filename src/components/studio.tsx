"use client";
import { formatDate, worlds } from "@/lib/worlds";
import {
  CheckIcon,
  ListIcon,
  PlusIcon,
  SignOutIcon,
  WarningCircleIcon,
  XIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FeedbackButton } from "./studio-pilot";
import { navigation } from "./studio/navigation";
import { PreviewButton, type PanelProps } from "./studio/shared";
import { useStudioData } from "./studio/use-studio-data";
import { api, Arrow, Brand, Field, Modal, Notice, Submit } from "./ui";

export default function Studio({
  section = "",
  initialId,
}: {
  section?: string;
  initialId: string;
}) {
  const [weddingId, setWeddingId] = useState(initialId),
    [toast, setToastState] = useState<{
      text: string;
      tone: "success" | "error";
    }>({ text: "", tone: "success" }),
    [mobile, setMobile] = useState(false),
    [create, setCreate] = useState(false),
    [smallScreen, setSmallScreen] = useState(false);
  const sidebar = useRef<HTMLElement>(null);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const sync = () => setSmallScreen(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    if (!mobile || !smallScreen) return;
    const trigger = document.activeElement as HTMLElement | null;
    const nav = sidebar.current;
    nav?.querySelector<HTMLElement>("button")?.focus();
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setMobile(false);
      }
      if (e.key === "Tab") {
        const items = Array.from(
          nav?.querySelectorAll<HTMLElement>(
            "a[href],button:not([disabled]),select",
          ) || [],
        ).filter((el) => el.getClientRects().length);
        const first = items[0],
          last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("keydown", handle);
      trigger?.focus();
    };
  }, [mobile, smallScreen]);
  const { data, error, refresh, mutate } = useStudioData(weddingId);
  const setToast = (text: string, tone: "success" | "error" = "success") =>
    setToastState({ text, tone });
  const dismissToast = () => setToastState({ text: "", tone: "success" });
  useEffect(() => {
    if (!toast.text) return;
    // A problem should stay on screen long enough to be read and acted on.
    const t = setTimeout(
      () => setToastState({ text: "", tone: "success" }),
      toast.tone === "error" ? 9000 : 4500,
    );
    return () => clearTimeout(t);
  }, [toast]);
  if (!data)
    return (
      <main id="main" className="loading-studio">
        <Brand />
        {error ? (
          <Notice error>
            {error}
            <a href="/login"> Sign in</a>
          </Notice>
        ) : (
          <>
            <div className="skeleton" />
            <h1>Opening your Studio.</h1>
            <p>A place for all your people.</p>
          </>
        )}
      </main>
    );
  const props: PanelProps = { data, refresh, mutate, notify: setToast };
  const current = navigation.find((n) => n[1] === section)?.[0] || "Overview";
  const Panel = navigation.find((n) => n[1] === section)?.[3];
  return (
    <div className="studio-shell">
      <aside
        ref={sidebar}
        inert={smallScreen && !mobile}
        className={"studio-sidebar " + (mobile ? "mobile-open" : "")}
      >
        <div className="sidebar-brand">
          <Brand />
          <button
            className="icon-button mobile-toggle"
            aria-label="Close navigation"
            onClick={() => setMobile(false)}
          >
            <XIcon size={22} />
          </button>
        </div>
        <div className="wedding-selector">
          <label htmlFor="wedding-select">YOUR WEDDING STUDIO</label>
          <select
            id="wedding-select"
            value={weddingId}
            onChange={(e) => {
              setWeddingId(e.target.value);
              document.cookie = `vow_wedding=${e.target.value}; path=/; SameSite=Lax`;
              window.location.href = "/studio?wid=" + e.target.value;
            }}
          >
            {data.weddings.map((w) => (
              <option key={w.id} value={w.id}>
                {w.names}
              </option>
            ))}
          </select>
          <span>{formatDate(data.wedding.date)}</span>
        </div>
        <nav aria-label="Studio navigation">
          {navigation.map(([name, path, Icon], index) => (
            <Link
              key={path}
              onClick={() => setMobile(false)}
              aria-current={section === path ? "page" : undefined}
              href={"/studio/" + path + "?wid=" + weddingId}
              className={
                (section === path ? "active " : "") +
                (index === 10 ? "nav-separated" : "")
              }
            >
              <Icon size={19} weight={section === path ? "fill" : "regular"} />
              {name}
              {path === "guests" && <small>{data.guests.length}</small>}
              {path === "messages" &&
                data.messages.filter((m) => m.status === "draft").length >
                  0 && <span className="nav-dot" />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="new-wedding" onClick={() => setCreate(true)}>
            <PlusIcon size={16} /> Create another wedding
          </button>
          <div className="account-block">
            <span className="avatar">{data.user.name.slice(0, 1)}</span>
            <div>
              <b>{data.user.name}</b>
              <small>
                {data.user.is_demo
                  ? "Your private demo"
                  : data.role + " access"}
              </small>
            </div>
            <button
              className="icon-button"
              aria-label="Sign out"
              onClick={async () => {
                await api("/api/auth/logout", "POST");
                window.location.href = "/";
              }}
            >
              <SignOutIcon size={18} />
            </button>
          </div>
        </div>
      </aside>
      <div className="studio-workspace" inert={smallScreen && mobile}>
        <header className="studio-topbar">
          <div>
            <button
              className="icon-button mobile-toggle"
              onClick={() => setMobile(true)}
              aria-label="Open navigation"
              aria-expanded={mobile}
            >
              <ListIcon size={24} />
            </button>
            <span>Studio</span>
            <span className="breadcrumb">/</span>
            <strong>{current}</strong>
          </div>
          <div>
            <span
              className={
                "publish-state " +
                (data.wedding.status !== "draft" ? "live" : "")
              }
            >
              <i />
              {data.wedding.status === "draft"
                ? "Draft"
                : data.wedding.status === "memories"
                  ? "Memories mode"
                  : "Published"}
            </span>
            <PreviewButton {...props} />
          </div>
        </header>
        {data.user.is_demo && (
          <div className="demo-banner">
            <span>You’re in your own demo Studio. Make yourself at home.</span>
            <a href="/start">
              Create your wedding <Arrow diagonal size={14} />
            </a>
          </div>
        )}
        <main id="main" className="studio-main">
          {error && <Notice error>{error}</Notice>}
          {data.role === "viewer" && (
            <Notice>You have view-only access to this wedding.</Notice>
          )}
          {Panel ? (
            <Panel {...props} />
          ) : (
            <Notice>
              This Studio page could not be found.{" "}
              <Link href="/studio">Back to overview</Link>
            </Notice>
          )}
        </main>
        <footer className="studio-footer">
          <FeedbackButton {...props} section={section} />
          <span>Thoughtfully together.</span>
          <span>VOW MOTION STUDIO</span>
        </footer>
      </div>
      {toast.text && (
        <div
          className={"toast " + toast.tone}
          role={toast.tone === "error" ? "alert" : "status"}
        >
          {toast.tone === "error" ? (
            <WarningCircleIcon size={18} />
          ) : (
            <CheckIcon size={18} />
          )}
          {toast.text}
          <button onClick={dismissToast} aria-label="Dismiss">
            <XIcon size={16} />
          </button>
        </div>
      )}
      {create && (
        <Modal title="A new beginning" onClose={() => setCreate(false)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = Object.fromEntries(new FormData(e.currentTarget));
              try {
                const result = await api("/api/weddings", "POST", form);
                window.location.href = "/studio?wid=" + result.id;
              } catch (e) {
                setToast((e as Error).message, "error");
              }
            }}
          >
            <Field label="Couple names">
              <input name="names" required />
            </Field>
            <Field label="Wedding date">
              <input type="date" name="date" required />
            </Field>
            <Field label="Location">
              <input name="location" required />
            </Field>
            <Field label="Design world">
              <select name="world">
                {worlds.map((w) => (
                  <option value={w.id} key={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </Field>
            <Submit>
              Create wedding <Arrow />
            </Submit>
          </form>
        </Modal>
      )}
    </div>
  );
}
