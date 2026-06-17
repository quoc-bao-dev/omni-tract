/**
 * Bộ chỉ số (metric) chuẩn hoá cho một nội dung tại một thời điểm.
 *
 * ❓ TBD (document §8, vấn đề mở #4): danh sách metric mục tiêu cho post/video
 * chưa được chốt. Để mở rộng an toàn, schema dùng các trường tuỳ chọn (optional)
 * cho tới khi chốt. Khi chốt sẽ siết lại type và bump schema version.
 */
export interface Metrics {
  reactions?: number;
  comments?: number;
  shares?: number;
  views?: number;
  reach?: number;
  /** Các chỉ số thô khác chưa được mô hình hoá tường minh. */
  [key: string]: number | undefined;
}

/**
 * Một lần đo metric tại một thời điểm — đơn vị dựng "tăng trưởng" (document §1, §8).
 */
export interface Snapshot {
  /** Thời điểm đo, ISO 8601 (UTC). */
  timestamp: string;
  metrics: Metrics;
}
