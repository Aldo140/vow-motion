import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const master = read("artifacts/outreach-master-2026-09-08.json");
const audit = read("artifacts/outreach-mail-audit-2026-09-09.json");
const latestSendFiles = [10, 11, 12, 13, 14].map((batch) => path.join(root, `artifacts/outreach-batch${batch}-send-results-2026-09-09.json`));
const latestSends = latestSendFiles.flatMap((file) => fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : []);
const contacts = new Map(master.contacts_list.map((contact) => [contact.email.toLowerCase(), contact]));
let added = 0;
let additionalMessages = 0;

for (const message of audit.sent) {
  const email = String(message.to?.[0] || "").trim().toLowerCase();
  if (!email || email === "jorti104@mtroyal.ca") continue;
  const sentAt = new Date(message.email_ts).toISOString();
  let contact = contacts.get(email);
  if (!contact) {
    const named = String(message.subject).match(/ for (.+)$/i)?.[1];
    contact = {
      name: named || email.split("@")[0], email, source: "",
      first_sent: sentAt, sent_messages: 0, status: "Awaiting reply", reply: "",
      next_action: "Wait; no immediate follow up", batch: "September 9 outreach",
      last_sent: "", thread_url: `https://mail.google.com/mail/#all/${message.thread_id || message.id}`,
    };
    contacts.set(email, contact);
    added++;
  }
  if (!contact.last_sent || new Date(sentAt) > new Date(contact.last_sent)) {
    contact.sent_messages = Number(contact.sent_messages || 0) + 1;
    contact.last_sent = sentAt;
    if (!contact.first_sent) contact.first_sent = sentAt;
    additionalMessages++;
  }
}

const latestSentAt = new Date().toISOString();
for (const message of latestSends) {
  if (message.status !== "sent") continue;
  const email = String(message.email || "").trim().toLowerCase();
  if (!email) continue;
  let contact = contacts.get(email);
  if (!contact) {
    contact = {
      name: message.business || email.split("@")[0], email, source: "",
      first_sent: latestSentAt, sent_messages: 0, status: "Awaiting reply", reply: "",
      next_action: "Wait; no immediate follow up", batch: message.batch || "September 9 outreach",
      last_sent: "", thread_url: `https://mail.google.com/mail/#all/${message.thread_id || message.id || message.result?.structuredContent?.thread_id || message.result?.structuredContent?.id || ""}`,
    };
    contacts.set(email, contact);
    added++;
  }
  if (!contact.last_sent || new Date(latestSentAt) > new Date(contact.last_sent)) {
    contact.sent_messages = Number(contact.sent_messages || 0) + 1;
    contact.last_sent = latestSentAt;
    if (!contact.first_sent) contact.first_sent = latestSentAt;
    additionalMessages++;
  }
}

const immediateBounces = new Set([
  "info@eventsisters.com",
  "bookings@funweddings.ca",
  "info@creativeweddings.ca",
  "vtinfo@webeventplanner.com",
  "erin@uniqueeventsiowa.com",
  "sales@destinationweddingsmalta.com",
  "emily@ponderosaplanning.com",
  "jessica@bijouxevents.com",
  "caity@nightingaleweddingandevents.com",
  "usinfo@atlanticoneevents.com",
  "hello@popandclinkevents.com",
  "hello@modernlove.events",
  "info@luxcielevents.com",
  "832-544-0858events@theluxeparty.com",
  "homeaboutservicesinquirehello@detaileddreamsevents.com",
]);
for (const email of immediateBounces) {
  const contact = contacts.get(email);
  if (!contact) continue;
  contact.status = "Bounced";
  contact.reply = "Immediate delivery failure returned by Gmail";
  contact.next_action = "Do not resend; find a current address";
}

const immediateAutomaticReplies = new Set([
  "info@perfectplannersweddings.com",
  "eron@encoreevent.ca",
  "planning@ctweddinggroup.com",
  "hello@robinballardevents.com",
]);
for (const email of immediateAutomaticReplies) {
  const contact = contacts.get(email);
  if (!contact || contact.status === "Bounced") continue;
  contact.status = "Automatic reply";
  contact.reply = "Automatic acknowledgement received after September 9 outreach";
  contact.next_action = "Wait for a human response";
}

const explicitReplies = new Map([
  ["hello@eleventsweddings.com", {
    status: "Do not contact",
    reply: "Not interested; recipient also reported a wrong company reference and an incomplete URL in the email.",
    next_action: "Do not contact again",
  }],
  ["hello@fabdayevents.com", {
    status: "Interested",
    reply: "Interested in seeing a demo.",
    next_action: "Prepare a warm, specific demo reply for review",
  }],
  ["info@amerisierevents.com", {
    status: "Interested: more information",
    reply: "Ashley Merisier would love to see the product and learn more.",
    next_action: "Reply with the live invitation, landing page, and complimentary concept offer",
  }],
]);
for (const [email, update] of explicitReplies) {
  const contact = contacts.get(email);
  if (contact) Object.assign(contact, update);
}

for (const message of audit.incoming) {
  if (!/out of office|automatic reply|automated reply|delayed response/i.test(`${message.subject} ${message.snippet}`)) continue;
  const address = String(message.from || "").match(/[\w.%+\-]+@[\w.\-]+\.[A-Za-z]{2,}/)?.[0]?.toLowerCase();
  const domain = address?.split("@")[1];
  const contact = [...contacts.values()].find((item) => item.email.toLowerCase().split("@")[1] === domain);
  if (contact && contact.status === "Awaiting reply") {
    contact.status = "Automatic reply";
    contact.reply = String(message.snippet || "");
    contact.next_action = "Wait until the stated return date";
  }
}

const list = [...contacts.values()].sort((a, b) => a.name.localeCompare(b.name));
const statuses = Object.fromEntries([...new Set(list.map((contact) => contact.status))].sort().map((status) => [status, list.filter((contact) => contact.status === status).length]));
const current = {
  checked_at: new Date().toISOString(),
  scope: "Gmail Sent reconciled through September 9, 2026, including batches 10 through 12, immediate delivery failures and automatic acknowledgements.",
  contacts: list.length,
  sent_messages: list.reduce((sum, contact) => sum + Number(contact.sent_messages || 0), 0),
  new_businesses: Number(master.new_businesses || 0) + added,
  statuses,
  contacts_list: list,
  reconciliation: { added_contacts: added, additional_messages: additionalMessages, mailbox_sent_checked: audit.sent.length + latestSends.length, mailbox_incoming_checked: audit.incoming.length + immediateBounces.size + immediateAutomaticReplies.size },
};
fs.writeFileSync(path.join(root, "artifacts/outreach-master-current.json"), JSON.stringify(current, null, 2));
const rows = list.map((contact) => `| ${String(contact.name).replaceAll("|", "\\|")} | ${contact.email} | ${contact.status} | ${contact.sent_messages} | ${contact.last_sent || ""} |`);
fs.writeFileSync(path.join(root, "artifacts/outreach-master-current.md"), `# Outreach master list\n\nChecked ${current.checked_at}. ${current.contacts} contacts and ${current.sent_messages} sent messages.\n\n| Business | Email | Status | Sends | Last sent |\n| --- | --- | --- | ---: | --- |\n${rows.join("\n")}\n`);
console.log(JSON.stringify({ contacts: current.contacts, sent_messages: current.sent_messages, statuses, reconciliation: current.reconciliation }, null, 2));
