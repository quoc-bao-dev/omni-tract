'use client';

import { TrashIcon, XCircleIcon } from '@/components/ui/icon';
import { FILTER_GROUPS, labelOf } from '@/features/content-filter/filters';
import { useFilters } from '@/stores/filter-store';

/** Thanh filter đang áp (Figma 143:9094): nhóm tag + Clear + "N results found". */
export function ActiveFiltersBar({ resultCount }: { resultCount: number }) {
  const { value, apply, removeTag, clear } = useFilters();

  return (
    <div className="flex items-center gap-6 rounded-xl border border-border bg-surface px-4 py-3">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {value.postedOn ? (
          <div className="flex items-center gap-2 rounded-lg border border-border-subtle border-dashed p-2">
            <span className="font-medium text-sm text-text-neutral">Posted on:</span>
            <span className="inline-flex items-center gap-0.5 rounded-full border border-border-subtle bg-surface py-0.5 pr-1.5 pl-2.5 font-medium text-ink text-sm shadow-action">
              {value.postedOn}
              <button
                type="button"
                aria-label="Bỏ lọc ngày"
                onClick={() => apply({ ...value, postedOn: '' })}
                className="grid size-4 place-items-center text-text-muted hover:text-ink"
              >
                <XCircleIcon className="size-4" />
              </button>
            </span>
          </div>
        ) : null}

        {FILTER_GROUPS.map((group) => {
          const selected = value[group.key];
          if (selected.length === 0) return null;
          return (
            <div
              key={group.key}
              className="flex items-center gap-2 rounded-lg border border-border-subtle border-dashed p-2"
            >
              <span className="font-medium text-sm text-text-neutral">{group.label}</span>
              {selected.map((val) => (
                <span
                  key={val}
                  className="inline-flex items-center gap-0.5 rounded-full border border-border-subtle bg-surface py-0.5 pr-1.5 pl-2.5 font-medium text-ink text-sm shadow-action"
                >
                  {labelOf(group.options, val)}
                  <button
                    type="button"
                    aria-label={`Bỏ ${labelOf(group.options, val)}`}
                    onClick={() => removeTag(group.key, val)}
                    className="grid size-4 place-items-center text-text-muted hover:text-ink"
                  >
                    <XCircleIcon className="size-4" />
                  </button>
                </span>
              ))}
            </div>
          );
        })}

        <button
          type="button"
          onClick={clear}
          className="inline-flex h-10 items-center gap-1 rounded-full px-3 font-semibold text-danger-strong text-sm hover:bg-surface-alt"
        >
          <TrashIcon className="size-5" />
          Clear
        </button>
      </div>

      <p className="shrink-0 whitespace-nowrap text-sm">
        <span className="font-semibold text-ink">{resultCount}</span>{' '}
        <span className="font-medium text-text-faint">results found</span>
      </p>
    </div>
  );
}
