import { deleteDoc, getDoc, getPool, insertDoc, listDocs, patchDoc, replaceDoc, type Doc } from "./store";

type Cmp = "eq" | "neq" | "gt" | "gte" | "lt" | "lte";

type Expr =
  | { op: Cmp; field: string; value: unknown }
  | { op: "and" | "or"; exprs: Expr[] }
  | { op: "not"; expr: Expr };

function same(left: unknown, right: unknown) {
  if (typeof left === "number" && typeof right === "number" && Number.isNaN(left) && Number.isNaN(right)) {
    return true;
  }
  return left === right;
}

function compare(left: unknown, right: unknown) {
  if (typeof left === "number" && typeof right === "number") return left - right;
  return String(left ?? "").localeCompare(String(right ?? ""));
}

export function matchExpr(doc: Doc, expr: Expr): boolean {
  if (expr.op === "and") return expr.exprs.every((item) => matchExpr(doc, item));
  if (expr.op === "or") return expr.exprs.some((item) => matchExpr(doc, item));
  if (expr.op === "not") return !matchExpr(doc, expr.expr);
  const left = doc[expr.field];
  if (expr.op === "eq") return same(left, expr.value);
  if (expr.op === "neq") return !same(left, expr.value);
  const delta = compare(left, expr.value);
  if (expr.op === "gt") return delta > 0;
  if (expr.op === "gte") return delta >= 0;
  if (expr.op === "lt") return delta < 0;
  return delta <= 0;
}

function fieldOf(value: unknown) {
  if (value && typeof value === "object" && "__field" in value) {
    return String((value as { __field: string }).__field);
  }
  throw new Error("Convex filter expected q.field(name) on the left side.");
}

function filterBuilder() {
  const cmp = (op: Cmp) => (left: unknown, right: unknown) =>
    ({ op, field: fieldOf(left), value: right }) as Expr;
  return {
    field(name: string) {
      return { __field: name };
    },
    eq: cmp("eq"),
    neq: cmp("neq"),
    gt: cmp("gt"),
    gte: cmp("gte"),
    lt: cmp("lt"),
    lte: cmp("lte"),
    and(...exprs: Expr[]) {
      return { op: "and" as const, exprs };
    },
    or(...exprs: Expr[]) {
      return { op: "or" as const, exprs };
    },
    not(expr: Expr) {
      return { op: "not" as const, expr };
    },
  };
}

class DocumentQuery {
  private exprs: Expr[] = [];
  private direction: "asc" | "desc" = "asc";
  private max: number | null = null;

  constructor(private readonly tableName: string) {}

  withIndex(_name: string, build?: (q: IndexRange) => unknown) {
    if (typeof build === "function") {
      const range = new IndexRange();
      build(range);
      this.exprs.push(...range.exprs);
    }
    return this;
  }

  filter(build: (q: ReturnType<typeof filterBuilder>) => Expr) {
    this.exprs.push(build(filterBuilder()));
    return this;
  }

  order(direction: "asc" | "desc") {
    this.direction = direction;
    return this;
  }

  private async rows() {
    let docs = await listDocs(this.tableName);
    for (const expr of this.exprs) {
      docs = docs.filter((doc) => matchExpr(doc, expr));
    }
    docs = [...docs].sort((left, right) => {
      const delta = left._creationTime - right._creationTime;
      return this.direction === "asc" ? delta : -delta;
    });
    if (this.max !== null) docs = docs.slice(0, this.max);
    return docs.map((doc) => ({ ...doc }));
  }

  async collect() {
    return this.rows();
  }

  async take(count: number) {
    this.max = count;
    return this.rows();
  }

  async first() {
    const rows = await this.take(1);
    return rows[0] ?? null;
  }

  async unique() {
    const rows = await this.take(2);
    if (rows.length > 1) {
      throw new Error(`Query on ${this.tableName} returned more than one document.`);
    }
    return rows[0] ?? null;
  }

  async paginate(opts: { cursor: string | null; numItems: number }) {
    const all = await this.rows();
    const start = opts.cursor ? Number(opts.cursor) || 0 : 0;
    const page = all.slice(start, start + opts.numItems);
    const next = start + page.length;
    return {
      page,
      isDone: next >= all.length,
      continueCursor: String(next),
      splitCursor: null,
      pageStatus: next >= all.length ? "Exhausted" : "CanHaveMore",
    };
  }
}

class IndexRange {
  exprs: Expr[] = [];

  private cmp(op: Cmp, field: string, value: unknown) {
    this.exprs.push({ op, field, value });
    return this;
  }

  eq(field: string, value: unknown) {
    return this.cmp("eq", field, value);
  }

  gt(field: string, value: unknown) {
    return this.cmp("gt", field, value);
  }

  gte(field: string, value: unknown) {
    return this.cmp("gte", field, value);
  }

  lt(field: string, value: unknown) {
    return this.cmp("lt", field, value);
  }

  lte(field: string, value: unknown) {
    return this.cmp("lte", field, value);
  }
}

export function createDatabase() {
  return {
    get: async (tableOrId: string, maybeId?: string) => {
      const id = maybeId ?? tableOrId;
      const doc = await getDoc(id);
      return doc ? { ...doc } : null;
    },
    query: (tableName: string) => new DocumentQuery(tableName),
    insert: (tableName: string, value: Record<string, unknown>) => insertDoc(tableName, value),
    patch: (id: string, value: Record<string, unknown>) => patchDoc(id, value),
    replace: (id: string, value: Record<string, unknown>) => replaceDoc(id, value),
    delete: (id: string) => deleteDoc(id),
    normalizeId: (tableName: string, id: string) => {
      if (!id || typeof id !== "string") return null;
      return id as unknown as string;
    },
    system: {
      get: async () => null,
      query: () => new DocumentQuery("__system_empty__"),
    },
  };
}

export async function cosineSearch(
  tableName: string,
  vector: number[],
  filter: ((q: ReturnType<typeof filterBuilder>) => Expr) | undefined,
  limit: number,
) {
  const expr = filter ? filter(filterBuilder()) : null;
  const fromPg = await pgvectorSearch(tableName, vector, Math.max(limit, 64));
  const docs = fromPg ?? (await listDocs(tableName));
  const scored = docs
    .filter((doc) => (expr ? matchExpr(doc, expr) : true))
    .map((doc) => {
      if (typeof doc._score === "number") return { _id: doc._id, _score: doc._score };
      const embedding = doc.embedding;
      if (!Array.isArray(embedding)) return null;
      return { _id: doc._id, _score: cosine(vector, embedding as number[]) };
    })
    .filter((row): row is { _id: string; _score: number } => row !== null)
    .sort((left, right) => right._score - left._score)
    .slice(0, limit);
  return scored;
}

async function pgvectorSearch(tableName: string, vector: number[], limit: number): Promise<Array<Doc & { _score: number }> | null> {
  if (vector.length === 0 || vector.some((value) => !Number.isFinite(value))) return null;
  const literal = `[${vector.join(",")}]`;
  try {
    const result = await getPool().query(
      `SELECT data,
              1 - ((data->>'embedding')::vector <=> $2::vector) AS score
         FROM documents
        WHERE table_name = $1
          AND jsonb_typeof(data->'embedding') = 'array'
        ORDER BY (data->>'embedding')::vector <=> $2::vector
        LIMIT $3`,
      [tableName, literal, limit],
    );
    return result.rows.map((row) => ({ ...(row.data as Doc), _score: Number(row.score) }));
  } catch {
    return null;
  }
}

function cosine(left: number[], right: number[]) {
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  const length = Math.min(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const a = left[index] ?? 0;
    const b = right[index] ?? 0;
    dot += a * b;
    leftNorm += a * a;
    rightNorm += b * b;
  }
  if (leftNorm === 0 || rightNorm === 0) return 0;
  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}
