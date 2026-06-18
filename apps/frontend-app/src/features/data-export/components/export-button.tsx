'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ExportIcon } from '@/components/ui/icon';
import { logger } from '@/lib/utils/logger';
import { useContentStore } from '@/stores/content-store';

/** Nút Export ở Navbar → xuất nội dung hiện có ra Excel (.xlsx). */
export function ExportButton() {
  const rows = useContentStore((s) => s.rows);
  const [busy, setBusy] = useState(false);
  const disabled = busy || rows.length === 0;

  async function handleExport() {
    setBusy(true);
    try {
      const { exportContentToExcel } = await import('@/lib/export/to-excel');
      await exportContentToExcel(rows);
    } catch (err) {
      logger.error('export excel failed', err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      variant="tertiary"
      leadingIcon={<ExportIcon />}
      disabled={disabled}
      onClick={handleExport}
    >
      {busy ? 'Exporting…' : 'Export'}
    </Button>
  );
}
