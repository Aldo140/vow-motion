"use client";
import { useState } from "react";
import type { GuestData } from "@/lib/types";
import { Field, Notice, Submit, api } from "./ui";

export default function GuestRequests({
  data,
  locale,
  refresh,
}: {
  data: GuestData;
  locale: "en" | "es";
  refresh: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const en = locale === "en";
  return (
    <section className="guest-request-panel">
      <h2>
        {en
          ? "A little question for your hosts?"
          : "¿Una pregunta para tus anfitriones?"}
      </h2>
      <p>
        {en
          ? "Only your household and the planning team can see this conversation. Return here to read their answer."
          : "Solo tu hogar y el equipo organizador pueden ver esta conversación. Vuelve aquí para leer la respuesta."}
      </p>
      {data.guestRequests?.map((q) => (
        <article key={q.id}>
          <p className="preserve-lines">{q.question}</p>
          <blockquote className="preserve-lines">
            {q.answer ||
              (en
                ? "Waiting for your hosts’ reply."
                : "Esperando la respuesta de tus anfitriones.")}
          </blockquote>
        </article>
      ))}
      {error && <Notice error>{error}</Notice>}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const question = String(new FormData(form).get("question"));
          setBusy(true);
          setError("");
          try {
            await api("/api/guest/requests?token=" + data.token, "POST", {
              question,
            });
            form.reset();
            await refresh();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field label={en ? "Your question" : "Tu pregunta"}>
          <textarea
            name="question"
            required
            minLength={5}
            maxLength={2000}
            rows={3}
            disabled={data.preview}
          />
        </Field>
        <Submit pending={busy} disabled={!!data.preview}>
          {en ? "Send to your hosts" : "Enviar a tus anfitriones"}
        </Submit>
      </form>
    </section>
  );
}
