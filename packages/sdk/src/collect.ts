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

/** Kết quả thu thập cho một URL — thành công. */
export interface CollectResultOk {
  ok: true;
  sourceUrl: string;
  contentId: string;
  platform: Platform;
  type: PostType;
  title?: string;
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
