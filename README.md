# Omni Tract

Monorepo (Turborepo + pnpm workspaces) thu thập & theo dõi tăng trưởng metric nội dung mạng xã hội. Giai đoạn 1: Facebook. Xem `document/document.md`.

## Cấu trúc

```
apps/frontend-app   @omni/app    Next.js — Dashboard, IndexedDB, export
apps/server         @omni/api    Nest.js — thu thập & chuẩn hoá metric
packages/sdk        @omni/sdk    enums + domain types + Collect contract
```

## Yêu cầu

- Node >= 20 (đang dùng 25.x)
- pnpm 10.x

## Lệnh (root)

```bash
pnpm install        # cài deps toàn workspace
pnpm dev            # turbo run dev (chạy song song frontend + server)
pnpm build          # turbo run build
pnpm type-check     # turbo run type-check
pnpm lint           # turbo run lint
pnpm test           # turbo run test
```

## Trạng thái M0

Scaffold monorepo + `packages/sdk` đã xong. `apps/frontend-app` và
`apps/server` được init bằng CLI chính thống (Next / Nest), sau đó wiring vào
workspace để hoàn thiện M0.
