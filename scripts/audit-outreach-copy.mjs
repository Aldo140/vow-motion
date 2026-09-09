import fs from "node:fs";
import path from "node:path";

const files = process.argv.slice(2);
if (!files.length) {
  console.error("Usage: node scripts/audit-outreach-copy.mjs <messages.json> [...]");
  process.exit(2);
}

const badGenericGreetings = new Set([
  "gmail team", "info team", "hello team", "contact team", "admin team", "sales team",
]);
const problems = [];

for (const input of files) {
  const file = path.resolve(input);
  const rows = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const [index, row] of rows.entries()) {
    const body = String(row.body || "");
    const detail = String(row.detail || "");
    const greeting = String(row.greeting || "").trim().toLowerCase();
    const reasons = [];
    if (/https?:\/\/|www\./i.test(body)) reasons.push("URL appears inside prose");
    if (/cite|【\d+†|\[wordlim:|\bCrawled:/i.test(body)) reasons.push("raw search metadata");
    if (badGenericGreetings.has(greeting)) reasons.push("generic mailbox used as business name");
    if (reasons.length) problems.push({ file: path.basename(file), row: index + 1, email: row.email, reasons });
  }
}

if (problems.length) {
  console.error(JSON.stringify({ valid: false, problems: problems.length, messages: problems }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ valid: true, files: files.length }, null, 2));
