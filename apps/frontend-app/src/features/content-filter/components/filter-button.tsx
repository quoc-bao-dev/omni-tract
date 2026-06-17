'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FilterIcon } from '@/components/ui/icon';
import { FilterDrawer } from '@/features/content-filter/components/filter-drawer';

/** Nút Filters ở Navbar + drawer đi kèm (commit filter qua filter store). */
export function FilterButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="tertiary"
        leadingIcon={<FilterIcon />}
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
