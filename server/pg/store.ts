import { AsyncLocalStorage } from "node:async_hooks";
import path from "node:path";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { asc, eq } from "drizzle-orm";
import { Pool, type PoolClient } from "pg";

import { cronState, documents, jobs, passwords } from "./schema";

export type Doc = Record<string, unknown> & { _id: string; _creationTime: number };

type Scope = {
  client?: PoolClient;
  userId: string | null;
  cache: Map<string, Doc[]>;
};

const als = new AsyncLocalStorage<Scope>();

let pool: Pool | null = null;
let db: NodePgDatabase | null = null;

export function dataDir() {
  return process.env.OPENBOOKS_DATA_DIR ?? path.resolve(process.cwd(), "data");
}

export function databaseUrl() {
  return process.env.DATABASE_URL ?? "postgres://openbooks:openbooks@127.0.0.1:5432/openbooks";
}

export function getPool() {
  if (!pool) {
    pool = new Pool({ connectionString: databaseUrl() });
  }
  return pool;
}

export function getDb() {
  if (!db) {
    db = drizzle(getPool());
  }
  return db;
}

function databaseFor(client: PoolClient | undefined) {
  return client ? drizzle(client) : getDb();
}

export async function migrate() {
  const client = await getPool().connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id text PRIMARY KEY,
        table_name text NOT NULL,
        data jsonb NOT NULL,
        creation_time double precision NOT NULL
      );
      CREATE INDEX IF NOT EXISTS documents_table_creation_idx
        ON documents (table_name, creation_time);
      CREATE TABLE IF NOT EXISTS jobs (
        id text PRIMARY KEY,
        function_name text NOT NULL,
        args jsonb NOT NULL,
        run_at double precision NOT NULL,
        status text NOT NULL
      );
      CREATE TABLE IF NOT EXISTS passwords (
        email text PRIMARY KEY,
        user_id text NOT NULL,
        password_hash text NOT NULL
      );
      CREATE TABLE IF NOT EXISTS cron_state (
        name text PRIMARY KEY,
        last_run double precision NOT NULL
      );
    `);
    await client.query("CREATE EXTENSION IF NOT EXISTS vector").catch(() => undefined);
  } finally {
    client.release();
  }
}

export function currentUserId() {
  return als.getStore()?.userId ?? null;
}

export function runWithUser<T>(userId: string | null, fn: () => Promise<T>) {
  const existing = als.getStore();
  if (existing) {
    return als.run({ ...existing, userId }, fn);
  }
  return als.run({ client: undefined as unknown as PoolClient, userId, cache: new Map() }, fn);
}

export async function withTransaction<T>(fn: () => Promise<T>): Promise<T> {
  const existing = als.getStore();
  if (existing?.client) return fn();
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await als.run(
      { client, userId: existing?.userId ?? null, cache: new Map() },
      fn,
    );
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function queryRows(tableName: string): Promise<Doc[]> {
  const scope = als.getStore();
  const cached = scope?.cache.get(tableName);
  if (cached) return cached;
  const database = databaseFor(scope?.client);
  const rows = await database
    .select()
    .from(documents)
    .where(eq(documents.tableName, tableName))
    .orderBy(asc(documents.creationTime));
  const docs = rows.map((row) => row.data as Doc);
  scope?.cache.set(tableName, docs);
  return docs;
}

function invalidate(tableName: string) {
  als.getStore()?.cache.delete(tableName);
}

export async function listDocs(tableName: string) {
  return queryRows(tableName);
}

export async function getDoc(id: string): Promise<Doc | null> {
  const scope = als.getStore();
  if (scope) {
    for (const docs of scope.cache.values()) {
      const found = docs.find((doc) => doc._id === id);
      if (found) return found;
    }
  }
  const database = databaseFor(scope?.client);
  const rows = await database.select().from(documents).where(eq(documents.id, id)).limit(1);
  return (rows[0]?.data as Doc | undefined) ?? null;
}

export function newId() {
  return randomBytes(16).toString("hex");
}

export async function insertDoc(tableName: string, value: Record<string, unknown>) {
  const _id = typeof value._id === "string" ? value._id : newId();
  const _creationTime = typeof value._creationTime === "number" ? value._creationTime : Date.now();
  const data = { ...value, _id, _creationTime } as Doc;
  const database = databaseFor(als.getStore()?.client);
  await database.insert(documents).values({
    id: _id,
    tableName,
    data,
    creationTime: _creationTime,
  });
  invalidate(tableName);
  return _id;
}

export async function patchDoc(id: string, patch: Record<string, unknown>) {
  const current = await getDoc(id);
  if (!current) throw new Error(`Document not found: ${id}`);
  const tableName = await tableForId(id);
  const next: Doc = { ...current };
  for (const [key, value] of Object.entries(patch)) {
    if (key === "_id" || key === "_creationTime") continue;
    if (value === undefined) delete next[key];
    else next[key] = value;
  }
  const database = databaseFor(als.getStore()?.client);
  await database
    .update(documents)
    .set({ data: next })
    .where(eq(documents.id, id));
  invalidate(tableName);
  return next;
}

export async function replaceDoc(id: string, value: Record<string, unknown>) {
  const current = await getDoc(id);
  if (!current) throw new Error(`Document not found: ${id}`);
  const tableName = await tableForId(id);
  const next = { ...value, _id: current._id, _creationTime: current._creationTime } as Doc;
  const database = databaseFor(als.getStore()?.client);
  await database.update(documents).set({ data: next }).where(eq(documents.id, id));
  invalidate(tableName);
}

export async function deleteDoc(id: string) {
  const tableName = await tableForId(id);
  const database = databaseFor(als.getStore()?.client);
  await database.delete(documents).where(eq(documents.id, id));
  invalidate(tableName);
}

async function tableForId(id: string) {
  const scope = als.getStore();
  const database = databaseFor(scope?.client);
  const rows = await database
    .select({ tableName: documents.tableName })
    .from(documents)
    .where(eq(documents.id, id))
    .limit(1);
  if (!rows[0]) throw new Error(`Document not found: ${id}`);
  return rows[0].tableName;
}

export async function clearTable(tableName: string) {
  const database = databaseFor(als.getStore()?.client);
  await database.delete(documents).where(eq(documents.tableName, tableName));
  invalidate(tableName);
}

export async function clearAllDocuments() {
  const database = getDb();
  await database.delete(documents);
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const actual = scryptSync(password, salt, 32);
  const expected = Buffer.from(hash, "hex");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export async function upsertPassword(email: string, userId: string, password: string) {
  const passwordHash = hashPassword(password);
  const database = getDb();
  const existing = await database.select().from(passwords).where(eq(passwords.email, email)).limit(1);
  if (existing[0]) {
    await database.update(passwords).set({ userId, passwordHash }).where(eq(passwords.email, email));
  } else {
    await database.insert(passwords).values({ email, userId, passwordHash });
  }
}

export async function findPassword(email: string) {
  const rows = await getDb().select().from(passwords).where(eq(passwords.email, email)).limit(1);
  return rows[0] ?? null;
}

export async function enqueueJob(functionName: string, args: unknown, runAt: number) {
  const id = newId();
  await getDb().insert(jobs).values({
    id,
    functionName,
    args: args ?? {},
    runAt,
    status: "pending",
  });
  return id;
}

export async function claimDueJobs(now: number) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `UPDATE jobs SET status = 'running'
       WHERE id IN (
         SELECT id FROM jobs WHERE status = 'pending' AND run_at <= $1
         ORDER BY run_at ASC LIMIT 5 FOR UPDATE SKIP LOCKED
       )
       RETURNING id, function_name, args`,
      [now],
    );
    await client.query("COMMIT");
    return result.rows as Array<{ id: string; function_name: string; args: unknown }>;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function finishJob(id: string, status: "done" | "error") {
  await getDb().update(jobs).set({ status }).where(eq(jobs.id, id));
}

export async function cronLastRun(name: string) {
  const rows = await getDb().select().from(cronState).where(eq(cronState.name, name)).limit(1);
  return rows[0]?.lastRun ?? 0;
}

export async function markCronRun(name: string, at: number) {
  const existing = await getDb().select().from(cronState).where(eq(cronState.name, name)).limit(1);
  if (existing[0]) {
    await getDb().update(cronState).set({ lastRun: at }).where(eq(cronState.name, name));
  } else {
    await getDb().insert(cronState).values({ name, lastRun: at });
  }
}

export async function countDocuments() {
  const rows = await getDb().select({ id: documents.id }).from(documents);
  return rows.length;
}
