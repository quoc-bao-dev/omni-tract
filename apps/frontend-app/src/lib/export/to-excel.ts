import type { StoredContent } from '@/lib/db/schema';
import { downloadBlob, timestampedName } from './download';
import type { ExportField } from './fields';

/**
 * Xuất danh sách nội dung (bản ghi IndexedDB) ra file `.xlsx` theo các field đã cấu hình.
 * Lazy-load `exceljs` (ARCHITECTURE §10) — chỉ tải khi user bấm export.
 */
export async function exportContentToExcel(
  records: StoredContent[],
  fields: ExportField[],
  baseName = 'omnitract',
): Promise<void> {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'OmniTract';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Content', {
    views: [{ state: 'frozen', ySplit: 1 }], // ghim hàng tiêu đề
  });
  sheet.columns = fields.map((f) => ({ header: f.header, key: f.key, width: f.width }));

  for (const rec of records) {
    sheet.addRow(fields.map((f) => f.value(rec)));
  }

  // Style hàng tiêu đề
  const head = sheet.getRow(1);
  head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  head.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111111' } };
  head.alignment = { vertical: 'middle' };
  head.height = 20;
  sheet.autoFilter = { from: 'A1', to: { row: 1, column: fields.length } };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlob(blob, `${timestampedName(baseName)}.xlsx`);
}
