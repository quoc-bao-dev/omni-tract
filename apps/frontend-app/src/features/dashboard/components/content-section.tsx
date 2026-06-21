'use client';

import { useMemo } from 'react';
import { ActiveFiltersBar, type FilterValue, useFilters } from '@/features/content-filter';
import { isWithinPostedRange } from '@/features/content-filter/date-range';
import { ProcessingBar } from '@/features/content-import';
import { ContentEmpty } from '@/features/dashboard/components/content-empty';
import { ContentTable } from '@/features/dashboard/components/content-table';
import { SearchBar } from '@/features/dashboard/components/search-bar';
import { sortRows } from '@/features/dashboard/sort';
import type { ContentRow } from '@/features/dashboard/types';
import { cn } from '@/lib/utils/cn';
import { foldVi } from '@/lib/utils/vietnamese';
import { useContentStore } from '@/stores/content-store';
import { useImportStore } from '@/stores/import-store';
import { useSearchStore } from '@/stores/search-store';
import { useSortStore } from '@/stores/sort-store';

/** Khớp free-text trên Author / Caption / URL — bỏ dấu + không phân biệt hoa thường (tiếng Việt). */
function matchesQuery(row: ContentRow, query: string): boolean {
  const q = foldVi(query.trim());
  if (!q) return true;
  return (
    foldVi(row.author.name).includes(q) ||
    foldVi(row.caption.text).includes(q) ||
    foldVi(row.url).includes(q)
  );
}

/**
 * Áp filter (client) lên rows + đổi giữa ActiveFiltersBar ↔ ProcessingBar.
 * platform/postType/status map trực tiếp (cùng enum @omni/sdk); postedOn lọc theo range ngày.
 */
function applyFilters(rows: ContentRow[], f: FilterValue): ContentRow[] {
  return rows.filter((row) => {
    if (f.platforms.length > 0 && !f.platforms.includes(row.platform)) return false;
    if (f.postTypes.length > 0 && !f.postTypes.includes(row.type)) return false;
    if (f.statuses.length > 0 && !f.statuses.includes(row.status)) return false;
    if (f.authors.length > 0 && !f.authors.includes(row.author.name)) return false;
    if (!isWithinPostedRange(row.postedAt, f.postedOn)) return false;
    return true;
  });
}

export function ContentSection() {
  const rows = useContentStore((s) => s.rows);
  const { value, isActive, clear } = useFilters();
  const sort = useSortStore((s) => s.sort);
  const query = useSearchStore((s) => s.query);
  const clearSearch = useSearchStore((s) => s.clear);
  const importing = useImportStore((s) => s.status === 'loading');
  const filtered = useMemo(
    () => applyFilters(rows, value).filter((r) => matchesQuery(r, query)),
    [rows, value, query],
  );
  const sorted = useMemo(() => sortRows(filtered, sort), [filtered, sort]);

  // Khi đang import luôn hiện bảng (kèm row pending); ngoài import → rỗng thì hiện empty state.
  const showEmpty = !importing && filtered.length === 0;
  const searching = query.trim() !== '';

  function clearAll() {
    clear();
    clearSearch();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {importing ? (
        <ProcessingBar />
      ) : (
        <>
          <SearchBar />
          {isActive ? <ActiveFiltersBar resultCount={filtered.length} /> : null}
        </>
      )}

      {showEmpty ? (
        <ContentEmpty
          filtered={isActive || searching}
          onClear={clearAll}
        />
      ) : (
        // Khi đang import: hiện toàn bộ rows (pending ở đầu). Khoá chọn/checkbox nhưng VẪN cho scroll.
        <div className={cn('min-h-0 flex-1', importing && 'select-none')}>
          <ContentTable
            rows={importing ? rows : sorted}
            locked={importing}
          />
        </div>
      )}
    </div>
  );
}
