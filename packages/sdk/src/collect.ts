import type { Metrics } from './metrics.js';
import type { Platform } from './platform.js';
import type { PostType } from './post-type.js';

/**
 * Contract giữa frontend và server cho việc thu thập dữ liệu (document §7).
 * Frontend chỉ làm việc qua interface này, không phụ thuộc cách server triển khai.
 */

/** Request: danh sách URL đã validate & dedup ở client (document §4.1, §7). */
export interface CollectRequest {
  urls: string[];
}

export type CollectErrorCode =
  | 'invalid_url'
  | 'unsupported_platform'
  | 'not_found'
  | 'private'
  | 'rate_limited'
  | 'fetch_failed'
  | 'internal_error';

/** Tác giả bài đăng (page/user). */
export interface Author {
  name: string;
  /** Ảnh đại diện (URL CDN). */
  profilePicture?: string;
  /** Link trang cá nhân/fanpage. */
  profileUrl?: string;
}

/** Kết quả thu thập cho một URL — thành công. */
export interface CollectResultOk {
  ok: true;
  sourceUrl: string;
  contentId: string;
  platform: Platform;
  type: PostType;
  title?: string;
  /** Tác giả bài (nếu lấy được). */
  author?: Author;
  /** Nội dung text bài viết (caption/body đầy đủ). */
  text?: string;
  /** Ảnh trong bài (URL CDN) — phần tử đầu dùng làm thumbnail. */
  images?: string[];
  /** Thời điểm nội dung được đăng (Posted on), ISO 8601. */
  postedAt?: string;
  /** Link phát video (chỉ post video) — để hiển thị/nhúng, KHÔNG tải về. */
  videoUrl?: string;
  metrics: Metrics;
  /** Thời điểm server đo, ISO 8601 (UTC). */
  fetchedAt: string;
}

/** Kết quả thu thập cho một URL — thất bại (partial failure, document §10). */
export interface CollectResultError {
  ok: false;
  sourceUrl: string;
  error: CollectErrorCode;
  message?: string;
}

export type CollectResult = CollectResultOk | CollectResultError;

/** Response: kết quả theo từng URL (cho phép partial failure → retry per-URL). */
export interface CollectResponse {
  results: CollectResult[];
}
