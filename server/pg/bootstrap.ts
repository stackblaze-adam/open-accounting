import { createCtx } from "./ctx";
import { getFunction } from "./registry";
import { findPassword, insertDoc, listDocs, runWithUser, upsertPassword, withTransaction } from "./store";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function callFunction(name: string, args: Record<string, unknown>, userId: string) {
  const fn = await getFunction(name);
  const kind = fn.isAction ? "action" : fn.isMutation ? "mutation" : "query";
  const invoke = () => {
    const ctx = createCtx(kind, (nextName, nextArgs) => callFunction(nextName, nextArgs, userId));
    return fn._handler(ctx, args);
  };
  if (kind === "mutation") return withTransaction(() => runWithUser(userId, invoke));
  return runWithUser(userId, invoke);
}

export async function ensureOwner() {
  const email = normalizeEmail(process.env.OWNER_EMAIL ?? "");
  const password = process.env.OWNER_PASSWORD ?? "";
  if (!email || !password) return { status: "skipped" as const };

  const users = await listDocs("users");
  let user = users.find((row) => typeof row.email === "string" && normalizeEmail(row.email) === email);
  if (!user) {
    const id = await insertDoc("users", { email, name: "OpenBooks Owner" });
    user = (await listDocs("users")).find((row) => row._id === id);
  }
  if (!user) return { status: "skipped" as const };

  const existingPassword = await findPassword(email);
  if (!existingPassword || existingPassword.userId !== user._id) {
    await upsertPassword(email, user._id, password);
  }

  const memberships = await listDocs("workspaceMembers");
  const already = memberships.some((row) => row.userId === user!._id && row.status === "active");
  if (already) return { status: "ready" as const, userId: user._id };

  await callFunction(
    "authAdmin:ensureOwnerWorkspace",
    { userId: user._id, email },
    user._id,
  );
  return { status: "created" as const, userId: user._id };
}
