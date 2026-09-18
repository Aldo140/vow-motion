"use client";
import { Field, Modal, Notice, api } from "@/components/ui";
import type { StudioData } from "@/lib/types";
import { useEffect, useState } from "react";

type Deletion = { id: string; requested_at: string; scheduled_for: string } | null;

export function PrivacyCentre({
  data,
  notify,
}: {
  data: StudioData;
  notify: (text: string, tone?: "success" | "error") => void;
}) {
  const [deletion, setDeletion] = useState<Deletion>(null);
  const [loaded, setLoaded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // This panel only renders when the viewer owns the open wedding, so its
  // owner_id is the signed-in account's id — used to count every wedding
  // this account owns (`data.weddings` also includes shared collaborations).
  const ownedCount = data.weddings.filter(
    (w) => w.owner_id === data.wedding.owner_id,
  ).length;

  useEffect(() => {
    api("/api/auth/me")
      .then((result: { deletion: Deletion }) => {
        setDeletion(result.deletion);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const cancel = async () => {
    setBusy(true);
    try {
      await api("/api/auth/deletion-cancel", "POST", {});
      setDeletion(null);
      notify("Your account deletion has been cancelled.");
    } catch (e) {
      notify((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="settings-extra" aria-label="Privacy centre">
      <div>
        <h2>Privacy centre</h2>
        <p className="muted-copy">
          Export everything stored for your weddings, or close your account.
          This affects only your account — collaborators keep their own.
        </p>
      </div>
      <div className="privacy-centre-actions">
        <a
          className="button outline small"
          href={"/api/auth/export"}
        >
          Export all your data
        </a>
        {loaded && deletion && (
          <Notice error>
            Your account is scheduled for deletion on{" "}
            {new Date(deletion.scheduled_for).toLocaleDateString()}.{" "}
            <button
              className="text-link"
              disabled={busy}
              onClick={cancel}
            >
              Cancel deletion
            </button>
          </Notice>
        )}
        {loaded && !deletion && (
          <button
            className="button outline small"
            onClick={() => setConfirming(true)}
          >
            Delete my account
          </button>
        )}
      </div>
      {confirming && (
        <Modal
          title="Delete your account"
          onClose={() => {
            setConfirming(false);
            setPassword("");
            setError("");
          }}
        >
          <p>
            This permanently deletes every wedding you own ({ownedCount} in
            this account), their guests, replies, photos, and messages, after
            a 14-day grace period you can cancel any time from this page.
            Weddings you collaborate on but do not own are not affected.
          </p>
          {error && <Notice error>{error}</Notice>}
          <Field label="Confirm your password">
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          <div className="campaign-actions">
            <button
              type="button"
              className="button outline"
              onClick={() => setConfirming(false)}
            >
              Keep my account
            </button>
            <button
              type="button"
              className="button primary"
              disabled={busy || !password}
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  const result = (await api(
                    "/api/auth/deletion-request",
                    "POST",
                    { password },
                  )) as { deletion: Deletion };
                  setDeletion(result.deletion);
                  setConfirming(false);
                  setPassword("");
                  notify(
                    "Deletion scheduled. You can cancel it any time before it completes.",
                  );
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Scheduling…" : "Schedule deletion"}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
