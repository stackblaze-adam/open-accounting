import { SESSION_COOKIE } from "../../../../../../../server/pg/session";

export const runtime = "nodejs";

export async function POST() {
  const response = Response.json({ ok: true });
  response.headers.append("set-cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`);
  return response;
}
