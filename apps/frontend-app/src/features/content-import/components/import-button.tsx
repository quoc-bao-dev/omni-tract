'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ImportIcon } from '@/components/ui/icon';
import { ImportModal } from '@/features/content-import/components/import-modal';

/** Nút Import ở Navbar + modal đi kèm. */
export function ImportButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="primary"
        leadingIcon={<ImportIcon />}
        onClick={() => setOpen(true)}
      >
        Import
      </Button>
      <ImportModal
        open={open}
        onClose={() => setOpen(false)}
        onImport={(urls) => {
          // TODO: lib/url validate → lib/api collect → lib/db append snapshot (ARCHITECTURE §8/§9)
          console.warn('import urls', urls);
        }}
      />
    </>
  );
}
