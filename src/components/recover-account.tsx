"use client";
import Link from "next/link";
import { useState } from "react";
import { Brand, Field, Submit, Notice, api } from "./ui";
export default function RecoverAccount() {
  const [challenge, setChallenge] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [done, setDone] = useState(false);
  return (
    <main id="main" className="legal">
      <Brand />
      <h1>{done ? "You’re ready to return." : "Let’s get you back in."}</h1>
      {done ? (
        <>
          <p>Your password has been updated. Sign in with your new password.</p>
          <Link className="button primary" href="/login">
            Back to sign in
          </Link>
        </>
      ) : (
        <>
          <p>
            {challenge
              ? "If your email matches an account, a six-digit recovery code is on its way. It expires in ten minutes."
              : "Enter the email you used for your wedding account. We’ll send a code to reset your password."}
          </p>
          {error && <Notice error>{error}</Notice>}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              const form = new FormData(e.currentTarget);
              try {
                if (challenge) {
                  await api("/api/auth/reset-confirm", "POST", {
                    challenge,
                    code: form.get("code"),
                    password: form.get("password"),
                  });
                  setDone(true);
                } else {
                  const result = await api("/api/auth/reset-request", "POST", {
                    email: form.get("email"),
                  });
                  setChallenge(result.challenge);
                }
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {challenge ? (
              <>
                <Field label="Recovery code">
                  <input
                    name="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                  />
                </Field>
                <Field label="New password" hint="At least 10 characters.">
                  <input
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    minLength={10}
                    maxLength={200}
                    required
                  />
                </Field>
              </>
            ) : (
              <Field label="Email">
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                />
              </Field>
            )}
            <Submit pending={busy}>
              {challenge ? "Save new password" : "Send recovery code"}
            </Submit>
          </form>
          {challenge && (
            <button
              className="text-link"
              onClick={() => {
                setChallenge("");
                setError("");
              }}
            >
              Try another email or request a new code
            </button>
          )}
          <p>
            <Link href="/login">Back to sign in</Link>
          </p>
        </>
      )}
    </main>
  );
}
