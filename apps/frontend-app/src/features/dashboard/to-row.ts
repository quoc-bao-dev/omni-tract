import type { Metrics } from '@omni/sdk';
import type { StoredContent } from '@/lib/db/schema';
import type { ContentRow } from './types';

const EMPTY_METRICS: Metrics = {
  likes: null,
  comments: null,
  shares: null,
  views: null,
  saves: null,
  plays: null,
};

/** Host hiển thị từ URL (bỏ scheme + www). */
function host(url: string): string {
  return (
    url
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0] ?? url
  );
}

/** Dựng view-model bảng từ record IndexedDB: metric lấy snapshot mới nhất. */
export function toContentRow(c: StoredContent): ContentRow {
  const latest = c.snapshots.at(-1)?.metrics ?? EMPTY_METRICS;
  return {
    id: c.contentId,
    platform: c.platform,
    type: c.type,
    url: c.sourceUrl,
    author: { name: host(c.sourceUrl) },
    caption: { text: c.text ?? c.title ?? c.sourceUrl, thumbnailUrl: c.images?.[0] },
    postedAt: c.postedAt,
    images: c.images,
    videoUrl: c.videoUrl,
    metrics: latest,
    status: c.status,
  };
}
