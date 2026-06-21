# Build context = REPO ROOT.
#   docker build -f apps/frontend-app/Dockerfile \
#     --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.example.com/api -t omni-frontend .
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

# ---- build: Next static export → out/ ----
FROM base AS build
# URL API được INLINE lúc build (static export) → BẮT BUỘC truyền đúng cho môi trường đích.
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:4100/api
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/sdk/package.json packages/sdk/
COPY apps/server/package.json apps/server/
COPY apps/frontend-app/package.json apps/frontend-app/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm install --frozen-lockfile --prefer-offline --store-dir /pnpm/store

COPY . .
RUN pnpm --filter @omni/sdk build && pnpm --filter @omni/app build

# ---- runtime: nginx slim phục vụ static (nhỏ hơn alpine thường) ----
FROM nginx:1.27-alpine-slim AS runtime
COPY apps/frontend-app/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/frontend-app/out /usr/share/nginx/html
EXPOSE 80
