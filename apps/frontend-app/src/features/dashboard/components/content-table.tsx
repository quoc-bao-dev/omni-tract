'use client';

import { useRef, useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  BroadcastIcon,
  CommentIcon,
  ImageIcon,
  LayersIcon,
  LikeIcon,
  LinkIcon,
  PanelRightIcon,
  PlayIcon,
  SaveIcon,
  ShareIcon,
  TextIcon,
  VerifiedIcon,
  VideoCamIcon,
  ViewIcon,
} from '@/components/ui/icon';
import { DetailDrawer } from '@/features/content-detail';
import type { CollectStatus, ContentRow, Metrics, PostType } from '@/features/dashboard/types';
import { cn } from '@/lib/utils/cn';
import { formatCompact, formatDate } from '@/lib/utils/format';
import { type ColumnKey, useColumnStore } from '@/stores/column-store';
import { useSelectionStore } from '@/stores/selection-store';

const STATUS_META: Record<CollectStatus, { tone: BadgeTone; label: string }> = {
  success: { tone: 'success', label: 'Success' },
  pending: { tone: 'warning', label: 'Pending' },
  failed: { tone: 'danger', label: 'Failed' },
  unsupported: { tone: 'neutral', label: 'Unsupported' },
};

const FORMAT_META: Record<PostType, { label: string; Icon: typeof CommentIcon }> = {
  photo: { label: 'Photo', Icon: ImageIcon },
  text: { label: 'Text', Icon: TextIcon },
  link: { label: 'Link', Icon: LinkIcon },
  livestream: { label: 'Livestream', Icon: BroadcastIcon },
  video: { label: 'Video', Icon: VideoCamIcon },
  carousel: { label: 'Carousel', Icon: LayersIcon },
};

const METRIC_COLUMNS: { key: keyof Metrics; label: string; Icon: typeof CommentIcon }[] = [
  { key: 'likes', label: 'Likes', Icon: LikeIcon },
  { key: 'comments', label: 'Comments', Icon: CommentIcon },
  { key: 'shares', label: 'Shares', Icon: ShareIcon },
  { key: 'views', label: 'Views', Icon: ViewIcon },
  { key: 'saves', label: 'Save', Icon: SaveIcon },
  { key: 'plays', label: 'Play', Icon: PlayIcon },
];

/** Map cột metric (Metrics) → key ẩn/hiện trong Settings. */
const METRIC_COL: Record<keyof Metrics, ColumnKey> = {
  likes: 'likes',
  comments: 'comments',
  shares: 'shares',
  views: 'views',
  saves: 'save',
  plays: 'play',
};

// Bề rộng cố định (px) cho từng cột — dùng cho <colgroup> (table-fixed) + tính offset sticky.
const COL_W = {
  check: 48,
  no: 56,
  url: 210,
  author: 190,
  caption: 260,
  format: 140,
  posted: 130,
  metric: 120,
  status: 140,
} as const;

// sticky top-0 → header đóng băng khi cuộn dọc; bg đục để rows không lộ qua.
const headBase =
  'sticky top-0 z-20 h-11 bg-surface-alt px-3 text-left align-middle text-xs font-medium text-text-secondary';
const cellBase = 'h-[72px] px-3 align-middle text-sm text-text-primary';

type StickyKey = 'check' | 'no' | 'url' | 'author' | 'caption';

export function ContentTable({
  rows,
  locked = false,
}: {
  rows: ContentRow[];
  /** Khoá chọn dòng/checkbox/mở chi tiết (đang import) — KHÔNG khoá scroll. */
  locked?: boolean;
}) {
  const selected = useSelectionStore((s) => s.selected);
  const toggleSelect = useSelectionStore((s) => s.toggle);
  const selectRange = useSelectionStore((s) => s.selectRange);
  const setSelection = useSelectionStore((s) => s.set);
  const clearSelection = useSelectionStore((s) => s.clear);
  const [active, setActive] = useState<ContentRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Dòng "neo" cho shift+click — chọn cả khoảng từ neo tới dòng vừa bấm.
  const anchorRef = useRef<string | null>(null);
  // Đã scroll ngang chưa → hiện shadow ở ranh giới cột đóng băng.
  const [scrolled, setScrolled] = useState(false);
  const visible = useColumnStore((s) => s.visible);

  function openRow(row: ContentRow) {
    setActive(row);
    setDrawerOpen(true);
  }

  /** Chọn dòng: shift+click → chọn cả khoảng tới neo; click thường → toggle + đặt neo mới. */
  function selectRow(e: { shiftKey: boolean }, id: string, index: number) {
    if (e.shiftKey && anchorRef.current !== null) {
      const anchorIdx = rows.findIndex((r) => r.id === anchorRef.current);
      if (anchorIdx !== -1) {
        const [a, b] = anchorIdx <= index ? [anchorIdx, index] : [index, anchorIdx];
        selectRange(rows.slice(a, b + 1).map((r) => r.id));
        window.getSelection()?.removeAllRanges(); // tránh bôi đen text khi giữ shift
        return;
      }
    }
    toggleSelect(id);
    anchorRef.current = id;
  }

  const allChecked = rows.length > 0 && selected.size === rows.length;

  // Offset sticky động: chỉ cộng dồn bề rộng các cột sticky ĐANG HIỆN (check & No. luôn hiện).
  const stickyOrder: { key: StickyKey; w: number; show: boolean }[] = [
    { key: 'check', w: COL_W.check, show: true },
    { key: 'no', w: COL_W.no, show: true },
    { key: 'url', w: COL_W.url, show: visible.url },
    { key: 'author', w: COL_W.author, show: visible.author },
    { key: 'caption', w: COL_W.caption, show: visible.caption },
  ];
  const sticky: Partial<Record<StickyKey, number>> = {};
  let acc = 0;
  let lastStickyKey: StickyKey = 'no';
  for (const c of stickyOrder) {
    if (!c.show) continue;
    sticky[c.key] = acc;
    acc += c.w;
    lastStickyKey = c.key;
  }
  const visibleMetrics = METRIC_COLUMNS.filter((c) => visible[METRIC_COL[c.key]]);

  // Tổng bề rộng cột đang hiện → đặt cứng width bảng để table-fixed KHÔNG co cột khi scroll
  // (cột render đúng COL_W ⇒ offset sticky khớp tuyệt đối, không lệch/đè).
  const totalWidth =
    COL_W.check +
    COL_W.no +
    (visible.url ? COL_W.url : 0) +
    (visible.author ? COL_W.author : 0) +
    (visible.caption ? COL_W.caption : 0) +
    (visible.format ? COL_W.format : 0) +
    (visible.postedOn ? COL_W.posted : 0) +
    visibleMetrics.length * COL_W.metric +
    (visible.status ? COL_W.status : 0);

  return (
    <>
      <div
        className="h-full overflow-auto rounded-xl border border-border bg-surface shadow-xs"
        onScroll={(e) => setScrolled(e.currentTarget.scrollLeft > 0)}
      >
        <table
          className="w-full table-fixed border-collapse"
          style={{ minWidth: totalWidth }}
        >
          <colgroup>
            <col style={{ width: COL_W.check }} />
            <col style={{ width: COL_W.no }} />
            {visible.url ? <col style={{ width: COL_W.url }} /> : null}
            {visible.author ? <col style={{ width: COL_W.author }} /> : null}
            {visible.caption ? <col style={{ width: COL_W.caption }} /> : null}
            {visible.format ? <col style={{ width: COL_W.format }} /> : null}
            {visible.status ? <col style={{ width: COL_W.status }} /> : null}
            {visible.postedOn ? <col style={{ width: COL_W.posted }} /> : null}
            {visibleMetrics.map((c) => (
              <col
                key={c.key}
                style={{ width: COL_W.metric }}
              />
            ))}
          </colgroup>
          <thead>
            <tr className="bg-surface-alt">
              <Th
                sticky={sticky.check}
                divider={lastStickyKey === 'check'}
                shadow={scrolled}
                className="w-12"
              >
                <Checkbox
                  aria-label="Chọn tất cả"
                  checked={allChecked}
                  disabled={locked}
                  onChange={() =>
                    allChecked ? clearSelection() : setSelection(rows.map((r) => r.id))
                  }
                />
              </Th>
              <Th
                sticky={sticky.no}
                divider={lastStickyKey === 'no'}
                shadow={scrolled}
                className="w-14"
              >
                No.
              </Th>
              {visible.url ? (
                <Th
                  sticky={sticky.url}
                  divider={lastStickyKey === 'url'}
                  shadow={scrolled}
                  className="w-[210px]"
                >
                  URL
                </Th>
              ) : null}
              {visible.author ? (
                <Th
                  sticky={sticky.author}
                  divider={lastStickyKey === 'author'}
                  shadow={scrolled}
                  className="w-[190px]"
                >
                  Author/Page
                </Th>
              ) : null}
              {visible.caption ? (
                <Th
                  sticky={sticky.caption}
                  divider={lastStickyKey === 'caption'}
                  shadow={scrolled}
                  className="w-[260px]"
                >
                  Caption
                </Th>
              ) : null}
              {visible.format ? <th className={cn(headBase, 'w-[140px]')}>Format</th> : null}
              {visible.status ? <th className={cn(headBase, 'w-[140px]')}>Status</th> : null}
              {visible.postedOn ? <th className={cn(headBase, 'w-[130px]')}>Posted on</th> : null}
              {visibleMetrics.map((c) => (
                <th
                  key={c.key}
                  className={cn(headBase, 'w-[120px]')}
                >
                  <span className="inline-flex items-center gap-1">
                    <c.Icon className="size-3.5 text-text-muted" />
                    {c.label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, i) => {
              const isSel = selected.has(row.id);
              const status = STATUS_META[row.status];
              return (
                <tr
                  key={row.id}
                  onClick={locked ? undefined : (e) => selectRow(e, row.id, i)}
                  className={cn(
                    'group border-border border-t',
                    locked ? 'cursor-default' : 'cursor-pointer',
                    isSel ? 'bg-surface-alt' : 'hover:bg-surface-alt/60',
                  )}
                >
                  <Td
                    sticky={sticky.check}
                    divider={lastStickyKey === 'check'}
                    shadow={scrolled}
                    selected={isSel}
                  >
                    <Checkbox
                      aria-label={`Chọn dòng ${i + 1}`}
                      checked={isSel}
                      disabled={locked}
                      onClick={(e) => {
                        e.stopPropagation(); // tránh tr onClick chạy 2 lần
                        selectRow(e, row.id, i);
                      }}
                      onChange={() => {}}
                    />
                  </Td>
                  <Td
                    sticky={sticky.no}
                    divider={lastStickyKey === 'no'}
                    shadow={scrolled}
                    selected={isSel}
                  >
                    <span className="text-text-secondary">{i + 1}</span>
                  </Td>
                  {visible.url ? (
                    <Td
                      sticky={sticky.url}
                      divider={lastStickyKey === 'url'}
                      shadow={scrolled}
                      selected={isSel}
                    >
                      <span className="line-clamp-2 max-w-[186px] text-text-secondary">
                        {row.url}
                      </span>
                    </Td>
                  ) : null}
                  {visible.author ? (
                    <Td
                      sticky={sticky.author}
                      divider={lastStickyKey === 'author'}
                      shadow={scrolled}
                      selected={isSel}
                    >
                      <span className="flex items-center gap-2">
                        <Avatar
                          src={row.author.avatarUrl}
                          alt={row.author.name}
                          fallback={row.author.name.charAt(0)}
                          size={32}
                        />
                        {row.author.profileUrl ? (
                          <a
                            href={row.author.profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="truncate font-medium hover:underline"
                          >
                            {row.author.name}
                          </a>
                        ) : (
                          <span className="truncate font-medium">{row.author.name}</span>
                        )}
                        {row.author.verified ? (
                          <VerifiedIcon className="shrink-0 text-info" />
                        ) : null}
                      </span>
                    </Td>
                  ) : null}
                  {visible.caption ? (
                    <Td
                      sticky={sticky.caption}
                      divider={lastStickyKey === 'caption'}
                      shadow={scrolled}
                      selected={isSel}
                    >
                      <span className="flex items-center gap-2">
                        {row.caption.thumbnailUrl ? (
                          // biome-ignore lint/performance/noImgElement: URL fbcdn có token ký/hết hạn, không hợp next/image.
                          <img
                            src={row.caption.thumbnailUrl}
                            alt=""
                            className="size-9 shrink-0 rounded-md object-cover"
                          />
                        ) : (
                          <span
                            className="size-9 shrink-0 rounded-md bg-ink"
                            aria-hidden
                          />
                        )}
                        <span className="line-clamp-2 max-w-[200px] text-text-primary">
                          {row.caption.text}
                        </span>
                      </span>
                      {/* Mở chi tiết — hiện khi hover row (group), absolute trong ô caption. */}
                      <button
                        type="button"
                        aria-label={`Mở chi tiết dòng ${i + 1}`}
                        disabled={locked}
                        onClick={(e) => {
                          e.stopPropagation();
                          openRow(row);
                        }}
                        className={cn(
                          'absolute top-1/2 right-3 inline-flex -translate-y-1/2 items-center gap-1 rounded border border-border-subtle bg-surface px-1 py-1 font-medium text-ink text-xs shadow-[1px_4px_8px_rgba(0,0,0,0.08)] outline-none',
                          'pointer-events-none opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100',
                          'focus-visible:pointer-events-auto focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-info',
                        )}
                      >
                        <PanelRightIcon className="size-4" />
                        View
                      </button>
                    </Td>
                  ) : null}
                  {visible.format ? (
                    <td className={cellBase}>
                      {(() => {
                        const fmt = FORMAT_META[row.type];
                        return (
                          <span className="inline-flex items-center gap-1.5">
                            <fmt.Icon className="size-4 text-text-muted" />
                            {fmt.label}
                          </span>
                        );
                      })()}
                    </td>
                  ) : null}
                  {visible.status ? (
                    <td className={cellBase}>
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </td>
                  ) : null}
                  {visible.postedOn ? (
                    <td className={cn(cellBase, 'text-text-secondary')}>
                      {formatDate(row.postedAt)}
                    </td>
                  ) : null}
                  {visibleMetrics.map((c) => (
                    <td
                      key={c.key}
                      className={cellBase}
                    >
                      {formatCompact(row.metrics[c.key])}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <DetailDrawer
        row={active}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}

/** Lớp gradient phủ mép phải cột đóng băng cuối — chỉ hiện khi đã scroll ngang. */
const BOUNDARY_SHADOW =
  'after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-4 after:translate-x-full after:bg-gradient-to-r after:from-black/12 after:to-transparent';

function Th({
  children,
  sticky,
  divider,
  shadow,
  className,
}: {
  children?: React.ReactNode;
  sticky?: number;
  divider?: boolean;
  shadow?: boolean;
  className?: string;
}) {
  return (
    <th
      className={cn(
        headBase,
        // ô vừa đóng băng cột (trái) vừa đóng băng header (trên) → góc, z cao nhất.
        sticky !== undefined && 'z-30',
        divider && shadow && BOUNDARY_SHADOW,
        className,
      )}
      style={sticky !== undefined ? { left: sticky } : undefined}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  sticky,
  selected,
  divider,
  shadow,
}: {
  children?: React.ReactNode;
  sticky?: number;
  selected?: boolean;
  divider?: boolean;
  shadow?: boolean;
}) {
  return (
    <td
      className={cn(
        cellBase,
        sticky !== undefined && cn('sticky z-10', selected ? 'bg-surface-alt' : 'bg-surface'),
        divider && shadow && BOUNDARY_SHADOW,
      )}
      style={sticky !== undefined ? { left: sticky } : undefined}
    >
      {children}
    </td>
  );
}
