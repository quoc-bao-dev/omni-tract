'use client';

import { type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react';
import { CloseIcon, PanelRightIcon } from '@/components/ui/icon';
import { DETAIL_VIDEO_SLOT_ID } from '@/features/content-detail/components/detail-drawer';
import { cn } from '@/lib/utils/cn';
import { useDetailStore } from '@/stores/detail-store';

const MARGIN = 8; // khoảng chừa mép màn hình khi kéo thẻ mini

/** Giới hạn toạ độ (x,y) góc trái-trên của thẻ để luôn nằm trong màn hình. */
function clampToViewport(x: number, y: number, w: number, h: number) {
  return {
    x: Math.min(Math.max(MARGIN, x), window.innerWidth - w - MARGIN),
    y: Math.min(Math.max(MARGIN, y), window.innerHeight - h - MARGIN),
  };
}

/** Hút thẻ về 1 trong 4 góc màn hình gần tâm thẻ nhất (giống mini player YouTube). */
function snapToCorner(x: number, y: number, w: number, h: number) {
  const toLeft = x + w / 2 < window.innerWidth / 2;
  const toTop = y + h / 2 < window.innerHeight / 2;
  return {
    x: toLeft ? MARGIN : window.innerWidth - w - MARGIN,
    y: toTop ? MARGIN : window.innerHeight - h - MARGIN,
  };
}

/**
 * Quản lý DUY NHẤT một phần tử <video> dùng chung và "di chuyển" nó (reparent) giữa:
 * - slot trong DetailDrawer (view = 'drawer')
 * - thẻ mini cố định góc phải dưới (view = 'mini')
 *
 * Vì cùng một node DOM, playback (currentTime, đang phát) được giữ liền mạch khi
 * đóng drawer → mini và khi bấm mini → mở lại drawer (giống mini player YouTube).
 */
export function FloatingVideo() {
  const row = useDetailStore((s) => s.row);
  const view = useDetailStore((s) => s.view);
  const expand = useDetailStore((s) => s.expand);
  const dismiss = useDetailStore((s) => s.dismiss);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const miniSlotRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  // Vị trí thẻ mini sau khi kéo (px, góc trái-trên). null = vị trí mặc định góc phải dưới.
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  // Dữ liệu phiên kéo: điểm bắt đầu + gốc thẻ + đã vượt ngưỡng (phân biệt kéo vs click).
  const drag = useRef<{ sx: number; sy: number; bx: number; by: number; moved: boolean } | null>(
    null,
  );

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    // Bỏ qua khi bấm vào nút điều khiển → không kéo.
    if ((e.target as HTMLElement).closest('[data-no-drag]')) return;
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    drag.current = { sx: e.clientX, sy: e.clientY, bx: rect.left, by: rect.top, moved: false };
    card.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const d = drag.current;
    const card = cardRef.current;
    if (!d || !card) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (!d.moved && Math.hypot(dx, dy) < 4) return; // ngưỡng → coi là click
    d.moved = true;
    setDragging(true);
    setPos(clampToViewport(d.bx + dx, d.by + dy, card.offsetWidth, card.offsetHeight));
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    const d = drag.current;
    drag.current = null;
    cardRef.current?.releasePointerCapture(e.pointerId);
    setDragging(false);
    if (!d) return;
    if (!d.moved) {
      expand(); // không kéo → click mở lại drawer
      return;
    }
    // Thả ra → hút về góc gần nhất.
    const card = cardRef.current;
    if (card) {
      const r = card.getBoundingClientRect();
      setPos(snapToCorner(r.left, r.top, card.offsetWidth, card.offsetHeight));
    }
  }

  // Resize/đổi hướng → giữ thẻ dính đúng góc gần nhất.
  useEffect(() => {
    if (!pos) return;
    function onResize() {
      const card = cardRef.current;
      if (!card) return;
      setPos((p) => (p ? snapToCorner(p.x, p.y, card.offsetWidth, card.offsetHeight) : p));
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [pos]);

  // Cập nhật nguồn + reparent video theo view. Tạo phần tử <video> 1 lần (ref bền).
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!videoRef.current) {
      const v = document.createElement('video');
      v.playsInline = true;
      v.preload = 'metadata';
      v.className = 'block max-h-full w-full bg-ink';
      const sync = useDetailStore.getState().setPlaying;
      v.addEventListener('play', () => sync(true));
      v.addEventListener('pause', () => sync(false));
      videoRef.current = v;
    }
    const v = videoRef.current;

    if (!row?.videoUrl) {
      v.pause();
      return;
    }

    // Đổi nguồn khi sang dòng khác (so sánh qua dataset để tránh URL tuyệt đối/tương đối lệch).
    if (v.dataset.url !== row.videoUrl) {
      v.dataset.url = row.videoUrl;
      v.src = row.videoUrl;
      if (row.images?.[0]) v.poster = row.images[0];
    }

    if (view === 'drawer') {
      v.controls = true;
      const slot = document.getElementById(DETAIL_VIDEO_SLOT_ID);
      if (slot && v.parentElement !== slot) slot.appendChild(v);
    } else if (view === 'mini') {
      v.controls = false;
      const slot = miniSlotRef.current;
      if (slot && v.parentElement !== slot) slot.appendChild(v);
    } else {
      v.pause();
    }
  }, [row, view]);

  if (!row) return null;

  return (
    <div
      ref={cardRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={pos ? { left: pos.x, top: pos.y, right: 'auto', bottom: 'auto' } : undefined}
      className={cn(
        'fixed z-50 w-80 max-w-[calc(100vw-2rem)] touch-none select-none overflow-hidden rounded-xl border border-border bg-ink shadow-modal',
        pos ? null : 'right-4 bottom-4',
        // Kéo → bám tay (không transition); thả → trượt mượt về góc.
        dragging ? 'cursor-grabbing' : 'cursor-grab transition-[left,top] duration-200 ease-out',
        view === 'mini' ? 'block' : 'hidden',
      )}
    >
      {/* Vùng video: kéo để di chuyển, click (không kéo) → mở lại drawer. */}
      <div
        ref={miniSlotRef}
        className="aspect-video w-full"
      />

      {/* Hàng nút điều khiển mini. */}
      <div className="absolute top-1.5 right-1.5 flex gap-1">
        <button
          type="button"
          data-no-drag
          aria-label="Mở lại chi tiết"
          onClick={expand}
          className="grid size-7 cursor-pointer place-items-center rounded-md bg-black/55 text-white transition-colors hover:bg-black/75"
        >
          <PanelRightIcon className="size-4" />
        </button>
        <button
          type="button"
          data-no-drag
          aria-label="Đóng video"
          onClick={dismiss}
          className="grid size-7 cursor-pointer place-items-center rounded-md bg-black/55 text-white transition-colors hover:bg-black/75"
        >
          <CloseIcon className="size-4" />
        </button>
      </div>

      <p className="truncate px-3 py-2 font-medium text-on-ink text-xs">{row.author.name}</p>
    </div>
  );
}
