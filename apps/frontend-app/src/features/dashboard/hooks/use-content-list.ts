'use client';

import { useEffect } from 'react';
import { contentRepository } from '@/lib/db/content-repository';
import { logger } from '@/lib/utils/logger';
import { useContentStore } from '@/stores/content-store';
import { toContentRow } from '../to-row';

/**
 * Nạp nội dung đã lưu từ IndexedDB vào content-store khi mount (1 lần) —
 * dữ liệu sống sót qua reload. Lỗi DB → log + bỏ qua (UI vẫn chạy).
 */
export function useHydrateContent(): void {
  const hydrate = useContentStore((s) => s.hydrate);

  useEffect(() => {
    let active = true;
    contentRepository
      .list()
      .then((items) => {
        if (active) hydrate(items.map(toContentRow));
      })
      .catch((err) => {
        logger.error('hydrate content failed', err);
        if (active) hydrate([]); // vẫn đánh dấu xong để app hiện UI (rỗng)
      });
    return () => {
      active = false;
    };
  }, [hydrate]);
}
