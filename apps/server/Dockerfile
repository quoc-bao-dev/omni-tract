# Build context = REPO ROOT (cần pnpm workspace + packages/sdk).
#   docker build -f apps/server/Dockerfile -t omni-server .
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

# ---- build: cài deps (cache theo manifest) → build sdk + server → prune prod bundle ----
FROM base AS build
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/sdk/package.json packages/sdk/
COPY apps/server/package.json apps/server/
COPY apps/frontend-app/package.json apps/frontend-app/
# Cache store giữa các build → cài nhanh, không phình image.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm install --frozen-lockfile --prefer-offline --store-dir /pnpm/store

COPY . .
RUN pnpm --filter @omni/sdk build \
  && pnpm --filter @omni/api build \
  && pnpm --filter=@omni/api --prod --legacy deploy /prod/server

# ---- runtime: node sạch, KHÔNG corepack/pnpm, chỉ bundle prod self-contained ----
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /prod/server ./
USER node
EXPOSE 4100
# Env runtime (PORT, WEB_ORIGIN, KIOTPROXY_KEY/FB_PROXY_URL) truyền qua `docker run -e`.
CMD ["node", "dist/main"]
