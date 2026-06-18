'use client';

import { useState } from 'react';
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

// Offset (px) cột sticky bên trái — cộng dồn bề rộng, không hardcode để không lệch khi đổi width.
const STICKY = {
  check: 0,
  no: COL_W.check,
  url: COL_W.check + COL_W.no,
  author: COL_W.check + COL_W.no + COL_W.url,
  caption: COL_W.check + COL_W.no + COL_W.url + COL_W.author,
} as const;

const headBase = 'h-11 px-3 text-left align-middle text-xs font-medium text-text-secondary';
const cellBase = 'h-[72px] px-3 align-middle text-sm text-text-primary';

export function ContentTable({ rows }: { rows: ContentRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<ContentRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  function openRow(row: ContentRow) {
    setActive(row);
    setDrawerOpen(true);
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allChecked = rows.length > 0 && selected.size === rows.length;

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-xs">
        <table className="w-full min-w-[1440px] table-fixed border-collapse">
          <colgroup>
            <col style={{ width: COL_W.check }} />
            <col style={{ width: COL_W.no }} />
            <col style={{ width: COL_W.url }} />
            <col style={{ width: COL_W.author }} />
            <col style={{ width: COL_W.caption }} />
            <col style={{ width: COL_W.format }} />
            <col style={{ width: COL_W.posted }} />
            {METRIC_COLUMNS.map((c) => (
              <col
                key={c.key}
                style={{ width: COL_W.metric }}
              />
            ))}
            <col style={{ width: COL_W.status }} />
          </colgroup>
          <thead>
            <tr className="bg-surface-alt">
              <Th
                sticky={STICKY.check}
                className="w-12"
              >
                <Checkbox
                  aria-label="Chọn tất cả"
                  checked={allChecked}
                  onChange={() =>
                    setSelected(allChecked ? new Set() : new Set(rows.map((r) => r.id)))
                  }
                />
              </Th>
              <Th
                sticky={STICKY.no}
                className="w-14"
              >
                No.
              </Th>
              <Th
                sticky={STICKY.url}
                className="w-[210px]"
              >
                URL
              </Th>
              <Th
                sticky={STICKY.author}
                className="w-[190px]"
              >
                Author/Page
              </Th>
              <Th
                sticky={STICKY.caption}
                divider
                className="w-[260px]"
              >
                Caption
              </Th>
              <th className={cn(headBase, 'w-[140px]')}>Format</th>
              <th className={cn(headBase, 'w-[130px]')}>Posted on</th>
              {METRIC_COLUMNS.map((c) => (
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
              <th className={cn(headBase, 'w-[140px]')}>Status</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, i) => {
              const isSel = selected.has(row.id);
              const status = STATUS_META[row.status];
              return (
                <tr
                  key={row.id}
                  onClick={() => toggle(row.id)}
                  className={cn(
                    'group cursor-pointer border-border border-t',
                    isSel ? 'bg-surface-alt' : 'hover:bg-surface-alt/60',
                  )}
                >
                  <Td
                    sticky={STICKY.check}
                    selected={isSel}
                  >
                    <Checkbox
                      aria-label={`Chọn dòng ${i + 1}`}
                      checked={isSel}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => toggle(row.id)}
                    />
                  </Td>
                  <Td
                    sticky={STICKY.no}
                    selected={isSel}
                  >
                    <span className="text-text-secondary">{i + 1}</span>
                  </Td>
                  <Td
                    sticky={STICKY.url}
                    selected={isSel}
                  >
                    <span className="block max-w-[186px] truncate text-text-secondary">
                      {row.url}
                    </span>
                  </Td>
                  <Td
                    sticky={STICKY.author}
                    selected={isSel}
                  >
                    <span className="flex items-center gap-2">
                      <Avatar
                        fallback={row.author.name.charAt(0)}
                        size={32}
                      />
                      <span className="truncate font-medium">{row.author.name}</span>
                      {row.author.verified ? <VerifiedIcon className="shrink-0 text-info" /> : null}
                    </span>
                  </Td>
                  <Td
                    sticky={STICKY.caption}
                    selected={isSel}
                    divider
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
                  <td className={cn(cellBase, 'text-text-secondary')}>
                    {formatDate(row.postedAt)}
                  </td>
                  {METRIC_COLUMNS.map((c) => (
                    <td
                      key={c.key}
                      className={cellBase}
                    >
                      {formatCompact(row.metrics[c.key])}
                    </td>
                  ))}
                  <td className={cellBase}>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </td>
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

function Th({
  children,
  sticky,
  divider,
  className,
}: {
  children?: React.ReactNode;
  sticky?: number;
  divider?: boolean;
  className?: string;
}) {
  return (
    <th
      className={cn(
        headBase,
        sticky !== undefined && 'sticky z-20 bg-surface-alt',
        divider && 'border-border border-r',
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
}: {
  children?: React.ReactNode;
  sticky?: number;
  selected?: boolean;
  divider?: boolean;
}) {
  return (
    <td
      className={cn(
        cellBase,
        sticky !== undefined && cn('sticky z-10', selected ? 'bg-surface-alt' : 'bg-surface'),
        divider && 'border-border border-r',
      )}
      style={sticky !== undefined ? { left: sticky } : undefined}
    >
      {children}
    </td>
  );
}
