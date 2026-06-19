'use client';

import { Button } from '@/components/ui/button';
import { RefreshIcon } from '@/components/ui/icon';
import { useContentStore } from '@/stores/content-store';
import { useImportStore } from '@/stores/import-store';
import { useSelectionStore } from '@/stores/selection-store';

/**
 * Nút Refresh ở Navbar (cạnh Delete) — chỉ hiện khi có dòng được chọn.
 * Click → re-collect lại URL của các dòng đó (startImport dedup theo URL → cập nhật tại chỗ
 * + append snapshot vào IndexedDB, KHÔNG tạo dòng mới).
 */
export function RefreshButton() {
  const count = useSelectionStore((s) => s.selected.size);
  const busy = useImportStore((s) => s.status === 'loading');
  const startImport = useImportStore((s) => s.startImport);
  if (count === 0) return null;

  function handleRefresh() {
    const { selected } = useSelectionStore.getState();
    const urls = useContentStore
      .getState()
      .rows.filter((r) => selected.has(r.id))
      .map((r) => r.url);
    if (urls.length === 0) return;
    useSelectionStore.getState().clear();
    void startImport(urls);
  }

  return (
    <Button
      variant="tertiary"
      leadingIcon={<RefreshIcon />}
      disabled={busy}
      onClick={handleRefresh}
    >
      Refresh ({count})
    </Button>
  );
}
