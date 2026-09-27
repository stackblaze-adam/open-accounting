import { dispatch, publicError } from "../../../../../../server/pg/dispatch";
import { readSession, SESSION_COOKIE } from "../../../../../../server/pg/session";
import { runWithUser } from "../../../../../../server/pg/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as { name?: string; args?: Record<string, unknown> };
  if (!body.name) {
    return Response.json({ errorMessage: "Missing function name." }, { status: 400 });
  }
  const token = request.headers.get("cookie")?.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))?.[1];
  const userId = readSession(token ? decodeURIComponent(token) : null);
  try {
    const value = await runWithUser(userId, () => dispatch(body.name!, body.args ?? {}, { userId }));
    return Response.json({ value });
  } catch (error) {
    return Response.json({ errorMessage: publicError(error) }, { status: 500 });
  }
}
