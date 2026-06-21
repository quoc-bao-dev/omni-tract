import type { jsPDF } from 'jspdf';
import type { StoredContent } from '@/lib/db/schema';
import { logger } from '@/lib/utils/logger';
import { timestampedName } from './download';
import { cellText, type ExportField } from './fields';

/**
 * Nhúng font Roboto (có tiếng Việt) vào jsPDF.
 * Font chuẩn của jsPDF (Helvetica) chỉ hỗ trợ Latin-1 → tiếng Việt bị lỗi ký tự;
 * phải embed 1 TTF Unicode. Trả 'Roboto' nếu nạp được, ngược lại 'helvetica' (fallback).
 */
async function embedFont(doc: jsPDF): Promise<'Roboto' | 'helvetica'> {
  try {
    const res = await fetch('/fonts/Roboto-Regular.ttf');
    if (!res.ok) throw new Error(`font ${res.status}`);
    const bytes = new Uint8Array(await res.arrayBuffer());
    // ArrayBuffer → base64 (chunk để không tràn call stack với fromCharCode).
    let binary = '';
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    }
    doc.addFileToVFS('Roboto-Regular.ttf', btoa(binary));
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    return 'Roboto';
  } catch (err) {
    logger.error('embed PDF font failed → fallback Helvetica (tiếng Việt có thể lỗi)', err);
    return 'helvetica';
  }
}

/**
 * Xuất danh sách nội dung ra `.pdf` (bảng A4 ngang) và tải về.
 * Lazy-load `jspdf` + `jspdf-autotable` — chỉ tải khi user bấm export.
 */
export async function exportContentToPdf(
  records: StoredContent[],
  fields: ExportField[],
  baseName = 'omnitract',
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const font = await embedFont(doc);
  // Roboto chỉ đăng ký kiểu 'normal' → tránh ép 'bold' (sẽ fallback Helvetica lỗi tiếng Việt).
  const headStyle: 'normal' | 'bold' = font === 'Roboto' ? 'normal' : 'bold';

  doc.setFont(font, 'normal');
  doc.setFontSize(14);
  doc.text('OmniTract — Content export', 20, 28);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`${records.length} rows · ${new Date().toLocaleString()}`, 20, 42);

  // Chia bề rộng cột theo tỉ lệ width (như Excel) cho vừa khổ trang.
  const totalW = fields.reduce((sum, f) => sum + f.width, 0);
  const avail = doc.internal.pageSize.getWidth() - 40; // chừa lề 20pt mỗi bên
  const columnStyles = Object.fromEntries(
    fields.map((f, i) => [i, { cellWidth: (f.width / totalW) * avail }]),
  );

  autoTable(doc, {
    startY: 54,
    head: [fields.map((f) => f.header)],
    body: records.map((rec) => fields.map((f) => cellText(f.value(rec)))),
    styles: {
      font,
      fontStyle: 'normal',
      fontSize: 7,
      cellPadding: 3,
      overflow: 'linebreak',
      valign: 'middle',
    },
    headStyles: { fillColor: [17, 17, 17], textColor: 255, fontStyle: headStyle },
    alternateRowStyles: { fillColor: [247, 247, 247] },
    columnStyles,
    margin: { left: 20, right: 20 },
  });

  doc.save(`${timestampedName(baseName)}.pdf`);
}
