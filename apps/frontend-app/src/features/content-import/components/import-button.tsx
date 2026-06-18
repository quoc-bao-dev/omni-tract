'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ImportIcon } from '@/components/ui/icon';
import { ImportModal } from '@/features/content-import/components/import-modal';
import { useImportStore } from '@/stores/import-store';

/** Nút Import ở Navbar + modal. Bấm Import → clear filter + crawl (import store). */
export function ImportButton() {
  const [open, setOpen] = useState(false);
  const busy = useImportStore((s) => s.status === 'loading');
  const startImport = useImportStore((s) => s.startImport);

  return (
    <>
      <Button
        variant="primary"
        leadingIcon={<ImportIcon />}
        disabled={busy}
        onClick={() => setOpen(true)}
      >
        Import
      </Button>
      <ImportModal
        open={open}
        onClose={() => setOpen(false)}
        onImport={(urls) => {
          void startImport(urls);
        }}
      />
    </>
  );
}
