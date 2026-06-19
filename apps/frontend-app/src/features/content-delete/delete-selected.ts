import { contentRepository } from '@/lib/db/content-repository';
import type { StoredContent } from '@/lib/db/schema';
import { logger } from '@/lib/utils/logger';
import { useContentStore } from '@/stores/content-store';
import { useSelectionStore } from '@/stores/selection-store';
import { useToastStore } from '@/stores/toast-store';

/**
 * Xoá các dòng đang chọn: bỏ khỏi bảng + IndexedDB (dedup theo URL), hiện toast thành công
 * kèm Undo (khôi phục lại cả UI lẫn DB). Lỗi DB không chặn xoá ở UI.
 */
export async function deleteSelected(): Promise<void> {
  const { selected } = useSelectionStore.getState();
  const rows = useContentStore.getState().rows.filter((r) => selected.has(r.id));
  if (rows.length === 0) return;

  const ids = rows.map((r) => r.id);
  const urls = rows.map((r) => r.url);

  // 1) bỏ khỏi UI + clear selection ngay
  useContentStore.getState().remove(ids);
  useSelectionStore.getState().clear();

  // 2) xoá khỏi IndexedDB, giữ record để Undo
  let removed: StoredContent[] = [];
  try {
    removed = await contentRepository.removeBySourceUrls(urls);
  } catch (err) {
    logger.error('delete content failed', err);
  }

  // 3) toast thành công + Undo
  const count = rows.length;
  useToastStore.getState().show({
    tone: 'success',
    message: `${count} ${count === 1 ? 'item' : 'items'} deleted successfully`,
    action: {
      label: 'Undo',
      onClick: () => {
        useContentStore.getState().prepend(rows);
        if (removed.length > 0) {
          contentRepository
            .restore(removed)
            .catch((err) => logger.error('undo restore failed', err));
        }
      },
    },
  });
}
