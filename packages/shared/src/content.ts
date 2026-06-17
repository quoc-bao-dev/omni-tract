import type { Snapshot } from './metrics.js';
import type { ContentType, Platform } from './platform.js';

/**
 * Mô hình lưu trữ nội dung dạng time-series trong IndexedDB (document §8).
 * Mỗi lần fetch thủ công → append một phần tử vào `snapshots` (không ghi đè).
 */
export interface Content {
  /** Định danh nội dung đã chuẩn hoá — key của object store. */
  content_id: string;
  platform: Platform;
  type: ContentType;
  source_url: string;
  title?: string;
  snapshots: Snapshot[];
}

/** Phiên bản schema của object store — phục vụ versioning + migration (document §8, §10). */
export const CONTENT_SCHEMA_VERSION = 1 as const;
