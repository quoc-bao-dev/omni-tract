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
   * Xoá record theo danh sách `sourceUrl` (khớp với `ContentRow.url`).
   * Trả về các record đã xoá để hỗ trợ Undo (khôi phục lại y nguyên).
   */
  async removeBySourceUrls(sourceUrls: string[]): Promise<StoredContent[]> {
    const db = await getDB();
    const tx = db.transaction(STORE_CONTENT, 'readwrite');
    const store = tx.objectStore(STORE_CONTENT);
    const index = store.index(IDX_SOURCE_URL);
    const removed: StoredContent[] = [];
    for (const url of sourceUrls) {
      const rec = await index.get(url);
      if (rec) {
        removed.push(rec);
        await store.delete(rec.contentId);
      }
    }
    await tx.done;
    return removed;
  },

  /** Ghi lại các record (Undo xoá) — put nguyên trạng. */
  async restore(records: StoredContent[]): Promise<void> {
    if (records.length === 0) return;
    const db = await getDB();
    const tx = db.transaction(STORE_CONTENT, 'readwrite');
    for (const rec of records) await tx.objectStore(STORE_CONTENT).put(rec);
    await tx.done;
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
          postId: result.postId ?? existing.postId,
          authorId: result.authorId ?? existing.authorId,
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
          postId: result.postId,
          authorId: result.authorId,
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
