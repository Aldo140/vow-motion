"use client";
import { Arrow, Field, Modal, Notice } from "@/components/ui";
import { formatDate } from "@/lib/worlds";
import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeading, type PanelProps } from "./shared";

const sentStates = new Set(["development", "sent", "delivered"]);
const blockedStates = new Set(["bounced", "complained", "suppressed"]);
const deliveryLabel = (status?: string, opened?: string | null) => {
  if (opened) return "Opened invitation";
  return ({ development: "Demo outbox", sent: "Sent", delivered: "Delivered", bounced: "Bounced — check email", complained: "Complaint — do not resend", suppressed: "Suppressed", failed: "Failed — ready to retry", queued: "Sending" } as Record<string, string>)[status || ""] || "Not sent";
};

export function Invitations({ data, mutate, notify }: PanelProps) {
  const [links, setLinks] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [campaign, setCampaign] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [sending, setSending] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [subject, setSubject] = useState("Your invitation from {{couple}}");
  const [message, setMessage] = useState(
    "Dear {{household}},\n\nWe would love you to join us. Your private invitation includes everything planned for your household and a place to reply.\n\nOpen your invitation:\n{{invitation_link}}\n\nWith love,\n{{couple}}",
  );
  const households = useMemo(
    () => data.households.map((household) => {
      const guests = data.guests.filter((guest) => guest.household_id === household.id);
      const email = guests.find((guest) => guest.email.trim())?.email || "";
      const dispatch = data.invitationDispatches.find((item) => item.household_id === household.id);
      const blocked = Boolean(
        dispatch && blockedStates.has(dispatch.status) &&
        (dispatch.status !== "bounced" || dispatch.email.trim().toLowerCase() === email.trim().toLowerCase()),
      );
      return { ...household, guests, email, dispatch, blocked, sent: Boolean(dispatch && sentStates.has(dispatch.status)) };
    }),
    [data.guests, data.households, data.invitationDispatches],
  );
  const ready = households.filter((household) => household.email && !household.sent && !household.blocked);
  const missing = households.filter((household) => !household.email);
  const alreadySent = households.filter((household) => household.sent);
  const attention = households.filter((household) => household.email && household.blocked);
  const chosen = selected.filter((householdId) => ready.some((household) => household.id === householdId));

  const openCampaign = () => {
    setSelected(ready.map((household) => household.id));
    setStep(1);
    setCampaign(true);
  };
  const dispatch = async (mode: "test" | "send") => {
    setSending(true);
    try {
      const result = await mutate("invitation-campaign", {
        mode,
        household_ids: mode === "send" ? chosen : [],
        subject,
        body: message,
      }) as { sent: number; failed: unknown[]; development?: boolean };
      if (result.failed.length) notify(`${result.sent} sent; ${result.failed.length} need attention.`, "error");
      else if (mode === "test") notify(result.development ? "Test recorded in the demo outbox." : `Test sent to ${data.user.email}.`);
      else {
        notify(result.development ? `${result.sent} invitations recorded in the demo outbox.` : `${result.sent} household invitations sent.`);
        setCampaign(false);
      }
    } catch (error) { notify((error as Error).message, "error"); }
    finally { setSending(false); }
  };

  return <>
    <PageHeading title="It starts with an invitation." description="Review every household once. Vow Motion creates each private link and places it into the right email automatically.">
      <button className="button primary" disabled={!ready.length || data.role === "viewer"} onClick={openCampaign}>Send invitations <Arrow /></button>
    </PageHeading>
    <section className="invitation-readiness" aria-label="Invitation readiness">
      <div><strong>{ready.length}</strong><span>Ready to send</span></div>
      <div><strong>{missing.length}</strong><span>Need an email</span></div>
      <div><strong>{alreadySent.length}</strong><span>Already sent</span></div>
      <div><strong>{attention.length}</strong><span>Needs attention</span></div>
    </section>
    {missing.length > 0 && <Notice>{missing.length} {missing.length === 1 ? "household needs" : "households need"} an email before everyone can be invited. <Link href={`/studio/guests?wid=${data.wedding.id}`}>Add missing emails</Link>; the rest can send now.</Notice>}
    {attention.length > 0 && <Notice error>{attention.length} {attention.length === 1 ? "delivery needs" : "deliveries need"} attention. <Link href={`/studio/guests?wid=${data.wedding.id}`}>Review the email address</Link> before sending again.</Notice>}
    <div className="invitation-workspace">
      <div className={"invitation-live-preview world-" + data.wedding.world}>
        <span>TOGETHER WITH OUR FAMILIES</span><h2>{data.wedding.names.replace(" & ", "\n&\n")}</h2>
        <p>{formatDate(data.wedding.date)}<br />{data.wedding.location}</p>
        <div className="envelope-seal">{data.wedding.names.split(" & ").map((name) => name[0]).join("")}</div>
        <small>We’ve saved a place for you.</small>
      </div>
      <div>
        <h2 className="serif-heading">Every household, accounted for.</h2>
        <p className="muted-copy">Bulk sending uses one address and one private link per household. Individual link controls remain for WhatsApp, hand delivery, or a personal resend.</p>
        {!households.length ? <Notice>Add your first guest to prepare an invitation.</Notice> : households.map((household) => <div className="household-invite" key={household.id}>
          <div><b>{household.name}</b><small>{household.guests.map((guest) => guest.name).join(" & ")}</small><small className="invite-delivery-line">{household.email || "Email needed"} · {deliveryLabel(household.dispatch?.status, household.dispatch?.opened_at)}</small>{household.dispatch?.error && <small className="invite-delivery-error">{household.dispatch.error}</small>}</div>
          {!links[household.id] ? <button className="button outline small" disabled={busy === household.id} onClick={async () => {
            setBusy(household.id);
            try { const result = await mutate("invitations", { household_id: household.id }) as { url: string }; setLinks((current) => ({ ...current, [household.id]: result.url })); }
            catch (error) { notify((error as Error).message, "error"); } finally { setBusy(""); }
          }}>Get individual link <Arrow size={14} /></button> : <div className="invite-actions">
            <button className="text-link" onClick={async () => { await navigator.clipboard.writeText(links[household.id]); notify("Invitation link copied."); }}>Copy</button>
            <a href={links[household.id]}>Open <Arrow diagonal size={13} /></a>
            <a href={"https://wa.me/?text=" + encodeURIComponent(`We would love you to join us. ${data.wedding.names} — your invitation: ${links[household.id]}`)} target="_blank" rel="noreferrer">WhatsApp</a>
          </div>}
        </div>)}
      </div>
    </div>
    {campaign && <Modal title="Send the invitations" onClose={() => setCampaign(false)} wide>
      <div className="campaign-progress" aria-label="Sending steps"><strong className={step === 1 ? "current" : ""}>1 · Recipients</strong><strong className={step === 2 ? "current" : ""}>2 · Message</strong><strong className={step === 3 ? "current" : ""}>3 · Review and send</strong></div>
      {step === 1 && <>
        <section className="campaign-recipients"><div><h3>{chosen.length} household invitations ready</h3><p>Each household receives its own private link. Successful previous sends are excluded automatically; failed sends are ready to try again.</p></div><button type="button" className="text-link" onClick={() => setSelected(chosen.length === ready.length ? [] : ready.map((household) => household.id))}>{chosen.length === ready.length ? "Clear all" : "Select all ready"}</button></section>
        <div className="campaign-households">{ready.map((household) => <label key={household.id}><input type="checkbox" checked={chosen.includes(household.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, household.id] : current.filter((id) => id !== household.id))} /><span><strong>{household.name}</strong><small>{household.email}</small></span></label>)}</div>
        <div className="campaign-actions"><button type="button" className="button primary" disabled={!chosen.length} onClick={() => setStep(2)}>Continue with {chosen.length} <Arrow /></button></div>
      </>}
      {step === 2 && <>
        <Field label="Email subject" hint="{{couple}} is replaced automatically."><input value={subject} onChange={(event) => setSubject(event.target.value)} /></Field>
        <Field label="Invitation message" hint="The household, couple and private invitation are filled in automatically for every recipient."><textarea rows={9} value={message} onChange={(event) => setMessage(event.target.value)} /></Field>
        {!message.includes("{{invitation_link}}") && <Notice error>Put {"{{invitation_link}}"} back into the message so guests receive their private invitation.</Notice>}
        <div className="campaign-preview"><span>PREVIEW FOR THE FIRST HOUSEHOLD</span><strong>{subject.replaceAll("{{couple}}", data.wedding.names)}</strong><p>{message.replaceAll("{{household}}", households.find((household) => household.id === chosen[0])?.name || "Your guests").replaceAll("{{couple}}", data.wedding.names).replaceAll("{{invitation_link}}", "Open your private invitation →")}</p></div>
        <div className="campaign-actions"><button type="button" className="button outline" onClick={() => setStep(1)}>Back</button><button type="button" className="button primary" disabled={!subject.trim() || !message.includes("{{invitation_link}}") || !message.trim()} onClick={() => setStep(3)}>Review the send <Arrow /></button></div>
      </>}
      {step === 3 && <>
        <div className="campaign-final-check"><span>READY TO SEND</span><strong>{chosen.length}</strong><h3>private household invitations</h3><p>One email per household. One link made for the people named in it. Previously successful sends will still be skipped by the server.</p></div>
        <div className="campaign-review-lines"><p><span>From</span>{data.wedding.names}</p><p><span>Subject</span>{subject.replaceAll("{{couple}}", data.wedding.names)}</p><p><span>Test goes to</span>{data.user.email}</p></div>
        <div className="campaign-actions"><button type="button" className="button outline" onClick={() => setStep(2)}>Back</button><button type="button" className="button outline" disabled={sending} onClick={() => dispatch("test")}>Send me a test</button><button type="button" className="button primary" disabled={sending || !chosen.length} onClick={() => dispatch("send")}>{sending ? "Sending safely…" : `Send ${chosen.length} invitations`} <Arrow /></button></div>
        <p className="form-note">Initial invitations are transactional. Optional consent collected during RSVP applies to later reminders and wedding updates.</p>
      </>}
    </Modal>}
  </>;
}
