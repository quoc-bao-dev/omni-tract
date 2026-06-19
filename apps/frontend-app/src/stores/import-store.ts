import type { CollectResult, CollectStatus } from '@omni/sdk';
import { create } from 'zustand';
import type { ContentRow } from '@/features/dashboard/types';
import { collectStream } from '@/lib/api/collect';
import { contentRepository } from '@/lib/db/content-repository';
import { parsePlatform } from '@/lib/url/platform';
import { logger } from '@/lib/utils/logger';
import { useContentStore } from '@/stores/content-store';
import { useFilterStore } from '@/stores/filter-store';

type ImportStatus = 'idle' | 'loading' | 'done';

interface ImportStore {
  status: ImportStatus;
  total: number;
  progress: number; // 0..100
  hasErrors: boolean;
  startImport: (urls: string[]) => Promise<void>;
  stop: () => void;
}

let controller: AbortController | null = null;

export const useImportStore = create<ImportStore>((set, get) => ({
  status: 'idle',
  total: 0,
  progress: 0,
  hasErrors: false,

  async startImport(urls) {
    if (get().status === 'loading' || urls.length === 0) return;

    // 1) clear toàn bộ filter
    useFilterStore.getState().clear();

    // 2) tạo row pending; URL TRÙNG (đã có trong bảng) → tái dùng row cũ, KHÔNG tạo mới
    const contentStore = useContentStore.getState();
    const pending: { id: string; url: string }[] = [];
    const newRows: ContentRow[] = [];
    urls.forEach((url, i) => {
      const existing = contentStore.rows.find((r) => r.url === url);
      if (existing) {
        pending.push({ id: existing.id, url });
        contentStore.patchRow(existing.id, { status: 'pending' });
        return;
      }
      const id = `imp_${Date.now().toString(36)}_${i}`;
      pending.push({ id, url });
      const host =
        url
          .replace(/^https?:\/\//, '')
          .replace(/^www\./, '')
          .split('/')[0] ?? url;
      newRows.push({
        id,
        platform: parsePlatform(url) ?? 'facebook',
        type: 'link',
        url,
        author: { name: host },
        caption: { text: url },
        metrics: {
          likes: null,
          comments: null,
          shares: null,
          views: null,
          saves: null,
          plays: null,
        },
        status: 'pending',
      });
    });
    if (newRows.length) useContentStore.getState().prepend(newRows);

    // 3) loading — progress THẬT, tăng dần theo từng URL stream về
    set({ status: 'loading', total: urls.length, progress: 0, hasErrors: false });

    // áp 1 kết quả lên UI ngay khi nhận được (streaming)
    let errors = 0;
    let done = 0;
    const total = urls.length;
    const remaining = new Set(pending.map((p) => p.url));

    const applyResult = (r: CollectResult) => {
      const match = pending.find((p) => p.url === r.sourceUrl);
      if (!match) return;
      remaining.delete(r.sourceUrl);

      if (r.ok) {
        useContentStore.getState().patchRow(match.id, {
          status: 'success',
          platform: r.platform,
          type: r.type,
          ...(r.author && {
            author: {
              name: r.author.name,
              avatarUrl: r.author.profilePicture,
              profileUrl: r.author.profileUrl,
            },
          }),
          caption: { text: r.text ?? r.title ?? match.url, thumbnailUrl: r.images?.[0] },
          postedAt: r.postedAt,
          images: r.images,
          videoUrl: r.videoUrl,
          metrics: r.metrics,
        });
        // lưu IndexedDB (fire-and-forget) — không chặn UI; lỗi quota/DB chỉ log
        contentRepository.appendFromCollect(r).catch((err) => {
          logger.error('persist content failed', err);
        });
      } else {
        errors++;
        const status: CollectStatus = r.error === 'unsupported_platform' ? 'unsupported' : 'failed';
        useContentStore.getState().patchRow(match.id, { status });
      }

      done++;
      set({ progress: Math.min(99, Math.round((done / total) * 100)) });
    };

    // 4) gọi API streaming
    controller = new AbortController();
    try {
      await collectStream(
        urls,
        (event) => {
          if (event.type === 'result') applyResult(event.result);
        },
        controller.signal,
      );
      set({ hasErrors: errors > 0 });
    } catch {
      // lỗi mạng/abort → đánh dấu các URL CHƯA có kết quả là failed (giữ row đã xong)
      for (const p of pending) {
        if (remaining.has(p.url)) useContentStore.getState().patchRow(p.id, { status: 'failed' });
      }
      set({ hasErrors: true });
    } finally {
      set({ status: 'done', progress: 100 });
      setTimeout(() => {
        if (get().status === 'done') set({ status: 'idle', progress: 0, total: 0 });
      }, 900);
    }
  },

  stop() {
    controller?.abort();
    set({ status: 'idle', progress: 0, total: 0 });
  },
}));
