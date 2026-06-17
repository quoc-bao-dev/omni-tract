import type { ContentType, Platform } from '@omni/common';

/** Trạng thái thu thập của một nội dung (document §10 — partial failure). */
export type CollectStatus = 'success' | 'pending' | 'failed' | 'unsupported';

/** Bộ metric hiển thị trên bảng (snapshot mới nhất). */
export interface RowMetrics {
  reactions: number | null;
  comments: number | null;
  shares: number | null;
  views: number | null;
  saves: number | null;
  plays: number | null;
}

/** View-model 1 dòng bảng — dựng từ @omni/common Content + dữ liệu hiển thị. */
export interface ContentRow {
  id: string;
  platform: Platform;
  type: ContentType;
  url: string;
  author: { name: string; avatarUrl?: string; verified?: boolean };
  caption: { text: string; thumbnailUrl?: string };
  metrics: RowMetrics;
  status: CollectStatus;
}

export interface DashboardStat {
  key: 'total' | CollectStatus;
  label: string;
  value: number;
}
