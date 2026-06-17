'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { Drawer } from '@/components/ui/drawer';
import { CalendarIcon } from '@/components/ui/icon';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  EMPTY_FILTER,
  type FilterValue,
  PLATFORMS,
  POST_TYPES,
  STATUSES,
} from '@/features/content-filter/filters';
import { useFilters } from '@/stores/filter-store';

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
}

/** Drawer Filters (Figma 154:11316): Posted on + Platform/Post type/Status (multi-select). */
export function FilterDrawer({ open, onClose }: FilterDrawerProps) {
  const { value, apply } = useFilters();
  const [draft, setDraft] = useState<FilterValue>(value);

  // Mỗi lần mở: đồng bộ draft với filter đang áp.
  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  function patch(p: Partial<FilterValue>) {
    setDraft((v) => ({ ...v, ...p }));
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Filters"
      width={400}
      header={<h2 className="font-semibold text-ink text-xl tracking-tight">Filters</h2>}
      footer={
        <>
          <button
            type="button"
            onClick={() => setDraft(EMPTY_FILTER)}
            className="h-10 flex-1 rounded-md border border-border-subtle bg-surface px-3 font-semibold text-ink text-sm shadow-action hover:bg-surface-alt"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={() => {
              apply(draft);
              onClose();
            }}
            className="h-10 flex-1 rounded-md bg-ink px-3 font-semibold text-on-ink text-sm shadow-action hover:opacity-90"
          >
            Apply filters
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Posted on">
          <div className="flex h-10 w-full items-center gap-2 rounded-md bg-input px-3 shadow-input">
            <input
              type="text"
              aria-label="Posted on"
              value={draft.postedOn}
              onChange={(e) => patch({ postedOn: e.target.value })}
              placeholder="dd/mm/yyyy - dd/mm/yyyy"
              className="flex-1 bg-transparent font-medium text-ink text-sm placeholder:text-placeholder focus:outline-none"
            />
            <CalendarIcon className="size-5 shrink-0 text-text-secondary" />
          </div>
        </Field>

        <Field label="Platform type">
          <MultiSelect
            options={PLATFORMS}
            value={draft.platforms}
            onChange={(v) => patch({ platforms: v })}
            placeholder="- Select platform -"
          />
        </Field>

        <Field label="Post type">
          <MultiSelect
            options={POST_TYPES}
            value={draft.postTypes}
            onChange={(v) => patch({ postTypes: v })}
            placeholder="- Select post type -"
          />
        </Field>

        <Field label="Status">
          <MultiSelect
            options={STATUSES}
            value={draft.statuses}
            onChange={(v) => patch({ statuses: v })}
            placeholder="- Select status -"
          />
        </Field>
      </div>
    </Drawer>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-2">
      <span className="text-ink text-xs">{label}</span>
      {children}
    </div>
  );
}
