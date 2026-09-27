import { dispatch } from "./dispatch";
import { loadFunctions, skippedModules } from "./registry";

async function main() {
  const fns = await loadFunctions();
  console.log("FUNCTIONS", fns.size);
  console.log("SKIPPED", skippedModules().length);
  for (const line of skippedModules()) console.log("SKIP", line);
  console.log("HAS_AUTH_ADMIN", [...fns.keys()].filter((name) => name.startsWith("authAdmin")).join(","));
  const viewer = await dispatch("session:viewer", {}, { userId: null });
  console.log("VIEWER", JSON.stringify(viewer).slice(0, 1200));
  console.log("SKIPPED", skippedModules().length);
  for (const line of skippedModules().slice(0, 20)) console.log(line);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
