# Tách frontend & server ra 2 repo độc lập — quyết định & lộ trình

> Trạng thái: **Quyết định — hoãn tách** · Liên quan: `document/document.md` §6, §9, §11

## TL;DR

Hiện tại **chưa** tách `web` và `api` thành 2 git repo riêng. Giữ monorepo
(Turborepo + pnpm workspaces) cho tới khi contract trong `@omni/sdk`
ổn định. Khi tách, phân phối `shared` qua **registry (GitHub Packages) + semver**.

## Bối cảnh

Doc §6 mô tả monorepo 3 thành phần; §9 yêu cầu mỗi thành phần **deploy độc lập**
và **commit độc lập**, chia sẻ contract qua `packages/sdk`. Câu hỏi đặt ra:
với repo hiện tại, có thể triển khai frontend/server ở **2 repo git riêng biệt**
ngay chưa?

## Kết quả kiểm tra (2026-06-17)

Quét coupling giữa 2 app:

| Khía cạnh                             | Trạng thái                                                                               | Cản trở tách?               |
| ------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------- |
| `apps/*/tsconfig.json`                | Độc lập, không extends `tsconfig.base.json`                                              | Không                       |
| App source import lẫn nhau            | Không có cross-import                                                                    | Không                       |
| `next.config` transpile shared source | Không có `transpilePackages`                                                             | Không                       |
| Commit độc lập                        | Đã tách                                                                                  | Không                       |
| **`@omni/sdk`**                    | Cả 2 app khai báo `"workspace:*"`; shared `private: true`, `version 0.0.0`, chưa publish | **Có — điểm chặn duy nhất** |

**Điểm chặn:** giao thức `workspace:*` chỉ resolve **bên trong** pnpm workspace.
Tách ra repo riêng → `pnpm install` không tìm thấy `@omni/sdk` → fail.

## Quyết định: HOÃN tách trong Phase 1

Lý do:

1. **Contract còn churn mạnh.** Doc §11 còn 4 vấn đề mở, đều nằm trong `shared`:
   danh sách metric (§8 → `Metrics`), input/output interface thu thập
   (§7 → `Collect*`), filter dashboard, phạm vi export. `shared` sẽ đổi liên tục.
2. **Tách sớm = thêm ma sát.** Mỗi thay đổi contract sẽ buộc: sửa shared → bump
   version → publish/tag → bump dep ở cả web và api → install lại, **trước khi**
   một bên test được. Monorepo sinh ra để xoá đúng vòng lặp này.
3. **Nhu cầu thực tế đã được monorepo đáp ứng:**
   - Deploy độc lập: Vercel build `apps/frontend-app`, server deploy riêng —
     không cần 2 git repo.
   - Commit độc lập: đã có (§9).
   - "2 git repo riêng" chủ yếu cần khi có ràng buộc **tổ chức** (phân quyền team,
     access control khác nhau), không phải ràng buộc kỹ thuật.

## Khi nào tách

Khi **contract đông cứng** — cuối Phase 1, sau khi 4 vấn đề mở (§11) đã chốt và
`Metrics` / `Collect*` không còn đổi thường xuyên. Hoặc sớm hơn nếu xuất hiện
ràng buộc tổ chức buộc phải tách.

## Lộ trình tách (khi quyết định làm)

Chiến lược phân phối `shared`: **GitHub Packages + semver**.

1. Bỏ `private: true` ở `packages/sdk/package.json`, đặt version semver
   (vd `1.0.0`), thêm `publishConfig` trỏ GitHub Packages registry.
   (`files: ["dist"]` đã sẵn.)
2. CI publish `@omni/sdk` khi push tag `shared-v*`.
3. Mỗi app đổi dep `"@omni/sdk": "workspace:*"` → `"^1.0.0"`.
4. Tách `apps/frontend-app` và `apps/server` ra repo riêng; mỗi repo có lockfile
   riêng, cấu hình `.npmrc` đọc GitHub Packages + auth token.
5. Bỏ phần workspace của shared khỏi monorepo (hoặc giữ shared ở repo riêng thứ 3).

> Phương án thay thế đã cân nhắc và loại:
>
> - **Git dependency** (install shared từ git URL + tag): nhẹ hạ tầng nhưng quản
>   version kém, cần `prepare` build dist khi install.
> - **Git submodule**: thao tác thủ công, dễ lệch version giữa các repo.

## Ghi chú dọn dẹp còn tồn

- `apps/frontend-app` còn `pnpm-workspace.yaml` + `pnpm-lock.yaml` nested do
  create-next-app sinh; `ignoredBuiltDependencies: [sharp, unrs-resolver]` nên
  chuyển lên root nếu muốn áp dụng toàn workspace.
