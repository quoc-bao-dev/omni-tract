'use client';

import { useEffect, useRef } from 'react';
import { ChevronRightIcon, CloseIcon } from '@/components/ui/icon';

interface ImageLightboxProps {
  images: string[];
  /** Ảnh đang xem; null = đóng. */
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

/**
 * Lightbox xem ảnh chi tiết (dialog native — Esc/focus-trap sẵn có).
 * Bấm nền tối để đóng; ◀ ▶ hoặc phím mũi tên để chuyển ảnh.
 */
export function ImageLightbox({ images, index, onClose, onNavigate }: ImageLightboxProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const open = index !== null;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    function onCancel(e: Event) {
      e.preventDefault(); // Esc
      onClose();
    }
    function onClick(e: MouseEvent) {
      if (e.target === el) onClose(); // bấm vùng ::backdrop
    }
    el.addEventListener('cancel', onCancel);
    el.addEventListener('click', onClick);
    return () => {
      el.removeEventListener('cancel', onCancel);
      el.removeEventListener('click', onClick);
    };
  }, [onClose]);

  useEffect(() => {
    if (!open || index === null) return;
    function onKey(e: KeyboardEvent) {
      if (index === null) return;
      if (e.key === 'ArrowRight') onNavigate((index + 1) % images.length);
      if (e.key === 'ArrowLeft') onNavigate((index - 1 + images.length) % images.length);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, index, images, onNavigate]);

  if (index === null) return null;
  const many = images.length > 1;

  return (
    <dialog
      ref={ref}
      aria-label="Xem ảnh"
      className="m-auto bg-transparent p-0 backdrop:bg-black/80"
    >
      {/* pointer-events-none → bấm vùng tối lọt xuống ::backdrop để đóng; chỉ ảnh nhận click. */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center p-6">
        {/* biome-ignore lint/performance/noImgElement: URL fbcdn có token ký/hết hạn, không hợp next/image. */}
        <img
          src={images[index]}
          alt=""
          className="pointer-events-auto max-h-[88vh] max-w-[92vw] rounded-lg object-contain shadow-modal"
        />
      </div>

      <button
        type="button"
        aria-label="Đóng"
        onClick={onClose}
        className="fixed top-4 right-4 grid size-10 place-items-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/75"
      >
        <CloseIcon className="size-5" />
      </button>

      {many ? (
        <>
          <button
            type="button"
            aria-label="Ảnh trước"
            onClick={() => onNavigate((index - 1 + images.length) % images.length)}
            className="fixed top-1/2 left-4 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/75"
          >
            <ChevronRightIcon className="size-5 rotate-180" />
          </button>
          <button
            type="button"
            aria-label="Ảnh sau"
            onClick={() => onNavigate((index + 1) % images.length)}
            className="fixed top-1/2 right-4 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/75"
          >
            <ChevronRightIcon className="size-5" />
          </button>
          <span className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-sm text-white">
            {index + 1} / {images.length}
          </span>
        </>
      ) : null}
    </dialog>
  );
}
