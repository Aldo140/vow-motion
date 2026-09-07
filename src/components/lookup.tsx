"use client";
import { useState } from "react";
import { api, Notice, Field, Submit, Arrow } from "./ui";
export default function Lookup({ slug }: { slug: string }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [challenge, setChallenge] = useState(""),
    [demoCode, setDemoCode] = useState("");
  return (
    <div className="lookup-form">
      <h2>{challenge ? "Check your inbox." : "Find your invitation."}</h2>
      <p>
        {challenge
          ? "If your details match, a six-digit verification code will arrive by email."
          : "Use your name and the email shared with your hosts."}
      </p>
      {error && <Notice error>{error}</Notice>}
      {demoCode && (
        <Notice>
          Your private demo verification code: {demoCode}. No email was sent.
        </Notice>
      )}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            const result = await api("/api/lookup", "POST", {
              slug,
              ...Object.fromEntries(new FormData(e.currentTarget)),
              ...(challenge ? { challenge } : {}),
            });
            if (result.url) window.location.href = result.url;
            else {
              setChallenge(result.challenge);
              setDemoCode(result.development_code || "");
            }
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {challenge ? (
          <Field label="Verification code">
            <input
              name="code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              minLength={6}
              maxLength={6}
              required
              autoComplete="one-time-code"
            />
          </Field>
        ) : (
          <>
            <Field label="Your name">
              <input name="name" required autoComplete="name" />
            </Field>
            <Field label="Email address">
              <input name="email" type="email" required autoComplete="email" />
            </Field>
          </>
        )}
        <Submit pending={busy}>
          {challenge ? "Open invitation" : "Find invitation"}
          <Arrow />
        </Submit>
      </form>
    </div>
  );
}
