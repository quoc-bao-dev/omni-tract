import type { CollectStatus, Metrics, PostType } from '@omni/sdk';
import type { StoredContent } from '@/lib/db/schema';

const TYPE_LABEL: Record<PostType, string> = {
  photo: 'Photo',
  text: 'Text',
  link: 'Link',
  livestream: 'Livestream',
  video: 'Video',
  carousel: 'Carousel',
};

const STATUS_LABEL: Record<CollectStatus, string> = {
  success: 'Success',
  pending: 'Pending',
  failed: 'Failed',
  unsupported: 'Unsupported',
};

const EMPTY_METRICS: Metrics = {
  likes: null,
  comments: null,
  shares: null,
  views: null,
  saves: null,
  plays: null,
};

/** Metric "final" = snapshot mới nhất (theo yêu cầu: chỉ lấy dữ liệu cuối, không cần full history). */
function latest(c: StoredContent): Metrics {
  return c.snapshots.at(-1)?.metrics ?? EMPTY_METRICS;
}

/** Key field export — ổn định để lưu cấu hình (đừng đổi tên đã phát hành). */
export type ExportFieldKey =
  | 'id'
  | 'postId'
  | 'authorId'
  | 'url'
  | 'platform'
  | 'type'
  | 'author'
  | 'authorUrl'
  | 'title'
  | 'caption'
  | 'postedAt'
  | 'fetchedAt'
  | 'snapshotCount'
  | 'likes'
  | 'comments'
  | 'shares'
  | 'views'
  | 'saves'
  | 'plays'
  | 'status';

/** Một field export: lấy giá trị từ StoredContent (bản ghi IndexedDB đầy đủ). */
export interface ExportField {
  key: ExportFieldKey;
  header: string;
  width: number;
  value: (c: StoredContent) => string | number | null;
}

/**
 * Registry TẤT CẢ field xuất được (gồm field backend không hiển thị trên UI).
 * Thứ tự ở đây cũng là thứ tự cột trong file export.
 */
export const EXPORT_FIELDS: ExportField[] = [
  { key: 'id', header: 'ID', width: 22, value: (c) => c.contentId },
  { key: 'postId', header: 'Post ID', width: 18, value: (c) => c.postId ?? '' },
  { key: 'authorId', header: 'Author ID', width: 18, value: (c) => c.authorId ?? '' },
  { key: 'url', header: 'URL', width: 42, value: (c) => c.sourceUrl },
  { key: 'platform', header: 'Platform', width: 14, value: (c) => c.platform },
  { key: 'type', header: 'Type', width: 12, value: (c) => TYPE_LABEL[c.type] },
  { key: 'author', header: 'Author', width: 24, value: (c) => c.author?.name ?? '' },
  { key: 'authorUrl', header: 'Author URL', width: 36, value: (c) => c.author?.profileUrl ?? '' },
  { key: 'title', header: 'Title', width: 30, value: (c) => c.title ?? '' },
  { key: 'caption', header: 'Caption', width: 50, value: (c) => c.text ?? '' },
  { key: 'postedAt', header: 'Posted on', width: 16, value: (c) => c.postedAt ?? '' },
  { key: 'fetchedAt', header: 'Fetched at', width: 16, value: (c) => c.updatedAt },
  { key: 'likes', header: 'Likes', width: 12, value: (c) => latest(c).likes },
  { key: 'comments', header: 'Comments', width: 12, value: (c) => latest(c).comments },
  { key: 'shares', header: 'Shares', width: 12, value: (c) => latest(c).shares },
  { key: 'views', header: 'Views', width: 12, value: (c) => latest(c).views },
  { key: 'saves', header: 'Saves', width: 12, value: (c) => latest(c).saves },
  { key: 'plays', header: 'Plays', width: 12, value: (c) => latest(c).plays },
  { key: 'status', header: 'Status', width: 14, value: (c) => STATUS_LABEL[c.status] },
];

/** Tập key mặc định (tất cả field) — dùng cho store cấu hình export. */
export const ALL_FIELD_KEYS: ExportFieldKey[] = EXPORT_FIELDS.map((f) => f.key);

/** Lọc registry theo cấu hình (giữ thứ tự registry). Rỗng → trả full để không xuất file trống cột. */
export function resolveFields(enabled: Record<ExportFieldKey, boolean>): ExportField[] {
  const picked = EXPORT_FIELDS.filter((f) => enabled[f.key]);
  return picked.length > 0 ? picked : EXPORT_FIELDS;
}

/** Chuẩn hoá giá trị ô về chuỗi (null/undefined → ''). */
export function cellText(v: string | number | null | undefined): string {
  return v === null || v === undefined ? '' : String(v);
}
