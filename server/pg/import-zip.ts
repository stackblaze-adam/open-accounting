import { execFileSync } from "node:child_process";

import { migrate, clearAllDocuments, insertDoc } from "./store";

export async function importConvexZip(zipPath: string) {
  await migrate();
  await clearAllDocuments();
  const listing = execFileSync("unzip", ["-Z1", zipPath], { encoding: "utf8" });
  let imported = 0;
  for (const entry of listing.split("\n")) {
    if (!entry.endsWith("/documents.jsonl")) continue;
    if (entry.startsWith("_")) continue;
    const tableName = entry.slice(0, entry.indexOf("/"));
    if (!tableName || tableName.includes("/")) continue;
    const body = execFileSync("unzip", ["-p", zipPath, entry], { encoding: "utf8" });
    for (const line of body.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const doc = JSON.parse(trimmed) as Record<string, unknown>;
      if (typeof doc._id !== "string") continue;
      await insertDoc(tableName, doc);
      imported += 1;
    }
  }
  return { imported };
}
