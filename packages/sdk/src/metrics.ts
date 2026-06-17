/**
 * Bộ chỉ số (metric) chuẩn hoá cho một nội dung tại một thời điểm.
 * `null` = nền tảng không có / chưa lấy được chỉ số đó.
 */
export interface Metrics {
  reactions: number | null;
  comments: number | null;
  shares: number | null;
  views: number | null;
  saves: number | null;
  plays: number | null;
}

/** Một lần đo metric tại một thời điểm — đơn vị dựng "tăng trưởng" (document §1, §8). */
export interface Snapshot {
  /** Thời điểm đo, ISO 8601 (UTC). */
  timestamp: string;
  metrics: Metrics;
}
