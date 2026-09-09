"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowSquareOutIcon,
  CalendarBlankIcon,
  ImageIcon,
  PlusIcon,
  SignOutIcon,
  TrashIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { api, Modal } from "./ui";

type Media = { url: string; type: "image" | "video" };
type Post = {
  id: string;
  caption: string;
  media: Media[];
  kind: "image" | "carousel" | "reel";
  status: string;
  scheduled_at: string | null;
  permalink: string | null;
  error: string | null;
  created_at: string;
  posted_at: string | null;
};

const when = (value: unknown) =>
  value
    ? new Date(String(value)).toLocaleString("en-CA", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";

function deriveKind(media: Media[]): Post["kind"] {
  if (media.length > 1) return "carousel";
  if (media[0]?.type === "video") return "reel";
  return "image";
}

// <input type="datetime-local"> wants "YYYY-MM-DDTHH:mm" in local time.
const toLocalInput = (iso: string | null) => {
  const d = iso ? new Date(iso) : new Date(Date.now() + 3600_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function AdminContent({
  posts,
  connected,
}: {
  posts: Post[];
  connected: boolean;
}) {
  const [editing, setEditing] = useState<Post | "new" | null>(null);

  const groups: [string, string, Post[]][] = [
    ["scheduled", "Scheduled", posts.filter((p) => p.status === "scheduled")],
    ["failed", "Needs attention", posts.filter((p) => p.status === "failed")],
    [
      "draft",
      "Drafts",
      posts.filter((p) => p.status === "draft" || p.status === "canceled"),
    ],
    [
      "posted",
      "Posted",
      posts.filter((p) => p.status === "posted" || p.status === "publishing"),
    ],
  ];

  return (
    <div className="ops">
      <header className="ops-bar">
        <Link href="/admin" className="ops-back">
          <ArrowLeftIcon size={15} /> Operations
        </Link>
        <div className="ops-bar-right">
          <button
            className="button primary small"
            onClick={() => setEditing("new")}
          >
            <PlusIcon size={14} /> New post
          </button>
          <button
            className="icon-button"
            aria-label="Sign out"
            onClick={async () => {
              await api("/api/auth/logout", "POST");
              window.location.href = "/";
            }}
          >
            <SignOutIcon size={17} />
          </button>
        </div>
      </header>

      <div className="ops-shell">
        <div className="page-heading">
          <div>
            <p className="eyebrow">BRAND</p>
            <h1>Instagram content</h1>
          </div>
        </div>

        {!connected && (
          <div className="notice">
            Instagram is not connected yet — drafts save, but nothing publishes.
            Follow{" "}
            <Link href="/admin" className="ops-inline-link">
              docs/INSTAGRAM-SETUP.md
            </Link>{" "}
            to link the account, then set <code>INSTAGRAM_ACCOUNT_ID</code> and{" "}
            <code>INSTAGRAM_ACCESS_TOKEN</code> in Vercel.
          </div>
        )}

        {posts.length === 0 && (
          <div className="empty-state">
            <h2>Nothing queued</h2>
            <p>
              Write the first post — a caption, an image or a short video, and a
              time to publish. The worker posts it on schedule.
            </p>
            <button
              className="button primary"
              onClick={() => setEditing("new")}
            >
              <PlusIcon size={15} /> New post
            </button>
          </div>
        )}

        {groups.map(([key, label, list]) =>
          list.length === 0 ? null : (
            <section key={key} className="content-group">
              <div className="panel-title ops-section-title">
                <h2>
                  {label} <span className="ops-count">{list.length}</span>
                </h2>
              </div>
              <div className="content-list">
                {list.map((post) => (
                  <button
                    key={post.id}
                    className="content-card"
                    onClick={() => setEditing(post)}
                  >
                    <span className="content-thumb">
                      {post.media[0] ? (
                        post.media[0].type === "video" ? (
                          <video src={post.media[0].url} muted />
                        ) : (
                          <img src={post.media[0].url} alt="" />
                        )
                      ) : (
                        <ImageIcon size={20} />
                      )}
                      {post.media.length > 1 && (
                        <i className="content-count">{post.media.length}</i>
                      )}
                    </span>
                    <span className="content-body">
                      <span className="content-caption">
                        {post.caption || <em>No caption</em>}
                      </span>
                      <span className="content-meta">
                        <span className={"status " + post.status}>
                          {post.kind}
                        </span>
                        {post.status === "scheduled" && (
                          <>
                            <CalendarBlankIcon size={12} />{" "}
                            {when(post.scheduled_at)}
                          </>
                        )}
                        {post.status === "posted" && (
                          <>posted {when(post.posted_at)}</>
                        )}
                        {post.status === "failed" && (
                          <span className="content-error">
                            <WarningCircleIcon size={12} /> {post.error}
                          </span>
                        )}
                      </span>
                    </span>
                    {post.permalink && (
                      <a
                        href={post.permalink}
                        target="_blank"
                        rel="noreferrer"
                        className="icon-button"
                        onClick={(e) => e.stopPropagation()}
                        aria-label="View on Instagram"
                      >
                        <ArrowSquareOutIcon size={15} />
                      </a>
                    )}
                  </button>
                ))}
              </div>
            </section>
          ),
        )}
      </div>

      {editing && (
        <Editor
          post={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => window.location.reload()}
        />
      )}
    </div>
  );
}

function Editor({
  post,
  onClose,
  onSaved,
}: {
  post: Post | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [caption, setCaption] = useState(post?.caption ?? "");
  const [media, setMedia] = useState<Media[]>(post?.media ?? []);
  const [scheduledAt, setScheduledAt] = useState(
    toLocalInput(post?.scheduled_at ?? null),
  );
  const [busy, setBusy] = useState<"" | "upload" | "save">("");
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const kind = deriveKind(media);
  const editable =
    !post || ["draft", "scheduled", "failed", "canceled"].includes(post.status);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy("upload");
    setError("");
    try {
      const added: Media[] = [];
      for (const file of Array.from(files).slice(0, 10 - media.length)) {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/admin/media", {
          method: "POST",
          body: form,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed.");
        added.push(data);
      }
      setMedia((m) => [...m, ...added]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  async function save(status: "draft" | "scheduled" | "canceled") {
    setBusy("save");
    setError("");
    try {
      const payload = {
        caption,
        media,
        kind,
        status,
        scheduled_at:
          status === "scheduled"
            ? new Date(scheduledAt).toISOString()
            : null,
      };
      if (post)
        await api(`/api/admin/social/${post.id}`, "PATCH", payload);
      else await api("/api/admin/social", "POST", payload);
      onSaved();
    } catch (e) {
      setError((e as Error).message);
      setBusy("");
    }
  }

  async function remove() {
    if (!post) return;
    setBusy("save");
    try {
      await api(`/api/admin/social/${post.id}`, "DELETE");
      onSaved();
    } catch (e) {
      setError((e as Error).message);
      setBusy("");
    }
  }

  return (
    <Modal
      title={post ? "Edit post" : "New post"}
      onClose={onClose}
      wide
      className="content-editor-modal"
    >
      {error && <div className="notice error">{error}</div>}

      <div className="content-editor">
        <div className="content-media-edit">
          <div className="content-media-grid">
            {media.map((item, i) => (
              <div key={item.url} className="content-media-item">
                {item.type === "video" ? (
                  <video src={item.url} controls muted />
                ) : (
                  <img src={item.url} alt="" />
                )}
                {editable && (
                  <button
                    className="content-media-remove"
                    aria-label="Remove"
                    onClick={() =>
                      setMedia((m) => m.filter((_, j) => j !== i))
                    }
                  >
                    <TrashIcon size={13} />
                  </button>
                )}
              </div>
            ))}
            {editable && media.length < 10 && (
              <button
                className="content-media-add"
                onClick={() => fileInput.current?.click()}
                disabled={busy === "upload"}
              >
                <PlusIcon size={18} />
                {busy === "upload" ? "Uploading…" : "Add media"}
              </button>
            )}
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
            multiple
            hidden
            onChange={(e) => upload(e.target.files)}
          />
          <p className="content-kind">
            Will post as <strong>{kind}</strong>
            {kind === "carousel" && ` · ${media.length} slides`}
          </p>
        </div>

        <div className="content-copy-edit">
          <label className="field">
            Caption
            <textarea
              rows={9}
              maxLength={2200}
              value={caption}
              disabled={!editable}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write the caption. Hashtags on their own line at the end."
            />
            <small>{caption.length} / 2200</small>
          </label>

          <label className="field">
            Publish at
            <input
              type="datetime-local"
              value={scheduledAt}
              disabled={!editable}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
            <small>
              Posts on the next worker run after this time (daily at 07:00
              Calgary unless the pinger is set up).
            </small>
          </label>
        </div>
      </div>

      {editable && (
        <div className="form-actions content-actions">
          {post && (
            <button
              className="button outline small content-delete"
              onClick={remove}
              disabled={busy === "save"}
            >
              <TrashIcon size={13} /> Delete
            </button>
          )}
          <button
            className="button outline"
            onClick={() => save("draft")}
            disabled={busy === "save"}
          >
            Save draft
          </button>
          <button
            className="button primary"
            onClick={() => save("scheduled")}
            disabled={busy === "save" || media.length === 0}
          >
            {busy === "save" ? "Saving…" : "Schedule"}
          </button>
        </div>
      )}
    </Modal>
  );
}
