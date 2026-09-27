import { readFile } from "node:fs/promises";
import path from "node:path";

import { dataDir } from "../../../../../../../server/pg/store";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[a-zA-Z0-9]+$/.test(id)) {
    return new Response("Not found", { status: 404 });
  }
  try {
    const bytes = await readFile(path.join(dataDir(), "storage", id));
    return new Response(bytes);
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
