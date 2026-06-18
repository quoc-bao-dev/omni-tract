import type { Content } from '@omni/sdk';
import type { DBSchema } from 'idb';

/**
 * Hằng số schema IndexedDB (ARCHITECTURE §8). Đổi store/index ⇒ bump DB_VERSION
 * và thêm bước trong migrations.ts.
 */
export const DB_NAME = 'omni-tract';
export const DB_VERSION = 1;

export const STORE_CONTENT = 'content';

export const IDX_PLATFORM = 'by-platform';
export const IDX_TYPE = 'by-type';
export const IDX_UPDATED = 'by-updated-at';
export const IDX_SOURCE_URL = 'by-source-url';

/**
 * Record lưu trong store `content`: kế thừa `Content` của @omni/sdk
 * (key = `contentId`, `snapshots` append-only) + các trường hiển thị "mới nhất"
 * để dựng lại bảng khi hydrate mà không cần gọi lại server.
 */
export interface StoredContent extends Content {
  /** Tác giả bài (lần fetch gần nhất). */
  author?: { name: string; profilePicture?: string; profileUrl?: string };
  /** Caption/body đầy đủ lần fetch gần nhất. */
  text?: string;
  /** Ảnh trong bài (URL CDN) — phần tử đầu dùng làm thumbnail. */
  images?: string[];
  /** Link phát video (chỉ post video). */
  videoUrl?: string;
  /** Thời điểm fetch gần nhất, ISO 8601 — phục vụ index by-updated-at. */
  updatedAt: string;
}

/** Khai báo store + index để idb suy luận type cho mọi thao tác. */
export interface OmniDB extends DBSchema {
  content: {
    key: string; // contentId
    value: StoredContent;
    indexes: {
      'by-platform': string;
      'by-type': string;
      'by-updated-at': string;
      'by-source-url': string;
    };
  };
}
