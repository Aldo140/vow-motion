"use client";
import { useState } from "react";
import { Brand, Field, Notice, Submit, Arrow, api } from "./ui";
export default function VerifyEmail({ email }: { email: string }) {
  const [challenge, setChallenge] = useState(""),
    [code, setCode] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <main id="main" className="error-page">
      <Brand />
      <span>YOUR SHARED STUDIO</span>
      <h1>A quick introduction.</h1>
      <p>
        Verify {email} to access weddings shared with you. Your own wedding
        remains available while you do.
      </p>
      <div className="lookup-form">
        {error && <Notice error>{error}</Notice>}
        {code && (
          <Notice>
            Development verification code: {code}. No email was sent.
          </Notice>
        )}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              if (challenge) {
                await api("/api/auth/verify-confirm", "POST", {
                  challenge,
                  code: new FormData(e.currentTarget).get("code"),
                });
                window.location.href = "/studio";
              } else {
                const result = await api("/api/auth/verify-request", "POST");
                if (result.verified) {
                  window.location.href = "/studio";
                  return;
                }
                setChallenge(result.challenge);
                setCode(result.development_code || "");
              }
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {challenge && (
            <Field label="Verification code">
              <input
                name="code"
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
              />
            </Field>
          )}
          <Submit pending={busy}>
            {challenge ? "Verify and enter" : "Send verification code"}
            <Arrow />
          </Submit>
        </form>
        <a className="text-link" href="/start">
          Continue with your own wedding
          <Arrow />
        </a>
      </div>
    </main>
  );
}
