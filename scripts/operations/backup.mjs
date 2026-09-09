import { mkdir, stat } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const database = process.env.DATABASE_URL;
if (!database) throw new Error("DATABASE_URL is required.");
const directory = path.resolve(process.env.BACKUP_DIR || "artifacts/backups");
await mkdir(directory, { recursive: true });
const stamp = new Date().toISOString().replaceAll(":", "-");
const output = path.join(directory, `vow-motion-${stamp}.dump`);

await new Promise((resolve, reject) => {
  const child = spawn(
    process.env.PG_DUMP_BIN || "pg_dump",
    ["--format=custom", "--no-owner", "--no-privileges", "--file", output, database],
    { stdio: "inherit", windowsHide: true },
  );
  child.on("error", reject);
  child.on("exit", (code) =>
    code === 0 ? resolve() : reject(new Error(`pg_dump exited with ${code}`)),
  );
});

const bytes = (await stat(output)).size;
if (!bytes) throw new Error("Backup was created but is empty.");
console.log(JSON.stringify({ ok: true, output, bytes }, null, 2));
