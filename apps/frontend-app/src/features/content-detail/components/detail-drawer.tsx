'use client';

import { useState } from 'react';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Drawer } from '@/components/ui/drawer';
import { CheckIcon, ExternalLinkIcon } from '@/components/ui/icon';
import { ImageLightbox } from '@/features/content-detail/components/image-lightbox';
import { PostPreview } from '@/features/content-detail/components/post-preview';
import { MetricCard } from '@/features/dashboard/components/metric-card';
import type { CollectStatus } from '@/features/dashboard/types';
import { formatCompact, formatDate } from '@/lib/utils/format';
import { useDetailStore } from '@/stores/detail-store';

/** Id slot để FloatingVideo gắn phần tử <video> dùng chung vào drawer. */
export const DETAIL_VIDEO_SLOT_ID = 'detail-video-slot';

const STATUS_META: Record<CollectStatus, { tone: BadgeTone; label: string }> = {
  success: { tone: 'success', label: 'Success' },
  pending: { tone: 'warning', label: 'Pending' },
  failed: { tone: 'danger', label: 'Failed' },
  unsupported: { tone: 'neutral', label: 'Unsupported' },
};

function platformLabel(p: string): string {
  return p.charAt(0).toUpperCase() + p.slice(1);
}

/** Drawer chi tiết nội dung (Figma 79:6033). State lấy từ useDetailStore. */
export function DetailDrawer() {
  const row = useDetailStore((s) => s.row);
  const view = useDetailStore((s) => s.view);
  const requestClose = useDetailStore((s) => s.requestClose);
  // Ảnh đang phóng to trong lightbox (null = đóng).
  const [lightbox, setLightbox] = useState<number | null>(null);
  if (!row) return null;
  const status = STATUS_META[row.status];
  const m = row.metrics;

  const metrics = [
    { label: 'Likes', value: m.likes },
    { label: 'Shares', value: m.shares },
    { label: 'Comments', value: m.comments },
    { label: 'Save', value: m.saves },
    { label: 'Play', value: m.plays },
    { label: 'Views', value: m.views },
  ];

  const href = row.url.startsWith('http') ? row.url : `https://${row.url}`;

  return (
    <>
      <Drawer
        open={view === 'drawer'}
        onClose={requestClose}
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
            <div className="mt-4 grid grid-cols-3 gap-2">
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
              avatarUrl: row.author.avatarUrl,
              profileUrl: row.author.profileUrl,
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
                // Slot rỗng — phần tử <video> dùng chung do FloatingVideo gắn vào đây
                // (giữ nguyên khi đóng drawer để chạy tiếp ở mini player).
                <div
                  id={DETAIL_VIDEO_SLOT_ID}
                  className="overflow-hidden rounded-lg border border-border bg-ink"
                />
              ) : null}
              {row.images && row.images.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {row.images.map((src, i) => (
                    <button
                      key={src}
                      type="button"
                      aria-label={`Xem ảnh ${i + 1}`}
                      onClick={() => setLightbox(i)}
                      className="cursor-zoom-in overflow-hidden rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-info"
                    >
                      {/* biome-ignore lint/performance/noImgElement: URL fbcdn có token ký/hết hạn, không hợp next/image. */}
                      <img
                        src={src}
                        alt=""
                        className="aspect-square w-full object-cover transition-transform hover:scale-105"
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}
        </div>
      </Drawer>

      <ImageLightbox
        images={row.images ?? []}
        index={lightbox}
        onClose={() => setLightbox(null)}
        onNavigate={setLightbox}
      />
    </>
  );
}
