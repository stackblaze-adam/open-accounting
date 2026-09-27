import { doublePrecision, index, jsonb, pgTable, text } from "drizzle-orm/pg-core";

/**
 * Convex tables from convex/schema.ts (plus Convex Auth tables) are stored as
 * documents. Each row is one Convex document: `table_name` is the Convex table,
 * `id` is the document `_id`, and `data` is the full document including system
 * fields. Handlers keep their Convex query/mutation code and talk to this store.
 */
export const documents = pgTable(
  "documents",
  {
    id: text("id").primaryKey(),
    tableName: text("table_name").notNull(),
    data: jsonb("data").notNull(),
    creationTime: doublePrecision("creation_time").notNull(),
  },
  (table) => [index("documents_table_creation_idx").on(table.tableName, table.creationTime)],
);

export const jobs = pgTable("jobs", {
  id: text("id").primaryKey(),
  functionName: text("function_name").notNull(),
  args: jsonb("args").notNull(),
  runAt: doublePrecision("run_at").notNull(),
  status: text("status").notNull(),
});

export const passwords = pgTable("passwords", {
  email: text("email").primaryKey(),
  userId: text("user_id").notNull(),
  passwordHash: text("password_hash").notNull(),
});

export const cronState = pgTable("cron_state", {
  name: text("name").primaryKey(),
  lastRun: doublePrecision("last_run").notNull(),
});
