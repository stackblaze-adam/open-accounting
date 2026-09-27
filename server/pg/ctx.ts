import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { getFunctionName } from "convex/server";

import { cosineSearch, createDatabase } from "./query";
import { currentUserId, dataDir, enqueueJob, getDoc } from "./store";

function storageDir() {
  return path.join(dataDir(), "storage");
}

function functionLabel(reference: unknown) {
  if (typeof reference === "string") return reference;
  try {
    return getFunctionName(reference as never);
  } catch {
    const named = (reference as { [key: symbol]: string })?.[Symbol.for("functionName")];
    if (named) return named;
    throw new Error("Not a Convex function reference.");
  }
}

async function identity() {
  const userId = currentUserId();
  if (!userId) return null;
  const user = await getDoc(userId);
  return {
    subject: `${userId}|local`,
    tokenIdentifier: `local|${userId}`,
    issuer: process.env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3100",
    email: typeof user?.email === "string" ? user.email : undefined,
    name: typeof user?.name === "string" ? user.name : undefined,
  };
}

export type DispatchFn = (
  name: string,
  args: Record<string, unknown>,
  options?: { internal?: boolean },
) => Promise<unknown>;

export function createCtx(kind: "query" | "mutation" | "action", dispatch: DispatchFn) {
  const db = createDatabase();
  const auth = { getUserIdentity: identity };
  const scheduler = {
    runAfter: async (delayMs: number, reference: unknown, args?: Record<string, unknown>) =>
      enqueueJob(functionLabel(reference), args ?? {}, Date.now() + delayMs),
    runAt: async (at: number | Date, reference: unknown, args?: Record<string, unknown>) => {
      const when = at instanceof Date ? at.getTime() : at;
      return enqueueJob(functionLabel(reference), args ?? {}, when);
    },
  };
  const storage = {
    store: async (blob: Blob) => {
      const id = (await import("./store")).newId();
      await mkdir(storageDir(), { recursive: true });
      await writeFile(path.join(storageDir(), id), Buffer.from(await blob.arrayBuffer()));
      return id;
    },
    get: async (id: string) => {
      const bytes = await readFile(path.join(storageDir(), id));
      return new Blob([bytes]);
    },
    getUrl: async (id: string) => {
      const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3100";
      return `${base}/api/storage/${id}`;
    },
    delete: async (id: string) => {
      const { unlink } = await import("node:fs/promises");
      await unlink(path.join(storageDir(), id)).catch(() => undefined);
    },
  };
  const runQuery = (reference: unknown, args?: Record<string, unknown>) =>
    dispatch(functionLabel(reference), args ?? {}, { internal: true });
  const runMutation = (reference: unknown, args?: Record<string, unknown>) =>
    dispatch(functionLabel(reference), args ?? {}, { internal: true });
  const runAction = (reference: unknown, args?: Record<string, unknown>) =>
    dispatch(functionLabel(reference), args ?? {}, { internal: true });
  const vectorSearch = (
    tableName: string,
    _index: string,
    options: { vector: number[]; limit?: number; filter?: (q: never) => never },
  ) => cosineSearch(tableName, options.vector, options.filter as never, options.limit ?? 10);

  if (kind === "action") {
    return { auth, scheduler, storage, runQuery, runMutation, runAction, vectorSearch };
  }
  return { db, auth, scheduler, storage, runQuery, runMutation, runAction, vectorSearch };
}
