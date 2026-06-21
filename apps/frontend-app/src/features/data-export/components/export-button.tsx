'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ExportIcon } from '@/components/ui/icon';
import { contentRepository } from '@/lib/db/content-repository';
import { resolveFields } from '@/lib/export/fields';
import { logger } from '@/lib/utils/logger';
import { useContentStore } from '@/stores/content-store';
import { useExportFieldsStore } from '@/stores/export-fields-store';
import { useExportStore } from '@/stores/export-store';

/** Nút Export ở Navbar → xuất bản ghi IndexedDB ra .xlsx/.csv/.pdf theo format + field chọn ở Settings. */
export function ExportButton() {
  const rows = useContentStore((s) => s.rows);
  const format = useExportStore((s) => s.format);
  const fieldConfig = useExportFieldsStore((s) => s.fields);
  const [busy, setBusy] = useState(false);
  const disabled = busy || rows.length === 0;

  async function handleExport() {
    setBusy(true);
    try {
      // Nguồn dữ liệu = bản ghi IndexedDB (đủ field backend: id, fetchedAt, snapshots…).
      const records = await contentRepository.list();
      if (records.length === 0) return;
      const fields = resolveFields(fieldConfig);

      // Lazy-load đúng module theo định dạng (exceljs/jspdf chỉ tải khi cần).
      if (format === 'csv') {
        const { exportContentToCsv } = await import('@/lib/export/to-csv');
        exportContentToCsv(records, fields);
      } else if (format === 'pdf') {
        const { exportContentToPdf } = await import('@/lib/export/to-pdf');
        await exportContentToPdf(records, fields);
      } else {
        const { exportContentToExcel } = await import('@/lib/export/to-excel');
        await exportContentToExcel(records, fields);
      }
    } catch (err) {
      logger.error(`export ${format} failed`, err);
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
      {busy ? 'Exporting…' : `Export .${format}`}
    </Button>
  );
}
