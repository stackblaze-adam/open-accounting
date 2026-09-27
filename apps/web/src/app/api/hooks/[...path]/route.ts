import http from "../../../../../../../convex/http";
import { createCtx } from "../../../../../../../server/pg/ctx";
import { dispatch } from "../../../../../../../server/pg/dispatch";
import { readSession, SESSION_COOKIE } from "../../../../../../../server/pg/session";
import { runWithUser } from "../../../../../../../server/pg/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HttpHandler = { _handler?: (ctx: unknown, request: Request) => Promise<Response> };

async function handle(request: Request, path: string) {
  const router = http as unknown as {
    exactRoutes: Map<string, Map<string, HttpHandler>>;
    prefixRoutes: Map<string, Map<string, HttpHandler>>;
  };
  const method = request.method === "HEAD" ? "GET" : request.method;
  const exact = router.exactRoutes.get(path)?.get(method);
  let handler = exact;
  if (!handler) {
    const prefixes = router.prefixRoutes.get(method);
    if (prefixes) {
      for (const [prefix, candidate] of prefixes) {
        if (path.startsWith(prefix)) {
          handler = candidate;
          break;
        }
      }
    }
  }
  if (!handler?._handler) {
    return Response.json({ errorMessage: "Not found" }, { status: 404 });
  }
  const token = request.headers.get("cookie")?.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))?.[1];
  const userId = readSession(token ? decodeURIComponent(token) : null);
  const ctx = createCtx("action", (name, args, options) =>
    dispatch(name, args, { ...options, userId }),
  );
  return runWithUser(userId, () => handler!._handler!(ctx, request));
}

export async function GET(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return handle(request, `/${path.join("/")}`);
}

export async function POST(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return handle(request, `/${path.join("/")}`);
}

export async function OPTIONS(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return handle(request, `/${path.join("/")}`);
}
