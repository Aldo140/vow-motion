"use client";
import { Field, Modal, Notice, api } from "@/components/ui";
import { useEffect, useState } from "react";

type Mfa = { enabled: boolean } | null;
type SetupState = {
  secret: string;
  otpauth_url: string;
  qr: string;
} | null;

export function MfaSettings({
  notify,
}: {
  notify: (text: string, tone?: "success" | "error") => void;
}) {
  const [mfa, setMfa] = useState<Mfa>(null);
  const [loaded, setLoaded] = useState(false);
  const [setup, setSetup] = useState<SetupState>(null);
  const [setupCode, setSetupCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [disabling, setDisabling] = useState(false);
  const [password, setPassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = () =>
    api("/api/auth/me")
      .then((result: { mfa: Mfa }) => {
        setMfa(result.mfa);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));

  useEffect(() => {
    refresh();
  }, []);

  const startSetup = async () => {
    setBusy(true);
    setError("");
    try {
      const result = (await api("/api/auth/mfa-setup", "POST", {})) as SetupState;
      setSetup(result);
    } catch (e) {
      notify((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  const confirmSetup = async () => {
    setBusy(true);
    setError("");
    try {
      const result = (await api("/api/auth/mfa-confirm", "POST", {
        code: setupCode,
      })) as { backupCodes: string[] };
      setBackupCodes(result.backupCodes);
      setSetup(null);
      setSetupCode("");
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    setError("");
    try {
      await api("/api/auth/mfa-disable", "POST", {
        password,
        code: disableCode,
      });
      setDisabling(false);
      setPassword("");
      setDisableCode("");
      notify("Two-factor authentication is off.");
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="settings-extra" aria-label="Two-factor authentication">
      <div>
        <h2>Two-factor authentication</h2>
        <p className="muted-copy">
          Require a code from an authenticator app when signing in, deleting
          your account, or exporting your data — on top of your password.
        </p>
      </div>
      <div className="privacy-centre-actions">
        {loaded && mfa?.enabled && (
          <>
            <Notice>Two-factor authentication is on for your account.</Notice>
            <button
              className="button outline small"
              onClick={() => setDisabling(true)}
            >
              Turn off two-factor authentication
            </button>
          </>
        )}
        {loaded && !mfa?.enabled && (
          <button className="button outline small" disabled={busy} onClick={startSetup}>
            Turn on two-factor authentication
          </button>
        )}
      </div>
      {setup && (
        <Modal
          title="Set up two-factor authentication"
          onClose={() => {
            setSetup(null);
            setSetupCode("");
            setError("");
          }}
        >
          <p>
            Scan this with an authenticator app (like Google Authenticator or
            1Password), or enter the key by hand.
          </p>
          <img
            src={setup.qr}
            alt="QR code for two-factor setup"
            width={200}
            height={200}
          />
          <p>
            <code>{setup.secret}</code>
          </p>
          {error && <Notice error>{error}</Notice>}
          <Field label="Enter the 6-digit code from your app">
            <input
              value={setupCode}
              onChange={(e) => setSetupCode(e.target.value)}
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              autoFocus
            />
          </Field>
          <button
            className="button primary"
            disabled={busy || setupCode.length !== 6}
            onClick={confirmSetup}
          >
            {busy ? "Confirming…" : "Confirm and turn on"}
          </button>
        </Modal>
      )}
      {backupCodes && (
        <Modal title="Save your backup codes" onClose={() => setBackupCodes(null)}>
          <p>
            Each code works once, if you ever lose access to your
            authenticator app. Save them somewhere safe — they won&rsquo;t be
            shown again.
          </p>
          <ul className="backup-codes-list">
            {backupCodes.map((code) => (
              <li key={code}>
                <code>{code}</code>
              </li>
            ))}
          </ul>
          <button className="button primary" onClick={() => setBackupCodes(null)}>
            I&rsquo;ve saved these codes
          </button>
        </Modal>
      )}
      {disabling && (
        <Modal
          title="Turn off two-factor authentication"
          onClose={() => {
            setDisabling(false);
            setPassword("");
            setDisableCode("");
            setError("");
          }}
        >
          <p>Confirm your password and a current code to turn this off.</p>
          {error && <Notice error>{error}</Notice>}
          <Field label="Password">
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Field label="Current 6-digit code, or a backup code">
            <input
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value)}
            />
          </Field>
          <button
            className="button primary"
            disabled={busy || !password || !disableCode}
            onClick={disable}
          >
            {busy ? "Turning off…" : "Turn off"}
          </button>
        </Modal>
      )}
    </section>
  );
}
