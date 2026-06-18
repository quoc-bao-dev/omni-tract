'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ImportIcon } from '@/components/ui/icon';
import { ImportModal } from '@/features/content-import';
import { useImportStore } from '@/stores/import-store';

/** Màn hình chào khi chưa có dữ liệu — logo + CTA mở popup Import (không hiện dummy data). */
export function Greeting() {
  const [open, setOpen] = useState(false);
  const startImport = useImportStore((s) => s.startImport);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <Image
        src="/brand/omnitract-mark.svg"
        alt="OmniTract"
        width={56}
        height={56}
        priority
      />
      <div className="flex max-w-md flex-col gap-2">
        <h2 className="font-semibold text-2xl text-text-primary">Welcome to OmniTract</h2>
        <p className="text-sm text-text-secondary">
          Theo dõi chỉ số tương tác của nội dung mạng xã hội. Dán URL bài viết để bắt đầu — kết quả
          sẽ hiển thị ở đây.
        </p>
      </div>

      <Button
        variant="primary"
        leadingIcon={<ImportIcon />}
        onClick={() => setOpen(true)}
      >
        Import URLs
      </Button>

      <ImportModal
        open={open}
        onClose={() => setOpen(false)}
        onImport={(urls) => {
          void startImport(urls);
        }}
      />
    </div>
  );
}
