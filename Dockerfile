FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable \
  && corepack prepare pnpm@10.26.2 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY packages/email/package.json packages/email/package.json

RUN pnpm install --frozen-lockfile

COPY . .

# Client components inline this at build time. The image is Postgres-only.
ENV NEXT_PUBLIC_OPENBOOKS_BACKEND=postgres
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm --filter @openbooks/web build

ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NODE_ENV=production

WORKDIR /app/apps/web
EXPOSE 3000

CMD ["pnpm", "exec", "next", "start", "--hostname", "0.0.0.0", "--port", "3000"]
