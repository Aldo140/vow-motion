import { PGlite } from "@electric-sql/pglite";
import { Pool } from "pg";
import { readFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
export interface Database {
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<{ rows: T[] }>;
}
const globalDb = globalThis as unknown as {
  vowRaw?: Promise<Database>;
  vowQueue?: Promise<unknown>;
  vowFacade?: Database;
};
async function raw(): Promise<Database> {
  if (!globalDb.vowRaw)
    globalDb.vowRaw = (async () => {
      let connection: Database;
      if (process.env.DATABASE_URL)
        connection = new Pool({
          connectionString: process.env.DATABASE_URL,
          max: 4,
          idleTimeoutMillis: 20_000,
          connectionTimeoutMillis: 10_000,
          allowExitOnIdle: true,
        });
      else {
        if (process.env.VERCEL)
          throw new Error(
            "DATABASE_URL is required on serverless deployments.",
          );
        const dir = process.env.DATA_DIR || path.join(process.cwd(), "data");
        await mkdir(dir, { recursive: true });
        connection = new PGlite(path.join(dir, "postgres"));
      }
      const migrationClient =
        connection instanceof Pool ? await connection.connect() : connection;
      try {
        await migrationClient.query("BEGIN");
        // Transaction-scoped lock also works through hosted transaction poolers.
        if (connection instanceof Pool)
          await migrationClient.query(
            "SELECT pg_advisory_xact_lock(814702031)",
          );
        await migrationClient.query(
          "CREATE TABLE IF NOT EXISTS schema_migrations(name text PRIMARY KEY, applied_at timestamptz DEFAULT now())",
        );
        const directory = path.join(process.cwd(), "migrations");
        for (const name of (await readdir(directory))
          .filter((n) => n.endsWith(".sql"))
          .sort()) {
          if (
            (
              await migrationClient.query(
                "SELECT name FROM schema_migrations WHERE name=$1",
                [name],
              )
            ).rows.length
          )
            continue;
          // Strip `--` line comments before splitting on `;`. A comment that
          // happens to contain a semicolon otherwise cuts a statement in half
          // and the migration fails with a syntax error on the comment text.
          const sql = (
            await readFile(path.join(directory, name), "utf8")
          ).replace(/--.*$/gm, "");
          for (const statement of sql.split(";").filter((s) => s.trim()))
            await migrationClient.query(statement);
          await migrationClient.query(
            "INSERT INTO schema_migrations(name) VALUES($1)",
            [name],
          );
        }
        await migrationClient.query("COMMIT");
      } catch (error) {
        await migrationClient.query("ROLLBACK");
        throw error;
      } finally {
        if (
          "release" in migrationClient &&
          typeof migrationClient.release === "function"
        )
          migrationClient.release();
      }
      return connection;
    })().catch((error) => {
      globalDb.vowRaw = undefined;
      throw error;
    });
  return globalDb.vowRaw;
}
function serialize<T>(run: () => Promise<T>): Promise<T> {
  const result = (globalDb.vowQueue || Promise.resolve()).then(run, run);
  globalDb.vowQueue = result.catch(() => {});
  return result;
}
export async function db(): Promise<Database> {
  await raw();
  if (!globalDb.vowFacade)
    globalDb.vowFacade = {
      query: async <T extends Record<string, unknown>>(
        sql: string,
        params?: unknown[],
      ) =>
        serialize(async () => {
          const connection = await raw();
          return connection.query<T>(sql, params);
        }),
    };
  return globalDb.vowFacade;
}
// All embedded queries share one queue, so unrelated requests cannot enter a transaction.
// Remote PostgreSQL transactions additionally use a dedicated pool connection.
export async function transaction<T>(
  fn: (connection: Database) => Promise<T>,
): Promise<T> {
  return serialize(async () => {
    const base = await raw();
    const connection = base instanceof Pool ? await base.connect() : base;
    await connection.query("BEGIN");
    try {
      const result = await fn(connection);
      await connection.query("COMMIT");
      return result;
    } catch (e) {
      await connection.query("ROLLBACK");
      throw e;
    } finally {
      if ("release" in connection && typeof connection.release === "function")
        connection.release();
    }
  });
}
export async function rows<T extends Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  return (await (await db()).query<T>(sql, params)).rows;
}
