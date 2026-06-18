import type { CollectStatus } from '@omni/sdk';
import { create } from 'zustand';
import type { ContentRow } from '@/features/dashboard/types';
import { collect } from '@/lib/api/collect';
import { parsePlatform } from '@/lib/url/platform';
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

    // 2) tạo row pending + đưa lên đầu bảng
    const pending: { id: string; url: string }[] = [];
    const rows: ContentRow[] = urls.map((url, i) => {
      const id = `imp_${Date.now().toString(36)}_${i}`;
      pending.push({ id, url });
      const host =
        url
          .replace(/^https?:\/\//, '')
          .replace(/^www\./, '')
          .split('/')[0] ?? url;
      return {
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
      };
    });
    useContentStore.getState().prepend(rows);

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
            caption: { text: r.text ?? r.title ?? match.url, thumbnailUrl: r.images?.[0] },
            postedAt: r.postedAt,
            images: r.images,
            videoUrl: r.videoUrl,
            metrics: r.metrics,
          });
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
