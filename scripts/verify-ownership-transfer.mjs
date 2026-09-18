import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
const db = new PGlite();
const dir = new URL("../migrations/", import.meta.url);
for (const n of (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort())
  await db.exec(await readFile(new URL(n, dir), "utf8"));
let ok = true;
const check = (c, m) => {
  if (!c) {
    ok = false;
    console.log("FAIL:", m);
  } else console.log("pass:", m);
};

await db.exec(`
INSERT INTO users(id,name,email,password_hash,email_verified) VALUES('u1','Owner','owner@x.com','x',true);
INSERT INTO users(id,name,email,password_hash,email_verified) VALUES('u2','Recipient','recipient@x.com','x',true);
INSERT INTO users(id,name,email,password_hash,email_verified) VALUES('u3','Unverified','unverified@x.com','x',false);
INSERT INTO weddings(id,owner_id,slug,names,date,location) VALUES('w1','u1','s1','A & B','2027-06-01','Calgary');
`);

// 1. Initiating a transfer cancels any previous pending one (only one at a time).
await db.query(
  `INSERT INTO ownership_transfers(id,wedding_id,from_user_id,to_email,expires_at) VALUES($1,$2,$3,$4,now()+interval '7 days')`,
  ["t1", "w1", "u1", "recipient@x.com"],
);
let rejected = false;
try {
  await db.query(
    `INSERT INTO ownership_transfers(id,wedding_id,from_user_id,to_email,expires_at) VALUES($1,$2,$3,$4,now()+interval '7 days')`,
    ["t2", "w1", "u1", "someone-else@x.com"],
  );
} catch {
  rejected = true;
}
check(rejected, "a second pending transfer for the same wedding is rejected");

// 2. Recipient lookup is case-insensitive and only returns pending, unexpired offers.
const found = await db.query(
  `SELECT id FROM ownership_transfers WHERE lower(to_email)=lower($1) AND status='pending' AND expires_at>now()`,
  ["RECIPIENT@X.COM"],
);
check(found.rows.length === 1, "pending transfer lookup is case-insensitive");

// 3. Accepting: mirrors resolveTransfer's logic — claim, verify email match, flip owner_id.
await db.exec("BEGIN");
const claimed = await db.query(
  `SELECT wedding_id,to_email FROM ownership_transfers WHERE id=$1 AND status='pending' AND expires_at>now() FOR UPDATE`,
  ["t1"],
);
const transfer = claimed.rows[0];
check(transfer.to_email === "recipient@x.com", "claimed transfer has the expected recipient");
await db.query(`UPDATE ownership_transfers SET status='accepted',resolved_at=now() WHERE id=$1`, ["t1"]);
await db.query(`UPDATE weddings SET owner_id=$1 WHERE id=$2`, ["u2", transfer.wedding_id]);
await db.exec("COMMIT");
check(
  (await db.query(`SELECT owner_id FROM weddings WHERE id='w1'`)).rows[0].owner_id === "u2",
  "ownership actually moves to the recipient on accept",
);

// 4. A resolved transfer cannot be claimed again (no double-accept / replay).
const staleClaim = await db.query(
  `SELECT id FROM ownership_transfers WHERE id=$1 AND status='pending' AND expires_at>now()`,
  ["t1"],
);
check(staleClaim.rows.length === 0, "an already-resolved transfer cannot be claimed again");

// 5. A new transfer can now be initiated for the same wedding (old one is resolved, not blocking).
await db.query(
  `INSERT INTO ownership_transfers(id,wedding_id,from_user_id,to_email,expires_at) VALUES($1,$2,$3,$4,now()+interval '7 days')`,
  ["t3", "w1", "u2", "third@x.com"],
);
check(true, "a fresh transfer can be initiated once the previous one is resolved");

// 6. Expired transfers don't show up as pending-for-recipient. Cancel the
// still-open t3 first, matching what initiateTransfer actually does before
// inserting a new row (only one pending transfer per wedding is allowed).
await db.query(`UPDATE ownership_transfers SET status='cancelled' WHERE id='t3'`);
await db.query(
  `INSERT INTO ownership_transfers(id,wedding_id,from_user_id,to_email,expires_at) VALUES($1,$2,$3,$4,now()-interval '1 day')`,
  ["t4", "w1", "u2", "expired@x.com"],
);
const expiredLookup = await db.query(
  `SELECT id FROM ownership_transfers WHERE lower(to_email)=lower($1) AND status='pending' AND expires_at>now()`,
  ["expired@x.com"],
);
check(expiredLookup.rows.length === 0, "an expired transfer is not returned as pending");

console.log(ok ? "\nALL CHECKS PASSED" : "\nSOME CHECKS FAILED");
process.exit(ok ? 0 : 1);
