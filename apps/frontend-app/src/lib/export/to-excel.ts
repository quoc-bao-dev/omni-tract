import type { CollectStatus, ContentRow, PostType } from '@/features/dashboard/types';
import { downloadBlob, timestampedName } from './download';

const TYPE_LABEL: Record<PostType, string> = {
  photo: 'Photo',
  text: 'Text',
  link: 'Link',
  livestream: 'Livestream',
  video: 'Video',
  carousel: 'Carousel',
};

const STATUS_LABEL: Record<CollectStatus, string> = {
  success: 'Success',
  pending: 'Pending',
  failed: 'Failed',
  unsupported: 'Unsupported',
};

/** Một cột Excel: tiêu đề + bề rộng + cách lấy giá trị từ row (số giữ kiểu number để Excel tính được). */
interface Column {
  header: string;
  width: number;
  value: (r: ContentRow) => string | number | null;
}

const COLUMNS: Column[] = [
  { header: 'URL', width: 42, value: (r) => r.url },
  { header: 'Platform', width: 14, value: (r) => r.platform },
  { header: 'Type', width: 12, value: (r) => TYPE_LABEL[r.type] },
  { header: 'Author', width: 24, value: (r) => r.author.name },
  { header: 'Caption', width: 50, value: (r) => r.caption.text },
  { header: 'Posted on', width: 14, value: (r) => r.postedAt ?? '' },
  { header: 'Likes', width: 12, value: (r) => r.metrics.likes },
  { header: 'Comments', width: 12, value: (r) => r.metrics.comments },
  { header: 'Shares', width: 12, value: (r) => r.metrics.shares },
  { header: 'Views', width: 12, value: (r) => r.metrics.views },
  { header: 'Saves', width: 12, value: (r) => r.metrics.saves },
  { header: 'Plays', width: 12, value: (r) => r.metrics.plays },
  { header: 'Status', width: 14, value: (r) => STATUS_LABEL[r.status] },
];

/**
 * Xuất danh sách nội dung ra file `.xlsx` và tải về.
 * Lazy-load `exceljs` (ARCHITECTURE §10) — chỉ tải khi user bấm export.
 */
export async function exportContentToExcel(
  rows: ContentRow[],
  baseName = 'omnitract',
): Promise<void> {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'OmniTract';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Content', {
    views: [{ state: 'frozen', ySplit: 1 }], // ghim hàng tiêu đề
  });
  sheet.columns = COLUMNS.map((c) => ({ header: c.header, key: c.header, width: c.width }));

  for (const row of rows) {
    sheet.addRow(COLUMNS.map((c) => c.value(row)));
  }

  // Style hàng tiêu đề
  const head = sheet.getRow(1);
  head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  head.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111111' } };
  head.alignment = { vertical: 'middle' };
  head.height = 20;
  sheet.autoFilter = { from: 'A1', to: { row: 1, column: COLUMNS.length } };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlob(blob, `${timestampedName(baseName)}.xlsx`);
}
