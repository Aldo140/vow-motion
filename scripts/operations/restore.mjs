import { access } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const database = process.env.RESTORE_DATABASE_URL;
const input = process.argv[2] ? path.resolve(process.argv[2]) : "";
if (!database) throw new Error("RESTORE_DATABASE_URL is required. Never restore into DATABASE_URL implicitly.");
if (!input) throw new Error("Pass the .dump file as the first argument.");
await access(input);
if (process.env.RESTORE_CONFIRM !== path.basename(input)) {
  throw new Error(`Set RESTORE_CONFIRM=${path.basename(input)} to confirm this exact restore.`);
}

await new Promise((resolve, reject) => {
  const child = spawn(
    process.env.PG_RESTORE_BIN || "pg_restore",
    ["--clean", "--if-exists", "--no-owner", "--no-privileges", "--dbname", database, input],
    { stdio: "inherit", windowsHide: true },
  );
  child.on("error", reject);
  child.on("exit", (code) =>
    code === 0 ? resolve() : reject(new Error(`pg_restore exited with ${code}`)),
  );
});
console.log(JSON.stringify({ ok: true, restored: input }, null, 2));
