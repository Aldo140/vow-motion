"use client";
import { Field, Modal, Notice, Submit, api } from "@/components/ui";
import type { GuestData } from "@/lib/types";
import { CheckIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { copy } from "./copy";
export function ContactModal({
  data,
  locale,
  onClose,
  onSaved,
}: {
  data: GuestData;
  locale: "en" | "es";
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [selected, setSelected] = useState(data.guests[0].id),
    [message, setMessage] = useState("");
  const guest = data.guests.find((g) => g.id === selected)!;
  return (
    <Modal title={copy[locale].contact} onClose={onClose}>
      {message && <Notice>{message}</Notice>}
      <Field label={locale === "en" ? "Guest" : "Invitado"}>
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          {data.guests.map((g) => (
            <option value={g.id} key={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </Field>
      <form
        key={selected}
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          try {
            await api("/api/guest/contact?token=" + data.token, "POST", {
              ...Object.fromEntries(f),
              guest_id: selected,
              consent: f.has("consent"),
            });
            await onSaved();
            setMessage(
              locale === "en" ? "Contact details saved." : "Datos guardados.",
            );
          } catch (e) {
            setMessage((e as Error).message);
          }
        }}
      >
        <Field label="Email">
          <input name="email" type="email" defaultValue={guest.email} />
        </Field>
        <Field label={locale === "en" ? "Phone" : "Teléfono"}>
          <input name="phone" type="tel" defaultValue={guest.phone} />
        </Field>
        <Field label={locale === "en" ? "Postal address" : "Dirección postal"}>
          <textarea name="address" defaultValue={guest.address} />
        </Field>
        <label className="check-label">
          <input
            type="checkbox"
            name="consent"
            defaultChecked={guest.consent}
          />
          {locale === "en"
            ? "I agree to receive wedding updates by email or SMS. I can turn this off here at any time."
            : "Acepto recibir novedades de la boda por email o SMS. Puedo desactivarlo aquí cuando quiera."}
        </label>
        <Submit disabled={!!data.preview}>
          {locale === "en" ? "Save details" : "Guardar datos"}
          <CheckIcon size={17} />
        </Submit>
      </form>
    </Modal>
  );
}
