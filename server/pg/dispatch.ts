import { ConvexError } from "convex/values";

import { createCtx } from "./ctx";
import { getFunction, loadFunctions } from "./registry";
import { currentUserId, migrate, runWithUser, withTransaction } from "./store";
import { ensureOwner } from "./bootstrap";

let ready: Promise<void> | null = null;

export function publicError(error: unknown) {
  if (error instanceof ConvexError) {
    const data = error.data;
    return typeof data === "string" ? data : error.message;
  }
  return error instanceof Error ? error.message : String(error);
}

async function ensureReady() {
  if (!ready) {
    ready = (async () => {
      await migrate();
      await loadFunctions();
      await ensureOwner();
    })();
  }
  await ready;
  const { startWorker } = await import("./worker");
  startWorker();
}

export async function dispatch(
  name: string,
  args: Record<string, unknown> = {},
  options?: { internal?: boolean; userId?: string | null },
) {
  await ensureReady();
  const fn = await getFunction(name);
  if (!options?.internal && fn.isInternal) {
    throw new Error(`${name} is internal.`);
  }
  const userId = options?.userId === undefined ? currentUserId() : options.userId;
  const kind = fn.isAction ? "action" : fn.isMutation ? "mutation" : "query";
  const invoke = () => {
    const ctx = createCtx(kind, (nextName, nextArgs, nextOptions) =>
      dispatch(nextName, nextArgs, { ...nextOptions, userId }),
    );
    return fn._handler(ctx, args ?? {});
  };
  if (kind === "mutation") {
    return withTransaction(() => runWithUser(userId, invoke));
  }
  return runWithUser(userId, invoke);
}
