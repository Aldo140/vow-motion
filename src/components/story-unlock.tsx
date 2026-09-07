"use client";
import { useState } from "react";
import { api, Field, Notice, Submit, Arrow } from "./ui";
export default function StoryUnlock({ slug }: { slug: string }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <div className="lookup-form">
      <h2>A story for our people.</h2>
      <p>Enter the wedding password shared by your hosts.</p>
      {error && <Notice error>{error}</Notice>}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api("/api/story/unlock", "POST", {
              slug,
              password: new FormData(e.currentTarget).get("password"),
            });
            window.location.reload();
          } catch (e) {
            setError((e as Error).message);
            setBusy(false);
          }
        }}
      >
        <Field label="Wedding password">
          <input type="password" name="password" required autoComplete="off" />
        </Field>
        <Submit pending={busy}>
          Read our story
          <Arrow />
        </Submit>
      </form>
    </div>
  );
}
