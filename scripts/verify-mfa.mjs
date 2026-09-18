import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";

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
`);

// 1. Enrollment: insert an unconfirmed secret, then confirm with hashed backup codes.
await db.query(
  `INSERT INTO user_mfa(user_id,secret,enabled,backup_codes,confirmed_at) VALUES($1,$2,false,'[]',NULL)`,
  ["u1", "JBSWY3DPEHPK3PXP"],
);
const hash = (v) => createHash("sha256").update(v).digest("hex");
const codes = ["AAAAA-11111", "BBBBB-22222"];
await db.query(
  `UPDATE user_mfa SET enabled=true,confirmed_at=now(),backup_codes=$1 WHERE user_id=$2`,
  [JSON.stringify(codes.map((c) => ({ hash: hash(c), used_at: null }))), "u1"],
);
check(
  (await db.query(`SELECT enabled FROM user_mfa WHERE user_id='u1'`)).rows[0].enabled,
  "MFA is enabled after confirmation",
);

// 2. Backup-code consumption via the same jsonb update the app uses — mark one
// used and confirm it, and only it, flips.
const targetHash = hash("AAAAA-11111");
await db.query(
  `UPDATE user_mfa SET backup_codes = (
     SELECT jsonb_agg(CASE WHEN elem->>'hash'=$1 THEN jsonb_set(elem,'{used_at}',to_jsonb(now()::text)) ELSE elem END)
     FROM jsonb_array_elements(backup_codes) elem
   ) WHERE user_id=$2`,
  [targetHash, "u1"],
);
const afterUse = (await db.query(`SELECT backup_codes FROM user_mfa WHERE user_id='u1'`)).rows[0].backup_codes;
check(
  afterUse.find((c) => c.hash === targetHash).used_at !== null,
  "the consumed backup code is marked used",
);
check(
  afterUse.find((c) => c.hash === hash("BBBBB-22222")).used_at === null,
  "the other backup code is untouched",
);

// 3. Login challenge lifecycle: created, attempt-limited, expires.
await db.query(
  `INSERT INTO mfa_login_challenges(id,user_id,expires_at) VALUES($1,$2,now()+interval '5 minutes')`,
  ["c1", "u1"],
);
const claim = await db.query(
  `UPDATE mfa_login_challenges SET attempts=attempts+1 WHERE id=$1 AND expires_at>now() AND attempts<5 RETURNING user_id`,
  ["c1"],
);
check(claim.rows[0]?.user_id === "u1", "a fresh login challenge can be claimed");

await db.query(`UPDATE mfa_login_challenges SET expires_at=now()-interval '1 minute' WHERE id='c1'`);
const expiredClaim = await db.query(
  `UPDATE mfa_login_challenges SET attempts=attempts+1 WHERE id=$1 AND expires_at>now() AND attempts<5 RETURNING user_id`,
  ["c1"],
);
check(expiredClaim.rows.length === 0, "an expired login challenge cannot be claimed");

// 4. Deleting the user cascades away MFA state and challenges — no orphans.
await db.query(`DELETE FROM users WHERE id='u1'`);
check((await db.query(`SELECT 1 FROM user_mfa WHERE user_id='u1'`)).rows.length === 0, "user_mfa is cleaned up by cascade");
check((await db.query(`SELECT 1 FROM mfa_login_challenges WHERE user_id='u1'`)).rows.length === 0, "mfa_login_challenges is cleaned up by cascade");

console.log(ok ? "\nALL CHECKS PASSED" : "\nSOME CHECKS FAILED");
process.exit(ok ? 0 : 1);
