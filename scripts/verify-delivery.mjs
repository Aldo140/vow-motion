import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
const db = new PGlite();
const dir = new URL("../migrations/", import.meta.url);
for (const n of (await readdir(dir)).filter(f=>f.endsWith(".sql")).sort())
  await db.exec(await readFile(new URL(n, dir), "utf8"));
let ok = true;
const check = (c,m) => { if(!c){ok=false;console.log("FAIL:",m);} else console.log("pass:",m); };

await db.exec(`
INSERT INTO users(id,name,email,password_hash) VALUES('u1','Owner','o@x.com','x');
INSERT INTO weddings(id,owner_id,slug,names,date,location) VALUES('w1','u1','s1','A & B','2027-06-01','Calgary');
INSERT INTO guests(id,wedding_id,name,email,consent) VALUES('g1','w1','A','a@x.com',true);
INSERT INTO guests(id,wedding_id,name,email,consent) VALUES('g2','w1','B','b@x.com',true);
INSERT INTO messages(id,wedding_id,channel,audience,subject,body,status) VALUES('m1','w1','email','everyone','S','B','sent');
INSERT INTO deliveries(id,wedding_id,message_id,guest_id,status,provider_id) VALUES('d1','w1','m1','g1','sent','re_1');
INSERT INTO deliveries(id,wedding_id,message_id,guest_id,status,provider_id) VALUES('d2','w1','m1','g2','sent','re_2');
`);

// 1. Hard bounce withdraws consent permanently.
await db.query(`UPDATE deliveries SET status=$1,bounce_type=$2,next_attempt_at=NULL,updated_at=now() WHERE id=$3`,["bounced","Permanent/General","d1"]);
await db.query(`UPDATE guests SET consent=false, unsubscribed_at=COALESCE(unsubscribed_at,now()), suppressed_reason=$2 WHERE id=(SELECT guest_id FROM deliveries WHERE id=$1)`,["d1","hard-bounce"]);
let g1 = (await db.query(`SELECT consent,unsubscribed_at,suppressed_reason FROM guests WHERE id='g1'`)).rows[0];
check(g1.consent===false && g1.unsubscribed_at && g1.suppressed_reason==="hard-bounce", "hard bounce withdraws consent and records why");

// 2. A couple re-saving that guest with consent=true must NOT resurrect it.
await db.query(`UPDATE guests SET name=$1,email=$2,phone=$3,address=$4,language=$5,tags=$6,notes=$7,consent=($8 AND unsubscribed_at IS NULL) WHERE id=$9 AND wedding_id=$10`,["A","a@x.com","","","en","","",true,"g1","w1"]);
check((await db.query(`SELECT consent FROM guests WHERE id='g1'`)).rows[0].consent===false, "re-import does not resurrect a withdrawn consent");

// 3. A guest who never unsubscribed can still be given consent.
await db.query(`UPDATE guests SET email=$1,phone=$2,address=$3,consent=($4 AND unsubscribed_at IS NULL) WHERE id=$5`,["b@x.com","","",true,"g2"]);
check((await db.query(`SELECT consent FROM guests WHERE id='g2'`)).rows[0].consent===true, "an un-unsubscribed guest can still opt in");

// 4. Unsubscribe route's own write.
await db.query(`UPDATE guests SET consent=false, unsubscribed_at=now(), suppressed_reason=COALESCE(suppressed_reason,'unsubscribed') WHERE id=$1`,["g2"]);
check((await db.query(`SELECT consent,suppressed_reason FROM guests WHERE id='g2'`)).rows[0].suppressed_reason==="unsubscribed","one-click unsubscribe writes consent=false + reason");

// 5. Worker picks up a due retry, and not one that is not due / out of budget.
await db.exec(`UPDATE messages SET status='partially-failed' WHERE id='m1';
UPDATE deliveries SET status='failed', attempts=1, next_attempt_at=now() - interval '1 minute' WHERE id='d1';
UPDATE deliveries SET status='failed', attempts=3, next_attempt_at=now() - interval '1 minute' WHERE id='d2';`);
const q = `SELECT DISTINCT m.id FROM messages m JOIN weddings w ON w.id=m.wedding_id JOIN users u ON u.id=w.owner_id
  LEFT JOIN deliveries d ON d.message_id=m.id
  WHERE (m.status='draft' AND m.scheduled_at<=now())
     OR (m.status IN ('failed','partially-failed') AND d.status='failed' AND d.attempts < $1 AND d.next_attempt_at IS NOT NULL AND d.next_attempt_at<=now())
     OR (m.status='processing' AND m.updated_at < now() - interval '15 minutes') LIMIT 25`;
check((await db.query(q,[3])).rows.length===1, "worker picks up a message with a due retry under budget");
await db.query(`UPDATE deliveries SET attempts=3 WHERE id='d1'`);
check((await db.query(q,[3])).rows.length===0, "worker ignores a message whose retries are exhausted");
await db.exec(`UPDATE deliveries SET attempts=1, next_attempt_at=now() + interval '30 minutes' WHERE id='d1'`);
check((await db.query(q,[3])).rows.length===0, "worker ignores a retry whose backoff has not elapsed");

// 6. Stalled 'processing' message is reclaimed.
await db.exec(`UPDATE messages SET status='processing', updated_at=now() - interval '20 minutes' WHERE id='m1'`);
check((await db.query(q,[3])).rows.length===1, "worker reclaims a send stalled in 'processing'");
await db.exec(`UPDATE messages SET status='processing', updated_at=now() WHERE id='m1'`);
check((await db.query(q,[3])).rows.length===0, "worker leaves a send that is genuinely in flight alone");

console.log(ok ? "\nALL CHECKS PASSED" : "\nSOME CHECKS FAILED");
process.exit(ok?0:1);
