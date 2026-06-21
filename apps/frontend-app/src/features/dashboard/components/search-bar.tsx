'use client';

import { CloseIcon, SearchIcon } from '@/components/ui/icon';
import { useSearchStore } from '@/stores/search-store';

/** Thanh tìm kiếm bảng — lọc theo Author / Caption / URL (free-text). */
export function SearchBar() {
  const query = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.set);

  return (
    <div className="flex h-10 w-full items-center gap-2 rounded-xl border border-border bg-surface px-3 shadow-xs">
      <SearchIcon className="size-5 shrink-0 text-text-muted" />
      <input
        type="text"
        aria-label="Tìm kiếm"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Tìm theo tác giả, caption, URL…"
        className="flex-1 bg-transparent font-medium text-ink text-sm placeholder:text-text-muted focus:outline-none"
      />
      {query ? (
        <button
          type="button"
          aria-label="Xoá tìm kiếm"
          onClick={() => setQuery('')}
          className="grid size-5 shrink-0 place-items-center rounded text-text-muted hover:text-ink"
        >
          <CloseIcon className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
