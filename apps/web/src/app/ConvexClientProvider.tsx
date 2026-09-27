"use client";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { type ReactNode } from "react";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexAuthProvider client={null}>{children}</ConvexAuthProvider>;
}
