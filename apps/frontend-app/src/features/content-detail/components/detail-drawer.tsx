'use client';

import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Drawer } from '@/components/ui/drawer';
import { CheckIcon, ExternalLinkIcon } from '@/components/ui/icon';
import { PostPreview } from '@/features/content-detail/components/post-preview';
import { MetricCard } from '@/features/dashboard/components/metric-card';
import type { CollectStatus, ContentRow } from '@/features/dashboard/types';
import { formatCompact, formatDate } from '@/lib/utils/format';

const STATUS_META: Record<CollectStatus, { tone: BadgeTone; label: string }> = {
  success: { tone: 'success', label: 'Success' },
  pending: { tone: 'warning', label: 'Pending' },
  failed: { tone: 'danger', label: 'Failed' },
  unsupported: { tone: 'neutral', label: 'Unsupported' },
};

function platformLabel(p: string): string {
  return p.charAt(0).toUpperCase() + p.slice(1);
}

interface DetailDrawerProps {
  row: ContentRow | null;
  open: boolean;
  onClose: () => void;
}

/** Drawer chi tiết nội dung (Figma 79:6033). */
export function DetailDrawer({ row, open, onClose }: DetailDrawerProps) {
  if (!row) return null;
  const status = STATUS_META[row.status];
  const m = row.metrics;

  const metrics = [
    { label: 'Likes', value: m.likes },
    { label: 'Save', value: m.saves },
    { label: 'Play', value: m.plays },
    { label: 'Shares', value: m.shares },
    { label: 'Comments', value: m.comments },
    { label: 'Views', value: m.views },
  ];

  const href = row.url.startsWith('http') ? row.url : `https://${row.url}`;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`Chi tiết — ${row.author.name}`}
      header={
        <>
          <div className="flex items-center gap-2">
            <span className="grid size-6 shrink-0 place-items-center rounded-full border border-border-subtle bg-surface font-semibold text-[10px] text-ink shadow-action">
              {platformLabel(row.platform).charAt(0)}
            </span>
            <span className="font-medium text-ink text-md">{platformLabel(row.platform)}</span>
          </div>
          <Badge
            tone={status.tone}
            icon={row.status === 'success' ? <CheckIcon /> : undefined}
          >
            {status.label}
          </Badge>
        </>
      }
      footer={
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-10 w-full items-center justify-center gap-1 rounded-md bg-ink px-3 font-semibold text-on-ink text-sm shadow-action transition-colors hover:opacity-90"
        >
          <span className="px-1">View original post</span>
          <ExternalLinkIcon className="size-5" />
        </a>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Engagement Metrics */}
        <section className="rounded-xl border border-border-overlay bg-surface p-4">
          <h3 className="font-semibold text-ink text-md">Engagement Metrics</h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {metrics.map((it) => (
              <MetricCard
                key={it.label}
                label={it.label}
                value={formatCompact(it.value)}
              />
            ))}
          </div>
        </section>

        {/* Post preview — nội dung + thumbnail */}
        <PostPreview
          data={{
            author: row.author.name,
            timestamp: row.postedAt ? formatDate(row.postedAt) : '',
            caption: row.caption.text,
            thumbnailUrl: row.caption.thumbnailUrl,
            links: [href],
            preview: row.caption.thumbnailUrl
              ? { domain: row.url.replace(/^https?:\/\//, '').split('/')[0] ?? '', title: '' }
              : undefined,
          }}
        />

        {/* Media — video + hình ảnh, hiển thị DƯỚI bài post */}
        {row.videoUrl || (row.images && row.images.length > 0) ? (
          <section className="flex flex-col gap-3 rounded-xl border border-border-overlay bg-surface p-4">
            <h3 className="font-semibold text-ink text-md">Media</h3>
            {row.videoUrl ? (
              // biome-ignore lint/a11y/useMediaCaption: nội dung FB không kèm caption track.
              <video
                src={row.videoUrl}
                poster={row.images?.[0]}
                controls
                className="w-full rounded-lg border border-border bg-ink"
              />
            ) : null}
            {row.images && row.images.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {row.images.map((src) => (
                  // biome-ignore lint/performance/noImgElement: URL fbcdn có token ký/hết hạn, không hợp next/image.
                  <img
                    key={src}
                    src={src}
                    alt=""
                    className="aspect-square w-full rounded-lg object-cover"
                  />
                ))}
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </Drawer>
  );
}
