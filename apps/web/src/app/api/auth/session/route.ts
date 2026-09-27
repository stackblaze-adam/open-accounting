import { readSession, SESSION_COOKIE } from "../../../../../../../server/pg/session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const token = request.headers.get("cookie")?.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))?.[1];
  const userId = readSession(token ? decodeURIComponent(token) : null);
  return Response.json({ isAuthenticated: Boolean(userId), userId });
}
