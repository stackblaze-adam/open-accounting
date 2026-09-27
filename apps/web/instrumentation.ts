export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  if (process.env.NEXT_PUBLIC_OPENBOOKS_BACKEND !== "postgres") return;
  const { startWorker } = await import("../../server/pg/worker");
  console.log("[pg] job worker started");
  startWorker();
}
