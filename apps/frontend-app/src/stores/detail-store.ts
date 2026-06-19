import { create } from 'zustand';
import type { ContentRow } from '@/features/dashboard/types';

/** Trạng thái hiển thị nội dung chi tiết + video. */
type DetailView = 'closed' | 'drawer' | 'mini';

interface DetailStore {
  /** Dòng đang xem (drawer hoặc mini player). */
  row: ContentRow | null;
  view: DetailView;
  /** Video trong drawer có đang phát không (dùng để quyết định thu nhỏ khi đóng). */
  playing: boolean;

  /** Mở drawer chi tiết cho 1 dòng. */
  open: (row: ContentRow) => void;
  /** Người dùng đóng drawer: đang phát video → thu nhỏ ra góc; ngược lại đóng hẳn. */
  requestClose: () => void;
  /** Từ mini player → mở lại drawer ngay vị trí video đang phát. */
  expand: () => void;
  /** Đóng hẳn (dừng & gỡ video). */
  dismiss: () => void;
  setPlaying: (playing: boolean) => void;
}

export const useDetailStore = create<DetailStore>((set, get) => ({
  row: null,
  view: 'closed',
  playing: false,

  open: (row) => set({ row, view: 'drawer' }),
  requestClose: () => {
    const { playing, row } = get();
    if (playing && row?.videoUrl) set({ view: 'mini' });
    else set({ row: null, view: 'closed', playing: false });
  },
  expand: () => set({ view: 'drawer' }),
  dismiss: () => set({ row: null, view: 'closed', playing: false }),
  setPlaying: (playing) => set({ playing }),
}));
