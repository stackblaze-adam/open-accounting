"use client";

import { useCallback, useEffect, useState } from "react";

const functionName = Symbol.for("functionName");

function refName(reference: unknown) {
  if (typeof reference === "string") return reference;
  const name = (reference as { [key: symbol]: string })?.[functionName];
  if (!name) throw new Error("Not a function reference.");
  return name;
}

async function callFunction(name: string, args: Record<string, unknown> | undefined) {
  const response = await fetch("/api/fn", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, args: args ?? {} }),
  });
  const body = (await response.json()) as { value?: unknown; errorMessage?: string };
  if (!response.ok) {
    throw new Error(body.errorMessage || "Request failed.");
  }
  return body.value;
}

export function useQuery(reference: unknown, args?: Record<string, unknown> | "skip") {
  const skip = args === "skip";
  const name = refName(reference);
  const argKey = skip ? "" : JSON.stringify(args ?? {});
  const [value, setValue] = useState<unknown>(undefined);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (skip) return undefined;
    let cancelled = false;
    const load = () => {
      callFunction(name, args as Record<string, unknown> | undefined)
        .then((next) => {
          if (!cancelled) {
            setError(null);
            setValue(next);
          }
        })
        .catch((caught) => {
          if (!cancelled) setError(caught instanceof Error ? caught : new Error(String(caught)));
        });
    };
    load();
    const timer = setInterval(load, 2000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [name, skip, argKey]);

  if (error) throw error;
  if (skip) return undefined;
  return value;
}

function mutationFunction(name: string) {
  const run = (args?: Record<string, unknown>) => callFunction(name, args);
  return Object.assign(run, {
    withOptimisticUpdate() {
      return run;
    },
  });
}

export function useMutation(reference: unknown) {
  const name = refName(reference);
  return useCallback(() => mutationFunction(name), [name])();
}

export function useAction(reference: unknown) {
  return useMutation(reference);
}

export function usePaginatedQuery(
  reference: unknown,
  args: Record<string, unknown> | "skip",
  options: { initialNumItems: number },
) {
  const skip = args === "skip";
  const name = refName(reference);
  const argKey = skip ? "" : JSON.stringify(args ?? {});
  const [results, setResults] = useState<unknown[]>([]);
  const [status, setStatus] = useState("LoadingFirstPage");
  const [cursor, setCursor] = useState<string | null>(null);

  useEffect(() => {
    if (skip) return undefined;
    let cancelled = false;
    setStatus("LoadingFirstPage");
    setResults([]);
    setCursor(null);
    callFunction(name, {
      ...(args as Record<string, unknown>),
      paginationOpts: { numItems: options.initialNumItems, cursor: null },
    })
      .then((value) => {
        if (cancelled) return;
        const page = value as { page?: unknown[]; isDone?: boolean; continueCursor?: string };
        setResults(page.page ?? []);
        setCursor(page.continueCursor ?? null);
        setStatus(page.isDone ? "Exhausted" : "CanLoadMore");
      })
      .catch(() => {
        if (!cancelled) setStatus("Exhausted");
      });
    return () => {
      cancelled = true;
    };
  }, [name, skip, argKey, options.initialNumItems]);

  const loadMore = (numItems: number) => {
    if (skip || status !== "CanLoadMore") return;
    setStatus("LoadingMore");
    void callFunction(name, {
      ...(args as Record<string, unknown>),
      paginationOpts: { numItems, cursor },
    }).then((value) => {
      const page = value as { page?: unknown[]; isDone?: boolean; continueCursor?: string };
      setResults((current) => [...current, ...(page.page ?? [])]);
      setCursor(page.continueCursor ?? null);
      setStatus(page.isDone ? "Exhausted" : "CanLoadMore");
    });
  };

  return { results: skip ? [] : results, status: skip ? "LoadingFirstPage" : status, loadMore };
}

export function insertAtTop() {
  return undefined;
}

const logger = {
  log: (..._args: unknown[]) => undefined,
  warn: (..._args: unknown[]) => undefined,
  error: (..._args: unknown[]) => undefined,
};

export function useConvex() {
  return {
    logger,
    query: (reference: unknown, args?: Record<string, unknown>) => callFunction(refName(reference), args),
    mutation: (reference: unknown, args?: Record<string, unknown>) => callFunction(refName(reference), args),
    action: (reference: unknown, args?: Record<string, unknown>) => callFunction(refName(reference), args),
  };
}

export function useQueries(queries: Record<string, { query: unknown; args: Record<string, unknown> } | "skip">) {
  const key = JSON.stringify(
    Object.entries(queries).map(([id, spec]) =>
      spec === "skip" ? [id, "skip"] : [id, refName(spec.query), spec.args],
    ),
  );
  const [results, setResults] = useState<Record<string, unknown>>({});

  useEffect(() => {
    let cancelled = false;
    const entries = Object.entries(queries);
    void Promise.all(
      entries.map(async ([id, spec]) => {
        if (spec === "skip") return [id, undefined] as const;
        try {
          return [id, await callFunction(refName(spec.query), spec.args)] as const;
        } catch (caught) {
          return [id, caught instanceof Error ? caught : new Error(String(caught))] as const;
        }
      }),
    ).then((pairs) => {
      if (!cancelled) setResults(Object.fromEntries(pairs));
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return results;
}

export class ConvexReactClient {
  constructor(public url: string) {}
}

export function ConvexProvider({ children }: { children: React.ReactNode; client?: unknown }) {
  return children;
}
