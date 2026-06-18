import type { CollectResultOk, Snapshot } from '@omni/sdk';
import { getDB } from './database';
import { IDX_SOURCE_URL, IDX_UPDATED, STORE_CONTENT, type StoredContent } from './schema';

/**
 * Repository nội dung — tầng DUY NHẤT chạm IndexedDB (ARCHITECTURE §8).
 * UI/hook chỉ gọi qua đây, không thao tác store thô.
 */
export const contentRepository = {
  /** Tất cả record, mới fetch nhất trước (sort theo updatedAt giảm dần). */
  async list(): Promise<StoredContent[]> {
    const db = await getDB();
    const items = await db.getAllFromIndex(STORE_CONTENT, IDX_UPDATED); // tăng dần
    return items.reverse();
  },

  async get(contentId: string): Promise<StoredContent | undefined> {
    const db = await getDB();
    return db.get(STORE_CONTENT, contentId);
  },

  async getBySourceUrl(sourceUrl: string): Promise<StoredContent | undefined> {
    const db = await getDB();
    return db.getFromIndex(STORE_CONTENT, IDX_SOURCE_URL, sourceUrl);
  },

  /**
   * Lưu kết quả thu thập. **Dedup theo URL**: nếu đã có record (khớp `contentId`
   * hoặc `sourceUrl`) → APPEND 1 snapshot vào record cũ + làm tươi trường hiển thị
   * (KHÔNG tạo record mới). Nếu chưa có → tạo record với snapshot đầu tiên.
   * Trả về record sau khi ghi.
   */
  async appendFromCollect(result: CollectResultOk): Promise<StoredContent> {
    const db = await getDB();
    const tx = db.transaction(STORE_CONTENT, 'readwrite');
    const store = tx.objectStore(STORE_CONTENT);

    const existing =
      (await store.get(result.contentId)) ??
      (await store.index(IDX_SOURCE_URL).get(result.sourceUrl));

    const snapshot: Snapshot = { timestamp: result.fetchedAt, metrics: result.metrics };

    const merged: StoredContent = existing
      ? {
          // giữ contentId & lịch sử snapshots của record cũ
          ...existing,
          platform: result.platform,
          type: result.type,
          title: result.title ?? existing.title,
          author: result.author ?? existing.author,
          postedAt: result.postedAt ?? existing.postedAt,
          status: 'success',
          text: result.text ?? existing.text,
          images: result.images ?? existing.images,
          videoUrl: result.videoUrl ?? existing.videoUrl,
          updatedAt: result.fetchedAt,
          snapshots: [...existing.snapshots, snapshot],
        }
      : {
          contentId: result.contentId,
          platform: result.platform,
          type: result.type,
          sourceUrl: result.sourceUrl,
          title: result.title,
          author: result.author,
          postedAt: result.postedAt,
          status: 'success',
          text: result.text,
          images: result.images,
          videoUrl: result.videoUrl,
          updatedAt: result.fetchedAt,
          snapshots: [snapshot],
        };

    await store.put(merged);
    await tx.done;
    return merged;
  },
};
