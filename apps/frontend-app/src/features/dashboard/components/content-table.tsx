'use client';

import { useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  CommentIcon,
  PlayIcon,
  SaveIcon,
  ShareIcon,
  VerifiedIcon,
  ViewIcon,
} from '@/components/ui/icon';
import { DetailDrawer } from '@/features/content-detail';
import type { CollectStatus, ContentRow, Metrics } from '@/features/dashboard/types';
import { cn } from '@/lib/utils/cn';
import { formatCompact } from '@/lib/utils/format';

const STATUS_META: Record<CollectStatus, { tone: BadgeTone; label: string }> = {
  success: { tone: 'success', label: 'Success' },
  pending: { tone: 'warning', label: 'Pending' },
  failed: { tone: 'danger', label: 'Failed' },
  unsupported: { tone: 'neutral', label: 'Unsupported' },
};

const METRIC_COLUMNS: { key: keyof Metrics; label: string; Icon: typeof CommentIcon }[] = [
  { key: 'reactions', label: 'Reactions', Icon: ViewIcon },
  { key: 'comments', label: 'Comments', Icon: CommentIcon },
  { key: 'shares', label: 'Shares', Icon: ShareIcon },
  { key: 'views', label: 'Views', Icon: ViewIcon },
  { key: 'saves', label: 'Save', Icon: SaveIcon },
  { key: 'plays', label: 'Play', Icon: PlayIcon },
];

// offset (px) cho cột sticky bên trái
const STICKY = { check: 0, no: 48, url: 104, author: 314, caption: 504 } as const;
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
        <table className="w-full min-w-[1440px] border-collapse">
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
                  tabIndex={0}
                  aria-label={`Xem chi tiết dòng ${i + 1}`}
                  onClick={() => openRow(row)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openRow(row);
                    }
                  }}
                  className={cn(
                    'cursor-pointer border-border border-t outline-none focus-visible:bg-surface-alt',
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
                      <span
                        className="size-9 shrink-0 rounded-md bg-ink"
                        aria-hidden
                      />
                      <span className="line-clamp-2 max-w-[200px] text-text-primary">
                        {row.caption.text}
                      </span>
                    </span>
                  </Td>
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
