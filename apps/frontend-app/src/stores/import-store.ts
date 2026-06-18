import type { CollectStatus } from '@omni/sdk';
import { create } from 'zustand';
import type { ContentRow } from '@/features/dashboard/types';
import { collect } from '@/lib/api/collect';
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

let timer: ReturnType<typeof setInterval> | null = null;
let controller: AbortController | null = null;

function stopTimer() {
  if (timer) clearInterval(timer);
  timer = null;
}

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

    // 3) loading + progress giả lập (ramp tới 90% trong khi chờ)
    set({ status: 'loading', total: urls.length, progress: 6, hasErrors: false });
    stopTimer();
    timer = setInterval(() => {
      const p = get().progress;
      if (p < 90) set({ progress: Math.min(90, p + Math.max(1, (90 - p) * 0.08)) });
    }, 250);

    // 4) gọi API mock
    controller = new AbortController();
    try {
      const { results } = await collect(urls, controller.signal);
      let errors = 0;
      for (const r of results) {
        const match = pending.find((p) => p.url === r.sourceUrl);
        if (!match) continue;
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
          // lưu IndexedDB: dedup theo URL → append snapshot vào record cũ (không tạo mới)
          try {
            await contentRepository.appendFromCollect(r);
          } catch (err) {
            // lỗi quota/DB không làm hỏng import — UI đã cập nhật
            logger.error('persist content failed', err);
          }
        } else {
          errors++;
          const status: CollectStatus =
            r.error === 'unsupported_platform' ? 'unsupported' : 'failed';
          useContentStore.getState().patchRow(match.id, { status });
        }
      }
      set({ hasErrors: errors > 0 });
    } catch {
      // lỗi mạng/abort → đánh dấu toàn bộ pending là failed
      for (const p of pending) useContentStore.getState().patchRow(p.id, { status: 'failed' });
      set({ hasErrors: true });
    } finally {
      stopTimer();
      set({ status: 'done', progress: 100 });
      setTimeout(() => {
        if (get().status === 'done') set({ status: 'idle', progress: 0, total: 0 });
      }, 900);
    }
  },

  stop() {
    controller?.abort();
    stopTimer();
    set({ status: 'idle', progress: 0, total: 0 });
  },
}));
