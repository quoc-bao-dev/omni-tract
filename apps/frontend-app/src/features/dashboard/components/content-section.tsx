'use client';

import { useMemo } from 'react';
import { ActiveFiltersBar, type FilterValue, useFilters } from '@/features/content-filter';
import { ProcessingBar } from '@/features/content-import';
import { ContentTable } from '@/features/dashboard/components/content-table';
import type { ContentRow } from '@/features/dashboard/types';
import { useContentStore } from '@/stores/content-store';
import { useImportStore } from '@/stores/import-store';

/**
 * Áp filter (client) lên rows + đổi giữa ActiveFiltersBar ↔ ProcessingBar.
 * platform/postType/status map trực tiếp (cùng enum @omni/sdk); postedOn — TODO.
 */
function applyFilters(rows: ContentRow[], f: FilterValue): ContentRow[] {
  return rows.filter((row) => {
    if (f.platforms.length > 0 && !f.platforms.includes(row.platform)) return false;
    if (f.postTypes.length > 0 && !f.postTypes.includes(row.type)) return false;
    if (f.statuses.length > 0 && !f.statuses.includes(row.status)) return false;
    return true;
  });
}

export function ContentSection() {
  const rows = useContentStore((s) => s.rows);
  const { value, isActive } = useFilters();
  const importing = useImportStore((s) => s.status === 'loading');
  const filtered = useMemo(() => applyFilters(rows, value), [rows, value]);

  return (
    <div className="flex flex-col gap-3">
      {importing ? (
        <ProcessingBar />
      ) : isActive ? (
        <ActiveFiltersBar resultCount={filtered.length} />
      ) : null}

      {/* Khi đang import: hiện toàn bộ rows (pending ở đầu), khoá tương tác bảng. */}
      <div className={importing ? 'pointer-events-none select-none' : undefined}>
        <ContentTable rows={importing ? rows : filtered} />
      </div>
    </div>
  );
}
