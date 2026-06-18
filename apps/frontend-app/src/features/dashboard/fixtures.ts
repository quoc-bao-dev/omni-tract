import type { ContentRow, DashboardStat } from '@/features/dashboard/types';

/**
 * Dữ liệu mẫu để dựng UI (backend @omni/api chưa wire).
 * Khi có dữ liệu thật: thay bằng hook đọc IndexedDB (xem ARCHITECTURE.md §8).
 */
const CAPTION = 'POV bạn vừa nhận lương và đi siêu thị mua đồ ăn với...';

function metrics(base: number, status: ContentRow['status']): ContentRow['metrics'] {
  if (status !== 'success') {
    return { likes: null, comments: null, shares: null, views: null, saves: null, plays: null };
  }
  return {
    likes: base + 200,
    comments: base + 900,
    shares: base + 900,
    views: base + 900,
    saves: base + 900,
    plays: base + 900,
  };
}

const STATUSES: ContentRow['status'][] = [
  'success',
  'unsupported',
  'success',
  'pending',
  'success',
  'success',
  'success',
  'success',
];

const ROWS: { url: string; platform: ContentRow['platform']; type: ContentRow['type'] }[] = [
  { url: 'tiktok.com/@minhanle/video/728847...', platform: 'tiktok', type: 'video' },
  { url: 'facebook.com/peakovicphotos/313...', platform: 'facebook', type: 'photo' },
  { url: 'threads.net/@design.daily/post/C...', platform: 'threads', type: 'text' },
  { url: 'instagram.com/p/C8aE2LpAj9z/', platform: 'instagram', type: 'carousel' },
  { url: 'youtube.com/watch?v=Da4r7yV0Jps', platform: 'youtube', type: 'video' },
  { url: 'x.com/elonmusk/status/180414291...', platform: 'x', type: 'text' },
  { url: 'linkedin.com/in/john-doe/recent/', platform: 'linkedin', type: 'link' },
  { url: 'reddit.com/r/pccry/wiki/megathread/posts/', platform: 'reddit', type: 'link' },
];

export const MOCK_ROWS: ContentRow[] = ROWS.map((r, i) => {
  const status = STATUSES[i] ?? 'success';
  return {
    id: `c_${i + 1}`,
    platform: r.platform,
    type: r.type,
    url: r.url,
    author: { name: 'Peachy Trần', verified: true },
    caption: { text: CAPTION },
    metrics: metrics(420_000, status),
    status,
  };
});

export const MOCK_STATS: DashboardStat[] = [
  { key: 'total', label: 'Total URLs', value: 8 },
  { key: 'success', label: 'Success', value: 8 },
  { key: 'pending', label: 'Pending', value: 3 },
  { key: 'failed', label: 'Failed', value: 1 },
  { key: 'unsupported', label: 'Unsupported', value: 0 },
];
