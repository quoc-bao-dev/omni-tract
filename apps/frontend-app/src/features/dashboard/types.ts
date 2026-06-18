import type { CollectStatus, Metrics, Platform, PostType } from '@omni/sdk';

// Re-export domain types để các feature dùng tiện qua 1 chỗ.
export type { CollectStatus, Metrics, Platform, PostType } from '@omni/sdk';

/** View-model 1 dòng bảng — dựng từ @omni/sdk (Content + Metrics) + dữ liệu hiển thị. */
export interface ContentRow {
  id: string;
  platform: Platform;
  type: PostType;
  url: string;
  author: { name: string; avatarUrl?: string; verified?: boolean; profileUrl?: string };
  caption: { text: string; thumbnailUrl?: string };
  /** Posted on — ISO 8601 (rỗng nếu chưa lấy được). */
  postedAt?: string;
  /** Ảnh trong bài (URL CDN) — phần tử đầu dùng làm thumbnail. */
  images?: string[];
  /** Link phát video (chỉ post video) — hiển thị/nhúng, không tải. */
  videoUrl?: string;
  metrics: Metrics;
  status: CollectStatus;
}

export interface DashboardStat {
  key: 'total' | CollectStatus;
  label: string;
  value: number;
}
