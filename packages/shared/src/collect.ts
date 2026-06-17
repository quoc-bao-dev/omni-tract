import type { Metrics } from './metrics.js';
import type { ContentType, Platform } from './platform.js';

/**
 * Contract giữa frontend và server cho việc thu thập dữ liệu (document §7).
 * Frontend chỉ làm việc qua interface này, không phụ thuộc cách server triển khai.
 *
 * ❓ TBD (vấn đề mở #3): input/output có đúng `list URL → metric chuẩn hoá`,
 * hay cần thêm trường (vd: phân biệt loại nội dung trước khi gửi)?
 */

/** Request: danh sách URL đã được validate & dedup ở client (document §4.1, §7). */
export interface CollectRequest {
  urls: string[];
}

/** Kết quả thu thập cho một URL — thành công. */
export interface CollectResultOk {
  source_url: string;
  ok: true;
  content_id: string;
  platform: Platform;
  type: ContentType;
  title?: string;
  /** Metric đã chuẩn hoá tại thời điểm server đo. */
  metrics: Metrics;
  /** Thời điểm server đo, ISO 8601 (UTC). */
  fetched_at: string;
}

/** Kết quả thu thập cho một URL — thất bại (partial failure, document §10). */
export interface CollectResultError {
  source_url: string;
  ok: false;
  error: CollectErrorCode;
  message?: string;
}

export type CollectErrorCode =
  | 'invalid_url'
  | 'unsupported_platform'
  | 'not_found'
  | 'private'
  | 'rate_limited'
  | 'fetch_failed'
  | 'internal_error';

export type CollectResult = CollectResultOk | CollectResultError;

/** Response: kết quả theo từng URL (cho phép partial failure → retry per-URL). */
export interface CollectResponse {
  results: CollectResult[];
}
