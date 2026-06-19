import { create } from 'zustand';

/** Cột có thể ẩn/hiện (check & No. luôn hiện). */
export type ColumnKey =
  | 'url'
  | 'author'
  | 'caption'
  | 'format'
  | 'postedOn'
  | 'likes'
  | 'comments'
  | 'shares'
  | 'views'
  | 'save'
  | 'play'
  | 'status';

/** Thứ tự + nhãn cột (dùng cho Settings + bảng). */
export const COLUMN_META: { key: ColumnKey; label: string }[] = [
  { key: 'url', label: 'URL' },
  { key: 'author', label: 'Author/Page' },
  { key: 'format', label: 'Format' },
  { key: 'status', label: 'Status' },
  { key: 'postedOn', label: 'Posted on' },
  { key: 'likes', label: 'Likes' },
  { key: 'comments', label: 'Comments' },
  { key: 'shares', label: 'Shares' },
  { key: 'views', label: 'Views' },
  { key: 'save', label: 'Save' },
  { key: 'play', label: 'Play' },
];

export type ColumnVisibility = Record<ColumnKey, boolean>;

const DEFAULT_VISIBILITY: ColumnVisibility = {
  url: true,
  author: true,
  caption: true,
  format: true,
  postedOn: true,
  likes: true,
  comments: true,
  shares: true,
  views: true,
  save: true,
  play: false,
  status: true,
};

const STORAGE_KEY = 'omni-tract:columns';

function load(): ColumnVisibility {
  if (typeof window === 'undefined') return DEFAULT_VISIBILITY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_VISIBILITY;
    return { ...DEFAULT_VISIBILITY, ...(JSON.parse(raw) as Partial<ColumnVisibility>) };
  } catch {
    return DEFAULT_VISIBILITY;
  }
}

function persist(v: ColumnVisibility): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
  } catch {
    // localStorage đầy/chặn → bỏ qua, vẫn giữ state trong phiên.
  }
}

interface ColumnStore {
  visible: ColumnVisibility;
  /** Đã nạp từ localStorage chưa (tránh đọc localStorage trong initializer → lệch SSR). */
  hydrated: boolean;
  /** Nạp giá trị đã lưu vào store (gọi 1 lần sau khi mount ở client). */
  hydrate: () => void;
  toggle: (key: ColumnKey) => void;
  setVisible: (v: ColumnVisibility) => void;
}

/**
 * State ẩn/hiện cột bảng — chia sẻ giữa Settings và ContentTable, lưu localStorage.
 * KHÔNG đọc localStorage trong initializer (server prerender không có `window`):
 * khởi tạo DEFAULT, rồi `hydrate()` lúc mount để áp giá trị persisted.
 */
export const useColumnStore = create<ColumnStore>((set, get) => ({
  visible: DEFAULT_VISIBILITY,
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return;
    set({ visible: load(), hydrated: true });
  },
  toggle: (key) =>
    set((s) => {
      const next = { ...s.visible, [key]: !s.visible[key] };
      persist(next);
      return { visible: next };
    }),
  setVisible: (v) => {
    persist(v);
    set({ visible: v });
  },
}));
