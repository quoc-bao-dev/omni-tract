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

/**
 * Cột đóng băng trái (sticky) — KHÔNG cho kéo đổi thứ tự (giữ logic sticky của bảng).
 * caption luôn hiện & cố định nên không nằm trong danh sách Settings.
 */
export const FROZEN_COLUMNS: ColumnKey[] = ['url', 'author'];

/** Cột được phép kéo đổi thứ tự (mọi cột trừ cột đóng băng). */
export const REORDERABLE_COLUMNS: ColumnKey[] = [
  'format',
  'status',
  'postedOn',
  'likes',
  'comments',
  'shares',
  'views',
  'save',
  'play',
];

/** Nhãn cột tra nhanh theo key (từ COLUMN_META). */
export const COLUMN_LABEL: Record<ColumnKey, string> = Object.fromEntries(
  COLUMN_META.map((c) => [c.key, c.label]),
) as Record<ColumnKey, string>;

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
  play: true,
  status: true,
};

const STORAGE_KEY = 'omni-tract:columns';
const ORDER_KEY = 'omni-tract:column-order';

/** Thứ tự mặc định = thứ tự khai báo trong REORDERABLE_COLUMNS. */
const DEFAULT_ORDER: ColumnKey[] = [...REORDERABLE_COLUMNS];

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

/**
 * Nạp order đã lưu + "vệ sinh": bỏ key lạ, bổ sung key còn thiếu (khi thêm cột mới)
 * → luôn đủ & đúng tập REORDERABLE_COLUMNS, tránh mất/đúp cột trên bảng.
 */
function loadOrder(): ColumnKey[] {
  if (typeof window === 'undefined') return DEFAULT_ORDER;
  try {
    const raw = window.localStorage.getItem(ORDER_KEY);
    if (!raw) return DEFAULT_ORDER;
    const saved = (JSON.parse(raw) as ColumnKey[]).filter((k) => REORDERABLE_COLUMNS.includes(k));
    const missing = REORDERABLE_COLUMNS.filter((k) => !saved.includes(k));
    return [...saved, ...missing];
  } catch {
    return DEFAULT_ORDER;
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

function persistOrder(order: ColumnKey[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ORDER_KEY, JSON.stringify(order));
  } catch {
    // bỏ qua như persist()
  }
}

interface ColumnStore {
  visible: ColumnVisibility;
  /** Thứ tự cột có thể kéo (chỉ gồm REORDERABLE_COLUMNS). */
  order: ColumnKey[];
  /** Đã nạp từ localStorage chưa (tránh đọc localStorage trong initializer → lệch SSR). */
  hydrated: boolean;
  /** Nạp giá trị đã lưu vào store (gọi 1 lần sau khi mount ở client). */
  hydrate: () => void;
  toggle: (key: ColumnKey) => void;
  setVisible: (v: ColumnVisibility) => void;
  setOrder: (order: ColumnKey[]) => void;
}

/**
 * State ẩn/hiện cột bảng — chia sẻ giữa Settings và ContentTable, lưu localStorage.
 * KHÔNG đọc localStorage trong initializer (server prerender không có `window`):
 * khởi tạo DEFAULT, rồi `hydrate()` lúc mount để áp giá trị persisted.
 */
export const useColumnStore = create<ColumnStore>((set, get) => ({
  visible: DEFAULT_VISIBILITY,
  order: DEFAULT_ORDER,
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return;
    set({ visible: load(), order: loadOrder(), hydrated: true });
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
  setOrder: (order) => {
    persistOrder(order);
    set({ order });
  },
}));
