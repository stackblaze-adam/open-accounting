import crons from "../../convex/crons";
import { jsonToConvex } from "convex/values";

import { dispatch } from "./dispatch";
import { claimDueJobs, cronLastRun, finishJob, markCronRun } from "./store";

type CronRecord = {
  name: string;
  args: unknown[];
  schedule: {
    type: string;
    hours?: number;
    minutes?: number;
    seconds?: number;
    cron?: string;
  };
};

function intervalMs(schedule: CronRecord["schedule"]) {
  if (schedule.type === "interval") {
    if (schedule.hours) return schedule.hours * 60 * 60 * 1000;
    if (schedule.minutes) return schedule.minutes * 60 * 1000;
    if (schedule.seconds) return schedule.seconds * 1000;
  }
  if (schedule.type === "cron") return 60 * 60 * 1000;
  return 60 * 60 * 1000;
}

function cronArgs(raw: unknown) {
  try {
    return (jsonToConvex(raw as never) ?? {}) as Record<string, unknown>;
  } catch {
    return (raw ?? {}) as Record<string, unknown>;
  }
}

async function runCrons() {
  const table = (crons as unknown as { crons: Record<string, CronRecord> }).crons ?? {};
  const now = Date.now();
  for (const [name, job] of Object.entries(table)) {
    const last = await cronLastRun(name);
    if (now - last < intervalMs(job.schedule)) continue;
    await markCronRun(name, now);
    try {
      await dispatch(job.name, cronArgs(job.args?.[0]), { internal: true, userId: null });
    } catch (error) {
      console.error(`[pg-worker] cron ${name} failed`, error instanceof Error ? error.message : error);
    }
  }
}

async function runJobs() {
  const due = await claimDueJobs(Date.now());
  for (const job of due) {
    try {
      await dispatch(job.function_name, cronArgs(job.args), { internal: true, userId: null });
      await finishJob(job.id, "done");
    } catch (error) {
      console.error(`[pg-worker] job ${job.function_name} failed`, error instanceof Error ? error.message : error);
      await finishJob(job.id, "error");
    }
  }
}

let started = false;

export function startWorker() {
  if (started) return;
  started = true;
  console.log("[pg-worker] ticking jobs and crons");
  const tick = async () => {
    try {
      await runJobs();
      await runCrons();
    } catch (error) {
      console.error("[pg-worker]", error instanceof Error ? error.message : error);
    }
  };
  setInterval(() => void tick(), 5_000);
  void tick();
}
