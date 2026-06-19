'use client';

import { TrashIcon } from '@/components/ui/icon';
import { deleteSelected } from '@/features/content-delete/delete-selected';
import { useSelectionStore } from '@/stores/selection-store';

/** Nút Delete ở Navbar (Figma 154:9101) — chỉ hiện khi có dòng được chọn. */
export function DeleteButton() {
  const count = useSelectionStore((s) => s.selected.size);
  if (count === 0) return null;

  return (
    <button
      type="button"
      onClick={() => void deleteSelected()}
      className="inline-flex h-10 items-center justify-center gap-0.5 rounded-md bg-[rgba(255,53,2,0.1)] px-3 py-2.5 font-semibold text-[#d03e19] text-sm transition-colors hover:bg-[rgba(255,53,2,0.16)]"
    >
      <span className="flex size-5 items-center justify-center">
        <TrashIcon className="size-5" />
      </span>
      <span className="px-1">Delete ({count})</span>
    </button>
  );
}
