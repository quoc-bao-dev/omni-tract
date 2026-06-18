# Backend (`@omni/api`) — Kiến trúc & Convention

> Nest.js **11** · TypeScript · deploy **độc lập** với frontend (không Vercel static). Xem `document/document.md` (§6, §7, §9, §10).
> Nhiệm vụ chính: nhận **danh sách URL** từ client → **crawl** → trả **metric chuẩn hoá**. Toàn bộ logic lấy dữ liệu nằm sau **một interface thống nhất** (document §7). Nghiệp vụ crawl chi tiết: **TBD**.

---

## 1. Nguyên tắc

1. **BE chỉ làm thu thập + chuẩn hoá.** Không lưu dữ liệu người dùng (dữ liệu nằm ở IndexedDB phía client). BE **stateless** theo request.
2. **Contract qua `@omni/sdk`.** Response dùng đúng `CollectRequest`/`CollectResponse`/`CollectResult` + enum (`Platform`, `PostType`, `CollectStatus`, `Metrics`). Không tự định nghĩa lại type chia sẻ.
3. **Crawl ẩn sau interface.** Controller/Service không biết cách crawl từng nền tảng; mọi nền tảng cài `PlatformCrawler`. Đổi nguồn dữ liệu/nền tảng = thêm adapter, không sửa tầng trên.
4. **Partial failure là first-class.** Mỗi URL thành/bại độc lập → trả `CollectResult` per-URL (document §10), không fail cả batch.
5. **Module-based (Nest).** Mỗi vùng nghiệp vụ là một Nest module; DI qua constructor.
6. **Secret ở env/secret manager**, không commit (document §9).

---

## 2. Vai trò & ranh giới

| Thành phần | BE chịu trách nhiệm | KHÔNG thuộc BE |
|---|---|---|
| Thu thập | crawl URL → metric chuẩn hoá | UI, biểu đồ |
| Chuẩn hoá | map dữ liệu thô từng nền tảng → `Metrics`/`Content` | lưu snapshot (client làm) |
| Xác thực input | validate + (re)dedup URL phía server | dedup hiển thị (client) |
| Hợp đồng | tuân `@omni/sdk` | định nghĩa view-model (frontend) |

- **Deploy độc lập** (§9): FE static gọi BE qua HTTP cross-origin ⇒ **bắt buộc cấu hình CORS** allowlist origin của FE.
- Một chiều phụ thuộc: `controller → service → crawler (adapter) → normalizer`. Không đi ngược.

---

## 3. API chính — `POST /api/collect`

Hợp đồng (từ `@omni/sdk`, document §7):

```
POST /api/collect
Body:     CollectRequest   { urls: string[] }          // đã validate & dedup ở client
200 OK:   CollectResponse  { results: CollectResult[] } // per-URL, cho phép partial failure
```

```ts
// CollectResult = CollectResultOk | CollectResultError  (@omni/sdk)
{ ok: true,  sourceUrl, contentId, platform, type, title?, metrics, fetchedAt }
{ ok: false, sourceUrl, error: CollectErrorCode, message? }
```

- HTTP **200** kể cả khi vài URL lỗi (lỗi nằm trong `results[].ok=false`). Chỉ trả 4xx khi **toàn bộ request sai** (body không hợp lệ), 5xx khi lỗi hệ thống không lường trước.
- Idempotent theo input; không tạo state.

> Các route phụ (health, version) đặt sau, không thuộc nghiệp vụ chính.

---

## 4. Tầng kiến trúc (data flow)

```
HTTP POST /api/collect
  → CollectController        validate body (DTO + ValidationPipe)
  → CollectService           dedup, fan-out theo concurrency limit, gom kết quả
      └─ CrawlerRegistry      chọn PlatformCrawler theo platform (parse từ URL)
           └─ PlatformCrawler  facebook (Phase 1) | tiktok… (sau)
                └─ Normalizer  dữ liệu thô → Metrics/CollectResultOk (@omni/sdk)
  ← CollectResponse { results }
```

- **Controller**: chỉ HTTP + validation + map DTO → lệnh service. Không chứa logic crawl.
- **Service**: điều phối — phân giải platform, giới hạn concurrency, bọc per-URL try/catch → `CollectResult`.
- **Crawler (adapter)**: tri thức riêng từng nền tảng (nguồn, token, rate limit, retry). Ẩn sau interface (§7 placeholder).
- **Normalizer**: map schema thô khác nhau → `Metrics` thống nhất (document §10: nhiều loại post có metric khác nhau).

---

## 5. Cây thư mục chuẩn (module-based)

> Gom theo vai trò: **`modules/`** = mọi thứ có HTTP endpoint (feature module); **`infra/`** = hạ tầng không expose route (config, crawler, cross-cutting). Thêm endpoint mới → thêm module trong `modules/`; thêm hạ tầng → vào `infra/`.

```
apps/server/
├── src/
│   ├── main.ts                      # bootstrap: ValidationPipe, ExceptionFilter, CORS, prefix 'api'
│   ├── app.module.ts                # root: import ConfigModule + CollectModule + HealthModule
│   │
│   ├── modules/                     # ── CÓ HTTP ENDPOINT ──
│   │   ├── collect/                 # NGHIỆP VỤ CHÍNH
│   │   │   ├── collect.controller.ts    # POST /api/collect
│   │   │   ├── collect.service.ts       # điều phối fan-out + gom kết quả
│   │   │   ├── collect.module.ts
│   │   │   └── dto/
│   │   │       └── collect-request.dto.ts   # class-validator
│   │   └── health/                  # GET /api/health
│   │       ├── health.controller.ts
│   │       └── health.module.ts
│   │
│   └── infra/                       # ── KHÔNG ENDPOINT (hạ tầng) ──
│       ├── config/
│       │   ├── env.validation.ts        # schema env + validateEnv (class-validator), fail-fast
│       │   └── config.module.ts         # ConfigModule.forRoot (global, validate)
│       │
│       ├── crawler/                 # tầng thu thập (ẩn sau interface §7)
│       │   ├── crawler.module.ts        # chọn real/mock theo CRAWLER_MODE
│       │   ├── crawler.registry.ts      # resolve PlatformCrawler theo Platform
│       │   ├── platform-crawler.interface.ts  # contract (interface + CrawlInput)
│       │   ├── platform-crawlers.token.ts     # DI token PLATFORM_CRAWLERS (tách khỏi interface)
│       │   ├── normalizer.ts            # raw → CollectResultOk (@omni/sdk)
│       │   └── platforms/
│       │       ├── mock.crawler.ts      # MOCK adapter (phase dev) — KHÔNG lẫn code thật
│       │       └── facebook.crawler.ts  # adapter thật Phase 1 (TBD nghiệp vụ)
│       │
│       └── common/                  # cross-cutting
│           ├── filters/
│           │   └── all-exceptions.filter.ts   # chuẩn hoá lỗi không lường → 500
│           ├── url/
│           │   └── parse-platform.ts    # nhận diện Platform từ URL
│           └── concurrency.ts           # mapWithConcurrency + CRAWL_CONCURRENCY
│
├── test/                            # e2e (jest)
├── nest-cli.json · tsconfig*.json
└── ARCHITECTURE.md
```

> Mỗi nền tảng mới = thêm 1 file trong `crawler/platforms/` + đăng ký vào `CrawlerRegistry`. Tầng `collect` không đổi.

---

## 6. Crawler interface (document §7 — placeholder)

```ts
// crawler/platform-crawler.interface.ts
import { Platform, CollectResultOk } from '@omni/sdk';

export interface CrawlInput {
  sourceUrl: string;
}

export interface PlatformCrawler {
  readonly platform: Platform;
  /** Lấy + chuẩn hoá metric cho 1 URL. Throw lỗi domain nếu thất bại. */
  crawl(input: CrawlInput): Promise<CollectResultOk>;
}
```

- Adapter inject vào `CrawlerRegistry` (multi-provider). Registry chọn theo `platform` parse từ URL.
- **Phase 1**: chỉ `FacebookCrawler`. Nền tảng chưa hỗ trợ → `CollectResultError { error: 'unsupported_platform' }`.
- Chi tiết nguồn dữ liệu / token / rate limit / retry **đóng gói trong adapter**, không rò ra tầng trên (§7).

---

## 7. Validation (request)

- **Global `ValidationPipe`** (`whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`) trong `main.ts`.
- DTO bằng `class-validator`; map sang type `@omni/sdk` ở ranh giới controller.

```ts
// collect/dto/collect-request.dto.ts
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class CollectRequestDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(200)        // chặn batch quá lớn (document §10)
  @IsString({ each: true })
  urls!: string[];
}
```

- Server **vẫn (re)validate + dedup** URL (không tin client tuyệt đối).

---

## 8. Error handling & partial failure

- **Per-URL**: `CollectService` bọc mỗi URL trong try/catch → thành công `CollectResultOk`, lỗi `CollectResultError` với `CollectErrorCode` (`invalid_url`, `unsupported_platform`, `not_found`, `private`, `rate_limited`, `fetch_failed`, `internal_error`).
- **Domain error**: định nghĩa class lỗi riêng (vd `UnsupportedPlatformError`) → map sang `CollectErrorCode`.
- **Toàn request**: body sai → 400 (ValidationPipe). Lỗi không lường → `AllExceptionsFilter` trả 500 chuẩn hoá (không lộ stack).
- Không bao giờ để 1 URL lỗi làm hỏng cả response.

---

## 9. Concurrency / throttle / retry (batch — document §10)

- Fan-out có **giới hạn concurrency** (vd 5–10) thay vì `Promise.all` tất cả → tránh rate-limit nền tảng.
- **Retry per-URL** (backoff) cho lỗi tạm (`rate_limited`, `fetch_failed`); không retry lỗi vĩnh viễn (`not_found`, `private`).
- Resume per-URL: kết quả độc lập nên client retry riêng URL lỗi được.

```ts
// điều phối (rút gọn)
const results = await mapWithConcurrency(urls, LIMIT, (url) => this.collectOne(url));
return { results };
```

---

## 10. Config / env / secrets / CORS

- `@nestjs/config` + validate env lúc khởi động (fail-fast nếu thiếu).
- **CORS bắt buộc**: allowlist origin FE (env `WEB_ORIGIN`), vì FE static gọi cross-origin.
- Secret (token nền tảng…) chỉ ở env/secret manager (§9), không commit; không log secret.

```
PORT=3000
WEB_ORIGIN=https://app.example.com      # CORS allowlist
# token/secret crawl: TBD theo nghiệp vụ
```

```ts
// main.ts
app.setGlobalPrefix('api');
app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
app.enableCors({ origin: config.get('WEB_ORIGIN') });
```

---

## 11. Naming conventions

| Đối tượng | Quy tắc | Ví dụ |
|---|---|---|
| File | `kebab-case` + hậu tố Nest | `collect.controller.ts`, `facebook.crawler.ts` |
| Module | `*.module.ts` | `collect.module.ts` |
| Class | `PascalCase` + vai trò | `CollectService`, `FacebookCrawler`, `CrawlerRegistry` |
| DTO | `PascalCase` + `Dto` | `CollectRequestDto` |
| Interface | `PascalCase`, không tiền tố `I` | `PlatformCrawler` |
| Injection token | `UPPER_SNAKE` (const) | `PLATFORM_CRAWLERS` |
| Hằng số | `UPPER_SNAKE_CASE` | `MAX_BATCH_SIZE`, `CRAWL_CONCURRENCY` |
| Biến/hàm | `camelCase` | `collectOne`, `parsePlatform` |
| Route | `kebab-case`, prefix `api` | `POST /api/collect` |
| Test | `*.spec.ts` (unit cạnh file), `*.e2e-spec.ts` (`test/`) | `collect.service.spec.ts` |

---

## 12. Lint / Format / Imports

- Dùng **Biome** (chung toolchain root): format + lint + organize imports + sort Tailwind (FE).
- **`useImportType` TẮT cho `apps/server`** (override trong `biome.json`): Nest DI cần **value-import** của class (decorator + `emitDecoratorMetadata`); đổi `import type` sẽ mất token runtime → vỡ injection.
- Tuân `import type` cho type thuần **không inject** (DTO type, interface) là tốt, nhưng quy tắc tự động đã tắt để an toàn DI — giữ value-import cho mọi thứ inject.
- Import nội bộ: tương đối trong module; nếu cần alias `@app/*` thì thêm `tsconfig paths` + `tsc-alias` ở bước build (vì `nest build`/tsc không tự rewrite alias runtime).

---

## 13. Testing

| Mức | Phạm vi |
|---|---|
| Unit (jest) | `collect.service` (fan-out, partial failure), `normalizer`, `url` parse/validate, từng `*.crawler` (mock nguồn) |
| E2E (`test/`) | `POST /api/collect`: body sai → 400; mix URL ok/lỗi → 200 + `results` đúng `ok` |

- Mock `PlatformCrawler` để test service không gọi mạng thật.

---

## 14. Build & deploy

- `nest build` → `dist/`; chạy `node dist/main`.
- Deploy **độc lập** (§9): container/host riêng, không dính Vercel static của FE.
- Cấu hình: `PORT`, `WEB_ORIGIN` (CORS), secret crawl (khi có nghiệp vụ).
- Healthcheck `GET /api/health` cho orchestrator (optional).

---

## 15. Vấn đề mở (chốt khi bàn nghiệp vụ)

- **Nguồn dữ liệu crawl** từng nền tảng: official API vs scrape; token/auth; rate limit; retry policy (§7 — TBD).
- **Danh sách `Metrics` mục tiêu** cho mỗi PostType (§8, §11.4) → định hình `Normalizer`.
- **Input/Output interface** có đúng `list URL → metric chuẩn hoá`, hay cần thêm trường (§7, §11.3).
- Quản lý token/secret + giới hạn quota theo nền tảng.
```
