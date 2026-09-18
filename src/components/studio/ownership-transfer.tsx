"use client";
import { Field, Modal, Notice, api } from "@/components/ui";
import type { StudioData } from "@/lib/types";
import { useEffect, useState } from "react";

type Transfer = {
  id: string;
  wedding_id: string;
  to_email: string;
  created_at: string;
  expires_at: string;
} | null;

type IncomingTransfer = {
  id: string;
  wedding_id: string;
  names: string;
  created_at: string;
  expires_at: string;
};

type Mfa = { enabled: boolean } | null;

export function OwnershipTransfer({
  data,
  notify,
}: {
  data: StudioData;
  notify: (text: string, tone?: "success" | "error") => void;
}) {
  const [outgoing, setOutgoing] = useState<Transfer>(null);
  const [incoming, setIncoming] = useState<IncomingTransfer[]>([]);
  const [mfa, setMfa] = useState<Mfa>(null);
  const [loaded, setLoaded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = () =>
    Promise.all([
      api(`/api/studio/transfer-ownership?wedding=${data.wedding.id}`),
      api("/api/auth/me"),
    ])
      .then(([out, me]: [{ transfer: Transfer }, { transfers: IncomingTransfer[]; mfa: Mfa }]) => {
        setOutgoing(out.transfer);
        setIncoming(me.transfers || []);
        setMfa(me.mfa);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.wedding.id]);

  const closeModal = () => {
    setConfirming(false);
    setEmail("");
    setPassword("");
    setCode("");
    setError("");
  };

  const cancel = async () => {
    setBusy(true);
    try {
      await api(
        `/api/studio/transfer-ownership?wedding=${data.wedding.id}`,
        "DELETE",
      );
      setOutgoing(null);
      notify("Ownership transfer cancelled.");
    } catch (e) {
      notify((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  const respond = async (transferId: string, action: "accept" | "decline") => {
    setBusy(true);
    try {
      await api(`/api/auth/transfer-${action}`, "POST", { id: transferId });
      notify(
        action === "accept"
          ? "You now own this wedding. Reload Studio to see it in your list."
          : "Transfer declined.",
      );
      await refresh();
    } catch (e) {
      notify((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  if (loaded && data.role !== "owner" && !incoming.length) return null;
  return (
    <section className="settings-extra" aria-label="Ownership transfer">
      <div>
        <h2>
          {data.role === "owner"
            ? "Hand this wedding to someone else"
            : "Ownership offers"}
        </h2>
        {data.role === "owner" && (
          <p className="muted-copy">
            Transfers full ownership — billing, deletion, everything — to
            another Vow Motion account. They must accept before anything
            changes, and it expires in 7 days if they don&rsquo;t.
          </p>
        )}
      </div>
      <div className="privacy-centre-actions">
        {loaded && data.role === "owner" && outgoing && (
          <Notice>
            Offered to {outgoing.to_email}, expires{" "}
            {new Date(outgoing.expires_at).toLocaleDateString()}.{" "}
            <button className="text-link" disabled={busy} onClick={cancel}>
              Cancel offer
            </button>
          </Notice>
        )}
        {loaded && data.role === "owner" && !outgoing && (
          <button
            className="button outline small"
            onClick={() => setConfirming(true)}
          >
            Transfer ownership
          </button>
        )}
        {loaded &&
          incoming.map((t) => (
            <Notice key={t.id}>
              <strong>{t.names}</strong> has been offered to you, expires{" "}
              {new Date(t.expires_at).toLocaleDateString()}.{" "}
              <button
                className="text-link"
                disabled={busy}
                onClick={() => respond(t.id, "accept")}
              >
                Accept
              </button>{" "}
              <button
                className="text-link"
                disabled={busy}
                onClick={() => respond(t.id, "decline")}
              >
                Decline
              </button>
            </Notice>
          ))}
      </div>
      {confirming && (
        <Modal title="Transfer ownership" onClose={closeModal}>
          <p>
            Enter the email of the Vow Motion account to transfer{" "}
            {data.wedding.names} to. They&rsquo;ll need to accept from their
            own account before ownership actually changes.
          </p>
          {error && <Notice error>{error}</Notice>}
          <Field label="Recipient's email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field label="Confirm your password">
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          {mfa?.enabled && (
            <Field label="Current 6-digit code, or a backup code">
              <input value={code} onChange={(e) => setCode(e.target.value)} />
            </Field>
          )}
          <div className="campaign-actions">
            <button type="button" className="button outline" onClick={closeModal}>
              Never mind
            </button>
            <button
              type="button"
              className="button primary"
              disabled={
                busy || !email || !password || (mfa?.enabled && !code)
              }
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  const result = (await api(
                    `/api/studio/transfer-ownership?wedding=${data.wedding.id}`,
                    "POST",
                    { email, password, code },
                  )) as { transfer: Transfer };
                  setOutgoing(result.transfer);
                  closeModal();
                  notify(`Offer sent to ${email}.`);
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Sending…" : "Send offer"}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
