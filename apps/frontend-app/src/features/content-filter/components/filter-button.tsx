'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FilterIcon } from '@/components/ui/icon';
import { FilterDrawer } from '@/features/content-filter/components/filter-drawer';
import { useImportStore } from '@/stores/import-store';

/** Nút Filters ở Navbar + drawer đi kèm (commit filter qua filter store). */
export function FilterButton() {
  const [open, setOpen] = useState(false);
  const busy = useImportStore((s) => s.status === 'loading');

  return (
    <>
      <Button
        variant="tertiary"
        leadingIcon={<FilterIcon />}
        disabled={busy}
        onClick={() => setOpen(true)}
      >
        Filters
      </Button>
      <FilterDrawer
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
