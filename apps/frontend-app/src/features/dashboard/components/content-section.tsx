'use client';

import { useMemo } from 'react';
import { ActiveFiltersBar, type FilterValue, useFilters } from '@/features/content-filter';
import { ContentTable } from '@/features/dashboard/components/content-table';
import type { ContentRow } from '@/features/dashboard/types';

/**
 * Áp filter (client) lên rows + hiện thanh ActiveFiltersBar khi có filter.
 * Lưu ý: platform/status map trực tiếp; postType/postedOn cần data thật để map đầy đủ (TODO).
 */
function applyFilters(rows: ContentRow[], f: FilterValue): ContentRow[] {
  return rows.filter((row) => {
    if (f.platforms.length > 0 && !f.platforms.includes(row.platform)) return false;
    if (f.statuses.length > 0 && !f.statuses.includes(row.status)) return false;
    if (f.postTypes.length > 0) {
      const wantsVideo = f.postTypes.includes('video');
      const wantsOther = f.postTypes.some((t) => t !== 'video');
      const ok = (wantsVideo && row.type === 'video') || (wantsOther && row.type === 'post');
      if (!ok) return false;
    }
    return true;
  });
}

export function ContentSection({ rows }: { rows: ContentRow[] }) {
  const { value, isActive } = useFilters();
  const filtered = useMemo(() => applyFilters(rows, value), [rows, value]);

  return (
    <div className="flex flex-col gap-3">
      {isActive ? <ActiveFiltersBar resultCount={filtered.length} /> : null}
      <ContentTable rows={filtered} />
    </div>
  );
}
