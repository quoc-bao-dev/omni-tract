/** Trạng thái thu thập của một nội dung (document §10 — partial failure). */
export type CollectStatus = 'success' | 'pending' | 'failed' | 'unsupported';

export const COLLECT_STATUSES: readonly CollectStatus[] = [
  'success',
  'pending',
  'failed',
  'unsupported',
];
