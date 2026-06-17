'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SettingsIcon } from '@/components/ui/icon';
import { SettingsDrawer } from '@/features/settings/components/settings-drawer';

/** Nút Settings ở Navbar + drawer đi kèm. */
export function SettingsButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="tertiary"
        leadingIcon={<SettingsIcon />}
        onClick={() => setOpen(true)}
      >
        Settings
      </Button>
      <SettingsDrawer
        open={open}
        onClose={() => setOpen(false)}
        onSave={(value) => {
          // TODO: lưu cấu hình cột + định dạng export (ARCHITECTURE §7/§8)
          console.warn('settings saved', value);
        }}
      />
    </>
  );
}
