import type { IDBPDatabase, IDBPTransaction } from 'idb';
import {
  IDX_PLATFORM,
  IDX_SOURCE_URL,
  IDX_TYPE,
  IDX_UPDATED,
  type OmniDB,
  STORE_CONTENT,
} from './schema';

/**
 * Upgrade theo version (ARCHITECTURE §8). Chạy trong transaction `versionchange`.
 * Mỗi lần bump DB_VERSION ⇒ thêm một nhánh `if (oldVersion < N)`.
 */
export function runMigrations(
  db: IDBPDatabase<OmniDB>,
  oldVersion: number,
  _newVersion: number | null,
  _tx: IDBPTransaction<OmniDB, ArrayLike<'content'>, 'versionchange'>,
): void {
  if (oldVersion < 1) {
    const store = db.createObjectStore(STORE_CONTENT, { keyPath: 'contentId' });
    store.createIndex(IDX_PLATFORM, 'platform');
    store.createIndex(IDX_TYPE, 'type');
    store.createIndex(IDX_UPDATED, 'updatedAt');
    // Không unique: dedup URL xử lý ở repository (giữ 1 record/URL theo contentId).
    store.createIndex(IDX_SOURCE_URL, 'sourceUrl', { unique: false });
  }
}
