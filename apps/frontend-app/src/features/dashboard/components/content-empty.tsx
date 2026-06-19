'use client';

import { Button } from '@/components/ui/button';
import { FilterIcon, SearchIcon } from '@/components/ui/icon';

/**
 * Empty state cho bảng khi không có dòng nào để hiển thị.
 * - `filtered`: có bộ lọc đang bật mà không khớp gì → gợi ý xoá lọc.
 * - ngược lại: bảng rỗng (không có nội dung trong phạm vi hiện tại).
 */
export function ContentEmpty({ filtered, onClear }: { filtered: boolean; onClear: () => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 rounded-xl border border-border bg-surface px-6 py-16 text-center shadow-xs">
      <span className="grid size-14 place-items-center rounded-full bg-surface-alt text-text-muted">
        {filtered ? <FilterIcon className="size-6" /> : <SearchIcon className="size-6" />}
      </span>
      <div className="flex max-w-sm flex-col gap-1">
        <p className="font-semibold text-base text-text-primary">
          {filtered ? 'Không có nội dung khớp bộ lọc' : 'Chưa có nội dung'}
        </p>
        <p className="text-sm text-text-secondary">
          {filtered
            ? 'Thử nới lỏng hoặc xoá bớt điều kiện lọc để xem thêm kết quả.'
            : 'Nội dung đã thu thập sẽ hiển thị ở đây.'}
        </p>
      </div>
      {filtered ? (
        <Button
          variant="tertiary"
          onClick={onClear}
        >
          Xoá bộ lọc
        </Button>
      ) : null}
    </div>
  );
}
