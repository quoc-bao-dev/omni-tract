import type { StoredContent } from '@/lib/db/schema';
import { downloadBlob, timestampedName } from './download';
import { cellText, type ExportField } from './fields';

/** Bọc ô CSV theo RFC 4180: thêm nháy kép nếu chứa `,` `"` xuống dòng; nháy kép đôi để escape. */
function csvCell(v: string | number | null): string {
  const s = cellText(v);
  return /["\n\r,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Xuất danh sách nội dung (bản ghi IndexedDB) ra `.csv` theo các field đã cấu hình.
 * Thêm BOM (﻿) để Excel mở đúng UTF-8 (tiếng Việt không lỗi font).
 */
export function exportContentToCsv(
  records: StoredContent[],
  fields: ExportField[],
  baseName = 'omnitract',
): void {
  const header = fields.map((f) => csvCell(f.header)).join(',');
  const body = records.map((rec) => fields.map((f) => csvCell(f.value(rec))).join(','));
  const csv = [header, ...body].join('\r\n');

  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, `${timestampedName(baseName)}.csv`);
}
