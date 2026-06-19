'use client';

import { useMemo } from 'react';
import { ActiveFiltersBar, type FilterValue, useFilters } from '@/features/content-filter';
import { isWithinPostedRange } from '@/features/content-filter/date-range';
import { ProcessingBar } from '@/features/content-import';
import { ContentEmpty } from '@/features/dashboard/components/content-empty';
import { ContentTable } from '@/features/dashboard/components/content-table';
import type { ContentRow } from '@/features/dashboard/types';
import { cn } from '@/lib/utils/cn';
import { useContentStore } from '@/stores/content-store';
import { useImportStore } from '@/stores/import-store';

/**
 * Áp filter (client) lên rows + đổi giữa ActiveFiltersBar ↔ ProcessingBar.
 * platform/postType/status map trực tiếp (cùng enum @omni/sdk); postedOn lọc theo range ngày.
 */
function applyFilters(rows: ContentRow[], f: FilterValue): ContentRow[] {
  return rows.filter((row) => {
    if (f.platforms.length > 0 && !f.platforms.includes(row.platform)) return false;
    if (f.postTypes.length > 0 && !f.postTypes.includes(row.type)) return false;
    if (f.statuses.length > 0 && !f.statuses.includes(row.status)) return false;
    if (!isWithinPostedRange(row.postedAt, f.postedOn)) return false;
    return true;
  });
}

export function ContentSection() {
  const rows = useContentStore((s) => s.rows);
  const { value, isActive, clear } = useFilters();
  const importing = useImportStore((s) => s.status === 'loading');
  const filtered = useMemo(() => applyFilters(rows, value), [rows, value]);

  // Khi đang import luôn hiện bảng (kèm row pending); ngoài import → rỗng thì hiện empty state.
  const showEmpty = !importing && filtered.length === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {importing ? (
        <ProcessingBar />
      ) : isActive ? (
        <ActiveFiltersBar resultCount={filtered.length} />
      ) : null}

      {showEmpty ? (
        <ContentEmpty
          filtered={isActive}
          onClear={clear}
        />
      ) : (
        // Khi đang import: hiện toàn bộ rows (pending ở đầu). Khoá chọn/checkbox nhưng VẪN cho scroll.
        <div className={cn('min-h-0 flex-1', importing && 'select-none')}>
          <ContentTable
            rows={importing ? rows : filtered}
            locked={importing}
          />
        </div>
      )}
    </div>
  );
}
