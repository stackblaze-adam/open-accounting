import { dispatch } from "../../../../../../../server/pg/dispatch";
import { SESSION_COOKIE, signSession } from "../../../../../../../server/pg/session";
import { findPassword, insertDoc, listDocs, upsertPassword, verifyPassword } from "../../../../../../../server/pg/store";

export const runtime = "nodejs";

function emailOf(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string; flow?: string; name?: string };
  const email = emailOf(body.email);
  const password = String(body.password ?? "");
  if (!email || !password) {
    return Response.json({ errorMessage: "Email and password are required." }, { status: 400 });
  }

  if (body.flow === "signUp") {
    if (await findPassword(email)) {
      return Response.json({ errorMessage: "An account with that email already exists." }, { status: 400 });
    }
    const userId = await insertDoc("users", {
      email,
      name: String(body.name ?? "").trim() || email,
    });
    await upsertPassword(email, userId, password);
    await dispatch("authAdmin:ensureOwnerWorkspace", { userId, email }, { internal: true, userId });
    return signedIn(userId);
  }

  const row = await findPassword(email);
  if (!row || !verifyPassword(password, row.passwordHash)) {
    const users = await listDocs("users");
    const owner = users.find((user) => String(user.email ?? "").toLowerCase() === email);
    if (!owner) {
      return Response.json({ errorMessage: "Invalid email or password." }, { status: 401 });
    }
    return Response.json({ errorMessage: "Invalid email or password." }, { status: 401 });
  }
  return signedIn(row.userId);
}

function signedIn(userId: string) {
  const response = Response.json({ ok: true });
  response.headers.append(
    "set-cookie",
    `${SESSION_COOKIE}=${signSession(userId)}; Path=/; HttpOnly; SameSite=Lax`,
  );
  return response;
}
