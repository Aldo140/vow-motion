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
INSERT INTO users(id,name,email,password_hash) VALUES('u1','Owner','o@x.com','x');
INSERT INTO weddings(id,owner_id,slug,names,date,location) VALUES('w1','u1','s1','A & B','2027-06-01','Calgary');
INSERT INTO households(id,wedding_id,name) VALUES('h1','w1','The Smiths');
INSERT INTO photos(id,wedding_id,household_id,filename) VALUES('p1','w1','h1','photo1.webp');
`);

// 1. Scheduling deletion twice must not create a second pending row.
await db.query(
  `INSERT INTO account_deletion_requests(id,user_id,scheduled_for) VALUES($1,$2,now()+interval '14 days')`,
  ["r1", "u1"],
);
let rejected = false;
try {
  await db.query(
    `INSERT INTO account_deletion_requests(id,user_id,scheduled_for) VALUES($1,$2,now()+interval '14 days')`,
    ["r2", "u1"],
  );
} catch {
  rejected = true;
}
check(rejected, "a second pending deletion request for the same user is rejected");

// 2. The completion procedure: queue the wedding's photos, then delete in the
// documented order, inside one transaction.
await db.exec("BEGIN");
await db.query(
  `UPDATE account_deletion_requests SET status='completed',completed_at=now() WHERE id=$1 AND user_id=$2 AND status='pending'`,
  ["r1", "u1"],
);
const photos = await db.query(
  `SELECT p.filename FROM photos p JOIN weddings w ON w.id=p.wedding_id WHERE w.owner_id=$1`,
  ["u1"],
);
for (const photo of photos.rows)
  await db.query(`INSERT INTO pending_file_deletions(id,filename) VALUES($1,$2)`, [
    "pfd1",
    photo.filename,
  ]);
await db.query(`DELETE FROM weddings WHERE owner_id=$1`, ["u1"]);
await db.query(`DELETE FROM referrals WHERE user_id=$1`, ["u1"]);
await db.query(`DELETE FROM audit_log WHERE actor_id=$1`, ["u1"]);
await db.query(`DELETE FROM users WHERE id=$1`, ["u1"]);
await db.exec("COMMIT");

check(photos.rows.length === 1 && photos.rows[0].filename === "photo1.webp", "the owned wedding's photo is queued before deletion");
check((await db.query(`SELECT 1 FROM weddings WHERE id='w1'`)).rows.length === 0, "the wedding is gone after account deletion");
check((await db.query(`SELECT 1 FROM users WHERE id='u1'`)).rows.length === 0, "the user is gone after account deletion");
check((await db.query(`SELECT 1 FROM pending_file_deletions WHERE filename='photo1.webp'`)).rows.length === 1, "the photo file is queued for deletion, not silently dropped");
// account_deletion_requests.user_id has ON DELETE CASCADE, so the completed
// request row disappears with the user rather than becoming an orphan.
check((await db.query(`SELECT 1 FROM account_deletion_requests WHERE id='r1'`)).rows.length === 0, "the deletion request itself is cleaned up by the user's cascade");

console.log(ok ? "\nALL CHECKS PASSED" : "\nSOME CHECKS FAILED");
process.exit(ok ? 0 : 1);
