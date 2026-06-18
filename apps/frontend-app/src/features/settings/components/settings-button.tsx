'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SettingsIcon } from '@/components/ui/icon';
import { SettingsDrawer } from '@/features/settings/components/settings-drawer';
import { logger } from '@/lib/utils/logger';
import { useImportStore } from '@/stores/import-store';

/** Nút Settings ở Navbar + drawer đi kèm. */
export function SettingsButton() {
  const [open, setOpen] = useState(false);
  const busy = useImportStore((s) => s.status === 'loading');

  return (
    <>
      <Button
        variant="tertiary"
        leadingIcon={<SettingsIcon />}
        disabled={busy}
        onClick={() => setOpen(true)}
      >
        Settings
      </Button>
      <SettingsDrawer
        open={open}
        onClose={() => setOpen(false)}
        onSave={(value) => {
          // TODO: lưu cấu hình cột + định dạng export (ARCHITECTURE §7/§8)
          logger.debug('settings saved', value);
        }}
      />
    </>
  );
}
