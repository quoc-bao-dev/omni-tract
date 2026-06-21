import { Author, CollectResultOk, Metrics, Platform, PostType } from '@omni/sdk';

/** Dữ liệu thô 1 adapter lấy được, trước khi chuẩn hoá thành CollectResultOk. */
export interface RawContent {
  sourceUrl: string;
  /** ID bài đăng gốc (post_id) — dùng để sinh contentId ổn định. */
  postId?: string;
  /** ID tác giả/page gốc (actor_id). */
  authorId?: string;
  platform: Platform;
  type: PostType;
  title?: string;
  /** Tác giả bài. */
  author?: Author;
  /** Nội dung text bài viết. */
  text?: string;
  /** Ảnh trong bài (URL CDN). */
  images?: string[];
  /** ISO 8601. */
  postedAt?: string;
  /** Link phát video (chỉ post video). */
  videoUrl?: string;
  metrics: Metrics;
}

/**
 * Gom dữ liệu thô từ adapter → `CollectResultOk` chuẩn (@omni/sdk):
 * tự sinh `contentId` và stamp `fetchedAt`. Mọi adapter đi qua đây để đồng nhất output.
 */
export function toCollectResultOk(raw: RawContent): CollectResultOk {
  // contentId ưu tiên suy ra từ postId (ổn định → dedup đúng); fallback random nếu thiếu.
  const rand = Math.floor(Math.random() * 1e6).toString(36);
  const contentId = raw.postId
    ? `${raw.platform}_${raw.postId}`
    : `${raw.platform}_${Date.now().toString(36)}_${rand}`;
  return {
    ok: true,
    sourceUrl: raw.sourceUrl,
    contentId,
    postId: raw.postId,
    authorId: raw.authorId,
    platform: raw.platform,
    type: raw.type,
    title: raw.title,
    author: raw.author,
    text: raw.text,
    images: raw.images,
    postedAt: raw.postedAt,
    videoUrl: raw.videoUrl,
    metrics: raw.metrics,
    fetchedAt: new Date().toISOString(),
  };
}
