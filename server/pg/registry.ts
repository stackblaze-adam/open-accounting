import { modules } from "./modules";

export type RegisteredFn = {
  _handler: (ctx: unknown, args: unknown) => Promise<unknown>;
  isQuery?: boolean;
  isMutation?: boolean;
  isAction?: boolean;
  isPublic?: boolean;
  isInternal?: boolean;
};

const functions = new Map<string, RegisteredFn>();
let loading: Promise<void> | null = null;
const skipped: string[] = [];

export function skippedModules() {
  return skipped;
}

export async function loadFunctions() {
  if (functions.size > 0) return functions;
  if (!loading) {
    loading = (async () => {
      for (const [name, mod] of Object.entries(modules)) {
        try {
          for (const [exportName, value] of Object.entries(mod)) {
            if (!value || (typeof value !== "object" && typeof value !== "function")) continue;
            const fn = value as RegisteredFn;
            if (typeof fn._handler !== "function") continue;
            functions.set(`${name}:${exportName}`, fn);
          }
        } catch (error) {
          skipped.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      const sessionMod = modules.session;
      const viewer = sessionMod?.viewer as { _handler?: unknown } | undefined;
      console.log(
        `[pg] module keys ${Object.keys(modules).length} session exports ${sessionMod ? Object.keys(sessionMod).join(",") : "missing"} viewer handler ${typeof viewer?._handler}`,
      );
      console.log(`[pg] loaded ${functions.size} functions, skipped ${skipped.length}`);
      if (skipped.length) console.log(skipped.slice(0, 8).join("\n"));
    })();
  }
  await loading;
  return functions;
}

export async function getFunction(name: string) {
  const all = await loadFunctions();
  const fn = all.get(name);
  if (!fn) {
    throw new Error(`Unknown function ${name}`);
  }
  return fn;
}
