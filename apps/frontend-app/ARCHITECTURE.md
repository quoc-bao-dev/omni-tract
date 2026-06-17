# Frontend (`@omni/app`) — Kiến trúc & Convention

> Next.js **16** (App Router) · React 19 · TypeScript · Tailwind v4 · **static export** → Vercel Hobby.
> Client-heavy, lưu **IndexedDB**, không auth, single-tenant theo thiết bị. Xem `document/document.md`.
> Convention dưới đây bám **Next 16** (params/searchParams async, fetch không cache mặc định, Turbopack default) — KHÔNG dùng pattern Next 13/14 cũ.

---

## 1. Nguyên tắc

1. **App là static shell + logic chạy ở client.** Server (`@omni/api`) chỉ thu thập metric; mọi dữ liệu người dùng nằm ở IndexedDB trên trình duyệt.
2. **`src/app/` chỉ là tầng routing** (mỏng). Logic nghiệp vụ nằm ở `features/` và `lib/`.
3. **Feature-based (vertical slice).** Mỗi tính năng gói trọn UI + hooks + state riêng; dùng chung qua `components/ui` và `lib/`.
4. **Một chiều phụ thuộc:** `app/` → `features/` → `lib/` → `@omni/common`. Không đi ngược.
5. **Contract dùng `@omni/common`**, không tự định nghĩa lại type của server.
6. **`'use client'` càng sâu càng tốt** để giảm JS bundle.

---

## 2. Ràng buộc Static Export (BẮT BUỘC nắm trước khi code)

Build bằng `output: 'export'` → ra thư mục `out/` toàn `.html`. Vì **không có server runtime**, các thứ sau **bị cấm / không dùng được** (Next 16 sẽ lỗi build):

| Không dùng                                                                | Thay bằng                            |
| ------------------------------------------------------------------------- | ------------------------------------ |
| `cookies()`, `headers()`, đọc `Request` trong Route Handler               | — (không có)                         |
| Server Actions                                                            | gọi `@omni/api` qua `fetch` ở client |
| `searchParams` ở Server Component để lọc runtime                          | **state lọc ở client** (xem §8)      |
| ISR / `revalidate` / Draft Mode / `rewrites`/`redirects`/`headers` config | —                                    |
| Intercepting routes (modal-over-list)                                     | modal bằng state client              |
| Image Optimization mặc định                                               | `images.unoptimized: true`           |

`next.config.ts` chuẩn:

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export', // build static → out/
  reactCompiler: true, // đã bật sẵn
  images: { unoptimized: true },
  // trailingSlash: true,    // bật nếu host cần /page/ → /page/index.html
};

export default nextConfig;
```

> `next start` KHÔNG chạy với `output: 'export'`. Local preview: `npx serve out` (hoặc `next dev` khi phát triển). Deploy: trỏ Vercel tới thư mục `out/`.

---

## 3. Tầng kiến trúc (data flow)

```
┌─────────────────────────────────────────────────────────────┐
│ app/            routing + layout + metadata (thin)            │
├─────────────────────────────────────────────────────────────┤
│ features/       UI nghiệp vụ: dashboard, import, table, export│
│   └─ components / hooks / state (cục bộ theo feature)         │
├─────────────────────────────────────────────────────────────┤
│ components/ui   design system dùng chung (button, table…)     │
├─────────────────────────────────────────────────────────────┤
│ lib/                                                          │
│   ├─ db/        IndexedDB: client + repository + migration    │
│   ├─ api/       client gọi @omni/api (contract @omni/common)  │
│   ├─ export/    CSV / Excel / PDF                             │
│   └─ url/       validate + dedup URL                          │
├─────────────────────────────────────────────────────────────┤
│ @omni/common    types/contract dùng chung với server          │
└─────────────────────────────────────────────────────────────┘

Import URL ─▶ lib/url (validate+dedup) ─▶ lib/api (POST @omni/api)
        ◀── metric chuẩn hoá ── lib/db (append snapshot) ─▶ UI table + chart
Export  ─▶ lib/export đọc lib/db ─▶ file CSV/Excel/PDF
```

---

## 4. Cây thư mục chuẩn

```
apps/frontend-app/
├── public/                         # asset tĩnh (favicon, logo…)
├── src/
│   ├── app/                        # ROUTING ONLY
│   │   ├── layout.tsx              # root layout (Server Component) + metadata
│   │   ├── page.tsx                # "/" → render <DashboardPage/>
│   │   ├── loading.tsx             # skeleton
│   │   ├── error.tsx               # error boundary ('use client')
│   │   ├── not-found.tsx
│   │   └── globals.css
│   │
│   ├── features/                   # vertical slices
│   │   ├── dashboard/
│   │   │   ├── components/         # dashboard-page.tsx, filter-bar.tsx…
│   │   │   ├── hooks/              # use-dashboard-filters.ts
│   │   │   ├── store.ts            # state cục bộ feature (nếu cần)
│   │   │   └── index.ts            # public surface của feature
│   │   ├── content-import/         # import list URL
│   │   ├── content-table/          # bảng nội dung đã thu thập
│   │   ├── growth/                 # biểu đồ tăng trưởng từ snapshots
│   │   └── data-export/            # nút + flow export
│   │
│   ├── components/
│   │   └── ui/                     # design system: button.tsx, table.tsx, dialog.tsx
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   ├── database.ts         # mở IndexedDB (idb), giữ version
│   │   │   ├── migrations.ts       # upgrade theo version
│   │   │   ├── schema.ts           # tên store + index (const)
│   │   │   └── content-repository.ts
│   │   ├── api/
│   │   │   ├── client.ts           # fetch wrapper (base URL, lỗi chuẩn hoá)
│   │   │   └── collect.ts          # collect(urls) → CollectResponse
│   │   ├── export/
│   │   │   ├── to-csv.ts           # UTF-8 BOM
│   │   │   ├── to-excel.ts
│   │   │   └── to-pdf.ts
│   │   ├── url/
│   │   │   ├── validate.ts         # hợp lệ + đúng nền tảng facebook
│   │   │   └── dedup.ts
│   │   └── utils/                  # helper thuần (format-number, cn…)
│   │
│   ├── hooks/                      # hook dùng chung nhiều feature
│   ├── stores/                     # global client state (Zustand)
│   ├── config/
│   │   ├── env.ts                  # đọc + validate env (NEXT_PUBLIC_*)
│   │   └── constants.ts            # hằng số app (UPPER_SNAKE)
│   └── types/                      # type CỤC BỘ của frontend (UI/view-model)
│
├── next.config.ts
├── tsconfig.json                   # paths: "@/*" → "./src/*"
└── ARCHITECTURE.md
```

> Quy tắc colocation: file không-routing đặt cạnh route được, nhưng dự án này tách hẳn ra `features/` cho rõ ranh giới. Nếu colocate trong `app/`, dùng **private folder** `_components/`, `_lib/` (tiền tố `_` để Next bỏ khỏi routing).

---

## 5. Routing & file conventions (Next 16)

- **Special files** (Next nhận diện theo tên, viết thường): `layout` · `page` · `loading` · `error` · `global-error` · `not-found` · `template` · `default`. Route chỉ public khi có `page.tsx`.
- **Folder route = kebab-case**: `content-import/`, `growth/`.
- **Dynamic segment** (nếu cần sau này): `[id]`, catch-all `[...slug]`, optional `[[...slug]]`.
- **Route group** `(group)/` để gom tổ chức, không vào URL. **Private folder** `_folder/` để colocate, không vào URL.
- **`params`/`searchParams` là Promise** (Next 16):

```tsx
// Server Component
export default async function Page({ params }: PageProps<'/c/[id]'>) {
  const { id } = await params;
}
// Client Component
('use client');
import { use } from 'react';
export default function View({ params }) {
  const { id } = use(params);
}
```

> Chạy `next dev`/`next build`/`next typegen` để sinh helper `PageProps<'/route'>`, `LayoutProps<'/route'>`.

---

## 6. Ranh giới Server / Client Component

Vì static export + IndexedDB là API trình duyệt:

- **Server Component (build-time):** `app/layout.tsx`, `app/page.tsx` — chỉ dựng khung tĩnh + `metadata`. Không gọi IndexedDB ở đây.
- **`'use client'`:** mọi thứ động — feature containers, form import, table, chart, mọi hook đọc/ghi IndexedDB, mọi nơi dùng `useState/useEffect/use*`.
- Đặt `'use client'` ở **container của feature** (vd `dashboard-page.tsx`), không đặt ở `app/page.tsx` (giữ page là Server Component).
- Truyền dữ liệu Server → Client qua **props serializable**.
- Code chỉ-client (IndexedDB) **không** import vào Server Component.

```tsx
// app/page.tsx  (Server Component)
import { DashboardPage } from '@/features/dashboard';
export default function Page() {
  return <DashboardPage />; // 'use client' nằm bên trong DashboardPage
}
```

---

## 7. Quản lý state

| Loại state                       | Giải pháp                                          | Ghi chú                                          |
| -------------------------------- | -------------------------------------------------- | ------------------------------------------------ |
| Dữ liệu nội dung (nguồn sự thật) | **IndexedDB** qua `lib/db`                         | persistent, time-series                          |
| Cache UI của dữ liệu + thao tác  | hook `use-content-list` bọc repository             | re-fetch sau mỗi mutation                        |
| **Filter dashboard**             | **state client** (Zustand `stores/` hoặc URL hash) | KHÔNG dùng server `searchParams` (static export) |
| UI tạm (modal, selection)        | `useState` cục bộ                                  | —                                                |

> Global state nhẹ → **Zustand** (`src/stores/`). Không cần React Query vì dữ liệu là local (IndexedDB), không phải remote cache.

---

## 8. Tầng dữ liệu — IndexedDB (`lib/db`)

- Dùng thư viện **`idb`** (wrapper Promise mỏng cho IndexedDB). Không thao tác IndexedDB API thô rải rác.
- **Repository pattern**: UI/hook chỉ gọi `contentRepository`, không chạm IndexedDB trực tiếp.
- Schema theo `@omni/common` (`Content`, `Snapshot`, `Metrics`).

```ts
// lib/db/schema.ts
export const DB_NAME = 'omni-tract';
export const DB_VERSION = 1; // tăng khi đổi schema
export const STORE_CONTENT = 'content';
export const IDX_PLATFORM = 'by-platform';
export const IDX_TYPE = 'by-type';
export const IDX_UPDATED = 'by-updated-at';
```

```ts
// lib/db/content-repository.ts (rút gọn)
import type { Content, CollectResultOk } from '@omni/common';

export const contentRepository = {
  list(): Promise<Content[]> {
    /* getAll */
  },
  get(id: string): Promise<Content | undefined> {
    /* … */
  },
  /** Append snapshot (KHÔNG ghi đè) — fetch lại = thêm 1 điểm tăng trưởng */
  appendSnapshot(result: CollectResultOk): Promise<void> {
    /* upsert + push snapshots */
  },
};
```

Quy tắc:

- **Append-only** cho `snapshots` (document §5, §8).
- Store `content` key = `content_id`; index phụ phục vụ filter (`platform`, `type`, `updated_at`).
- **Versioning + migration** tập trung ở `migrations.ts`; mọi đổi schema phải bump `DB_VERSION` và viết bước upgrade.
- Bọc lỗi quota/evict (document §10) thành lỗi domain rõ ràng để UI hiển thị.

---

## 9. Tầng API client (`lib/api`)

- Giao tiếp `@omni/api` qua `fetch`, **dùng contract `@omni/common`** (`CollectRequest`/`CollectResponse`).
- Base URL từ env `NEXT_PUBLIC_API_BASE_URL` (xem §13).
- Chuẩn hoá lỗi + xử lý **partial failure per-URL** (document §10).

```ts
// lib/api/collect.ts
import type { CollectRequest, CollectResponse } from '@omni/common';
import { apiClient } from './client';

export function collect(urls: string[]): Promise<CollectResponse> {
  return apiClient.post<CollectResponse>('/collect', { urls } satisfies CollectRequest);
}
```

> `fetch` Next 16 **không cache mặc định** — đúng nhu cầu (mỗi fetch = snapshot mới). Không thêm `'use cache'`.

---

## 10. Module Export (`lib/export`)

- Chạy **hoàn toàn ở client**; **lazy-load** bằng `import()` động để không phình bundle khởi tạo và giảm rủi ro memory dataset lớn (document §10).
- **CSV**: prepend **BOM `﻿`** để tiếng Việt đúng trên Excel (document §4.3).
- Excel: `xlsx`/`exceljs`; PDF: `pdfmake`/`jspdf`+autotable _(chốt thư viện khi triển khai)_.
- Phạm vi export (snapshot mới nhất vs toàn bộ lịch sử) — **vấn đề mở §11.2**, chưa code cứng.

```ts
const { toExcel } = await import('@/lib/export/to-excel'); // chỉ tải khi user bấm export
```

---

## 11. Naming conventions

| Đối tượng               | Quy tắc                             | Ví dụ                                 |
| ----------------------- | ----------------------------------- | ------------------------------------- |
| Folder (route & thường) | `kebab-case`                        | `content-import/`, `lib/db/`          |
| File component          | `kebab-case.tsx`                    | `content-table.tsx`, `filter-bar.tsx` |
| Tên component (export)  | `PascalCase`                        | `export function ContentTable()`      |
| File hook               | `use-*.ts`                          | `use-content-list.ts`                 |
| Tên hook                | `camelCase` `use*`                  | `useContentList()`                    |
| File util/service       | `kebab-case.ts`                     | `to-csv.ts`, `validate.ts`            |
| Hàm / biến              | `camelCase`                         | `appendSnapshot`, `dedupUrls`         |
| Type / Interface        | `PascalCase`, **không** tiền tố `I` | `ContentRow`, `FilterState`           |
| Hằng số module          | `UPPER_SNAKE_CASE`                  | `DB_NAME`, `MAX_BATCH_SIZE`           |
| Special file Next       | viết thường cố định                 | `layout.tsx`, `page.tsx`              |
| Barrel                  | `index.ts` mỗi feature              | `features/dashboard/index.ts`         |
| Test                    | `*.test.ts(x)` cạnh file            | `to-csv.test.ts`                      |

> File `kebab-case` (đồng bộ với folder Next + hệ sinh thái shadcn, tránh lỗi casing cross-OS), nhưng **symbol export theo chuẩn React** (PascalCase component, camelCase hook/hàm).

---

## 12. Import & path alias

- Alias `@/*` → `src/*` (đã có trong `tsconfig.json`). **Không** import tương đối kiểu `../../../lib`.
- Thứ tự import: **(1)** lib ngoài → **(2)** `@omni/*` → **(3)** `@/*` → **(4)** tương đối cùng feature.
- Mỗi feature expose qua `index.ts`; ngoài feature **chỉ import từ barrel**, không chọc vào file con.

```ts
import { useState } from 'react'; // 1
import type { Content } from '@omni/common'; // 2
import { contentRepository } from '@/lib/db/content-repository'; // 3
import { FilterBar } from './filter-bar'; // 4
```

---

## 13. Env vars & config

- Chỉ biến `NEXT_PUBLIC_*` mới vào client bundle (cần cho static export).
- Đọc/validate tập trung ở `src/config/env.ts`; **không** rải `process.env` khắp nơi.

```
NEXT_PUBLIC_API_BASE_URL=https://api.example.com   # base URL @omni/api
```

- Không commit secret (document §9); static export không có secret server-side.

---

## 14. Styling (Tailwind v4)

- Tailwind v4 cấu hình trong `globals.css` (`@import "tailwindcss"`) + `postcss.config.mjs` (đã có `@tailwindcss/postcss`).
- Class gộp điều kiện qua helper `cn()` (`lib/utils`).
- Component `ui/` không chứa logic nghiệp vụ — chỉ trình bày + props.

---

## 15. Error & Loading

- Mỗi route: `loading.tsx` (skeleton) + `error.tsx` (`'use client'`, có `reset()`).
- Lỗi IndexedDB (quota/evict) và lỗi API (partial failure) → map sang thông điệp người dùng, không nuốt lỗi.
- Widget feature bọc error boundary riêng để 1 widget lỗi không sập cả dashboard.

---

## 16. Testing (đề xuất)

| Mức       | Công cụ                      | Phạm vi                                                     |
| --------- | ---------------------------- | ----------------------------------------------------------- |
| Unit      | **Vitest** + Testing Library | `lib/url`, `lib/export`, repository (fake-indexeddb), hooks |
| Component | Vitest + Testing Library     | feature components                                          |
| E2E       | **Playwright**               | import → fetch (mock `@omni/api`) → table → export          |

> Test đặt cạnh file (`*.test.ts`). Lint/format đã có ở root (oxlint/oxfmt); type-check qua `pnpm type-check`.

---

## 17. Production checklist

- [ ] `output: 'export'` + `images.unoptimized` bật; build ra `out/` không lỗi.
- [ ] Không còn API runtime (cookies/headers/server action/ISR).
- [ ] Filter dùng state client, không `searchParams` server.
- [ ] IndexedDB có `DB_VERSION` + migration; append-only snapshots.
- [ ] API client đọc `NEXT_PUBLIC_API_BASE_URL`, xử lý partial failure.
- [ ] Export lazy-load + CSV có BOM.
- [ ] `'use client'` đặt ở leaf/feature, `app/page.tsx` vẫn Server Component.
- [ ] `pnpm --filter @omni/app build` xanh; bundle không kéo nhầm lib export vào entry.

---

## 18. Vấn đề mở ảnh hưởng kiến trúc (chốt sẽ cập nhật doc)

- Filter dashboard cần những gì (§11.1) → định hình `FilterState` + index IndexedDB.
- Danh sách metric (§11.4) → định hình cột table + `Metrics` trong `@omni/common`.
- Phạm vi export (§11.2) → logic `lib/export`.
- Contract thu thập (§11.3) → `lib/api` + `@omni/common`.
