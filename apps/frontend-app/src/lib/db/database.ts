import { type IDBPDatabase, openDB } from 'idb';
import { runMigrations } from './migrations';
import { DB_NAME, DB_VERSION, type OmniDB } from './schema';

/** Lỗi domain khi IndexedDB không khả dụng (SSR/build, hoặc trình duyệt chặn). */
export class DbUnavailableError extends Error {
  constructor() {
    super('IndexedDB không khả dụng trong môi trường hiện tại');
    this.name = 'DbUnavailableError';
  }
}

let dbPromise: Promise<IDBPDatabase<OmniDB>> | null = null;

/**
 * Mở (1 lần, cached) kết nối IndexedDB. Chỉ gọi ở client ('use client') —
 * Server Component/build không có `indexedDB`.
 */
export function getDB(): Promise<IDBPDatabase<OmniDB>> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new DbUnavailableError());
  }
  if (!dbPromise) {
    dbPromise = openDB<OmniDB>(DB_NAME, DB_VERSION, {
      upgrade: runMigrations,
      blocking() {
        // Tab khác đang giữ version cũ → đóng để chúng nâng cấp được.
        dbPromise?.then((db) => db.close());
        dbPromise = null;
      },
    });
  }
  return dbPromise;
}
