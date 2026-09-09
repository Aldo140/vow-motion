"use client";
import { Field } from "@/components/ui";
export type WeddingUpdatesContact = {
  guest_id: string;
  email: string;
  phone: string;
  consent: boolean;
};
export function WeddingUpdatesFields({
  value,
  onChange,
  locale,
  name,
}: {
  value: WeddingUpdatesContact;
  onChange: (patch: Partial<WeddingUpdatesContact>) => void;
  locale: "en" | "es";
  name: string;
}) {
  const en = locale === "en";
  return (
    <fieldset className="wedding-updates-person">
      <legend>{name}</legend>
      <label className="check-label">
        <input
          type="checkbox"
          checked={value.consent}
          onChange={(e) => onChange({ consent: e.target.checked })}
        />
        {en
          ? "Yes, send me wedding updates by email or text using the details below."
          : "Sí, quiero recibir novedades de la boda por email o SMS con los datos de abajo."}
      </label>
      {value.consent && (
        <div className="form-grid">
          <Field
            label={en ? "Email for wedding updates" : "Email para novedades"}
          >
            <input
              type="email"
              autoComplete="email"
              maxLength={254}
              required={!value.phone.trim()}
              value={value.email}
              onChange={(e) => onChange({ email: e.target.value })}
            />
          </Field>
          <Field
            label={
              en
                ? "Mobile number (optional with email)"
                : "Móvil (opcional con email)"
            }
            hint={
              en
                ? "Include your country code, for example +1."
                : "Incluye el prefijo del país, por ejemplo +34."
            }
          >
            <input
              type="tel"
              autoComplete="tel"
              maxLength={50}
              required={!value.email.trim()}
              value={value.phone}
              onChange={(e) => onChange({ phone: e.target.value })}
            />
          </Field>
        </div>
      )}
      <small>
        {value.consent
          ? en
            ? "Your hosts can send wedding reminders and changes of plan. You can turn this off in Contact & wedding updates at any time."
            : "Tus anfitriones pueden enviar recordatorios y cambios de planes. Puedes desactivarlos en Contacto y novedades cuando quieras."
          : en
            ? "Optional. Your RSVP will still be saved. You can check the invitation for the latest details."
            : "Opcional. Tu respuesta se guardará igualmente. Consulta la invitación para ver las novedades."}
      </small>
    </fieldset>
  );
}
