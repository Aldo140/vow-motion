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

const dup = async (weddingId, excludeId, audience, channel, subject) =>
  (
    await db.query(
      `SELECT id FROM messages
       WHERE wedding_id=$1 AND id<>$2 AND audience=$3 AND channel=$4 AND subject=$5
         AND status IN ('published','sent','development','partially-failed')
         AND updated_at > now() - interval '24 hours'
       LIMIT 1`,
      [weddingId, excludeId, audience, channel, subject],
    )
  ).rows.length > 0;

await db.exec(`
INSERT INTO users(id,name,email,password_hash) VALUES('u1','Owner','o@x.com','x');
INSERT INTO weddings(id,owner_id,slug,names,date,location) VALUES('w1','u1','s1','A & B','2027-06-01','Calgary');
`);

// A published reminder blocks an identical new one for the same audience/channel.
await db.exec(`
INSERT INTO messages(id,wedding_id,subject,body,audience,channel,status) VALUES('m1','w1','A little reminder','body','invited-pending','invitation','published');
INSERT INTO messages(id,wedding_id,subject,body,audience,channel,status) VALUES('m2','w1','A little reminder','body','invited-pending','invitation','draft');
`);
check(
  await dup("w1", "m2", "invited-pending", "invitation", "A little reminder"),
  "publishing an identical-subject draft is blocked while a recent match is published",
);

// Changing the subject even slightly is treated as a different, deliberate message.
check(
  !(await dup("w1", "m2", "invited-pending", "invitation", "A second reminder")),
  "a different subject is never treated as a duplicate",
);

// A different audience is a different send, not a duplicate.
check(
  !(await dup("w1", "m2", "attending", "invitation", "A little reminder")),
  "the same subject to a different audience is not a duplicate",
);

// Once the earlier one ages past the window, it stops blocking.
await db.query(`UPDATE messages SET updated_at=now()-interval '2 days' WHERE id='m1'`);
check(
  !(await dup("w1", "m2", "invited-pending", "invitation", "A little reminder")),
  "a match older than 24 hours no longer blocks a resend",
);

// A draft that was never sent does not block anything — only real sends do.
await db.exec(`
INSERT INTO messages(id,wedding_id,subject,body,audience,channel,status) VALUES('m3','w1','Another note','body','everyone','email','draft');
INSERT INTO messages(id,wedding_id,subject,body,audience,channel,status) VALUES('m4','w1','Another note','body','everyone','email','draft');
`);
check(
  !(await dup("w1", "m4", "everyone", "email", "Another note")),
  "two drafts of the same message never block each other before either is sent",
);

console.log(ok ? "\nALL CHECKS PASSED" : "\nSOME CHECKS FAILED");
process.exit(ok ? 0 : 1);
