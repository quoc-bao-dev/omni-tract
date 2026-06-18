import type { CollectStatus } from '@omni/sdk';
import type { ContentRow, DashboardStat } from '@/features/dashboard/types';

const STAT_LABELS: { key: 'total' | CollectStatus; label: string }[] = [
  { key: 'total', label: 'Total URLs' },
  { key: 'success', label: 'Success' },
  { key: 'pending', label: 'Pending' },
  { key: 'failed', label: 'Failed' },
  { key: 'unsupported', label: 'Unsupported' },
];

/** Tính 5 stat card từ rows hiện có (không dùng dữ liệu mock). */
export function deriveStats(rows: ContentRow[]): DashboardStat[] {
  return STAT_LABELS.map(({ key, label }) => ({
    key,
    label,
    value: key === 'total' ? rows.length : rows.filter((r) => r.status === key).length,
  }));
}
