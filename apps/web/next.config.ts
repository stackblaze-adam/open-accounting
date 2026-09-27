import type { NextConfig } from "next";
import path from "node:path";
import { loadEnvConfig } from "@next/env";

const workspaceRoot = path.resolve(process.cwd(), "../..");
loadEnvConfig(workspaceRoot);
process.env.OPENBOOKS_DATA_DIR = path.resolve(workspaceRoot, "data");

const nextConfig: NextConfig = {
  outputFileTracingRoot: workspaceRoot,
  turbopack: {
    root: workspaceRoot,
    resolveAlias: {
      "@convex-dev/auth/react": "./src/lib/pg/auth-react.tsx",
      "convex/react": "./src/lib/pg/react.tsx",
      "@convex-dev/auth/server": "../../node_modules/@convex-dev/auth/dist/server/index.js",
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@convex-dev/auth/react": path.resolve(process.cwd(), "src/lib/pg/auth-react.tsx"),
      "convex/react": path.resolve(process.cwd(), "src/lib/pg/react.tsx"),
      "@convex-dev/auth/server": path.resolve(workspaceRoot, "node_modules/@convex-dev/auth/dist/server/index.js"),
    };
    return config;
  },
};

export default nextConfig;
