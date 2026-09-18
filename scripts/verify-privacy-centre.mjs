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
INSERT INTO weddings(id,owner_id,slug,names,date,location,settings) VALUES('w1','u1','s1','A & B','2027-06-01','Calgary','{"finder":{"map":"blob:weddings/w1/map.jpg"}}');
INSERT INTO households(id,wedding_id,name) VALUES('h1','w1','The Smiths');
INSERT INTO photos(id,wedding_id,household_id,filename) VALUES('p1','w1','h1','photo1.webp');
INSERT INTO design_assets(id,wedding_id,filename,original_filename,name,digest,width,height,bytes) VALUES('d1','w1','design1.webp','design1-source.webp','Invitation front','abc',100,100,1000);
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
const designs = await db.query(
  `SELECT d.filename, d.original_filename FROM design_assets d JOIN weddings w ON w.id=d.wedding_id WHERE w.owner_id=$1`,
  ["u1"],
);
for (const design of designs.rows) {
  await db.query(`INSERT INTO pending_file_deletions(id,filename) VALUES($1,$2)`, [
    "pfd-design-1",
    design.filename,
  ]);
  await db.query(`INSERT INTO pending_file_deletions(id,filename) VALUES($1,$2)`, [
    "pfd-design-2",
    design.original_filename,
  ]);
}
const finderMaps = await db.query(
  `SELECT settings->'finder'->>'map' AS map FROM weddings WHERE owner_id=$1 AND settings->'finder'->>'map' IS NOT NULL`,
  ["u1"],
);
for (const finder of finderMaps.rows)
  await db.query(
    `INSERT INTO pending_file_deletions(id,filename,reason) VALUES($1,$2,'finder_map')`,
    ["pfd-finder", finder.map],
  );
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
check(
  (await db.query(`SELECT 1 FROM pending_file_deletions WHERE filename='design1.webp'`)).rows.length === 1 &&
    (await db.query(`SELECT 1 FROM pending_file_deletions WHERE filename='design1-source.webp'`)).rows.length === 1,
  "both the display and source design-asset files are queued for deletion",
);
check(
  (await db.query(`SELECT 1 FROM pending_file_deletions WHERE filename='blob:weddings/w1/map.jpg' AND reason='finder_map'`)).rows.length === 1,
  "the wedding's public finder map is queued for deletion with reason='finder_map'",
);

// 3. Contact enquiries have no account link, so a fixed-age retention purge is
// the only mechanism that keeps them from being kept forever.
await db.exec(`
INSERT INTO contact_enquiries(id,digest,role,name,email,message,created_at) VALUES('ce-old','d1','couple','Old Enquirer','old@x.com','hello','2020-01-01');
INSERT INTO contact_enquiries(id,digest,role,name,email,message,created_at) VALUES('ce-new','d2','couple','New Enquirer','new@x.com','hello',now());
`);
await db.query(`DELETE FROM contact_enquiries WHERE created_at < now() - interval '2 years'`);
check(
  (await db.query(`SELECT 1 FROM contact_enquiries WHERE id='ce-old'`)).rows.length === 0,
  "a contact enquiry older than the retention window is purged",
);
check(
  (await db.query(`SELECT 1 FROM contact_enquiries WHERE id='ce-new'`)).rows.length === 1,
  "a recent contact enquiry is kept",
);

console.log(ok ? "\nALL CHECKS PASSED" : "\nSOME CHECKS FAILED");
process.exit(ok ? 0 : 1);
