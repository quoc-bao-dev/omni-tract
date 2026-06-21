import type { ContentRow } from '@/features/dashboard/types';
import type { SortKey, SortState } from '@/stores/sort-store';

/** Giá trị dùng để so sánh của 1 cột (string | number | null). */
function sortValue(row: ContentRow, key: SortKey): string | number | null {
  switch (key) {
    case 'author':
      return row.author.name;
    case 'caption':
      return row.caption.text;
    case 'format':
      return row.type;
    case 'status':
      return row.status;
    case 'postedOn':
      return row.postedAt ?? null;
    case 'likes':
      return row.metrics.likes;
    case 'comments':
      return row.metrics.comments;
    case 'shares':
      return row.metrics.shares;
    case 'views':
      return row.metrics.views;
    case 'save':
      return row.metrics.saves;
    case 'play':
      return row.metrics.plays;
    default:
      return null;
  }
}

function isEmpty(v: string | number | null): boolean {
  return v === null || v === '';
}

/** Sắp xếp 1 bản sao rows theo `sort`. null/rỗng luôn xuống cuối (bất kể asc/desc). */
export function sortRows(rows: ContentRow[], sort: SortState | null): ContentRow[] {
  if (!sort) return rows;
  const { key, dir } = sort;
  const factor = dir === 'asc' ? 1 : -1;

  return [...rows].sort((a, b) => {
    const va = sortValue(a, key);
    const vb = sortValue(b, key);
    const ea = isEmpty(va);
    const eb = isEmpty(vb);
    if (ea && eb) return 0;
    if (ea) return 1; // a rỗng → xuống cuối
    if (eb) return -1;

    let cmp: number;
    if (typeof va === 'number' && typeof vb === 'number') {
      cmp = va - vb;
    } else if (key === 'postedOn') {
      cmp = new Date(va as string).getTime() - new Date(vb as string).getTime();
    } else {
      cmp = String(va).localeCompare(String(vb), 'vi');
    }
    return cmp * factor;
  });
}
