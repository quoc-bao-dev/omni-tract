/**
 * Tiện ích range ngày cho filter "Posted on".
 * Lưu dưới dạng chuỗi `dd/mm/yyyy` hoặc `dd/mm/yyyy - dd/mm/yyyy` (giữ FilterValue.postedOn là string).
 * Mọi phép so sánh chỉ theo NGÀY (local), bỏ giờ — tránh lệch do timezone.
 */

const DMY = /^(\d{2})\/(\d{2})\/(\d{4})$/;

const pad = (n: number) => String(n).padStart(2, '0');

/** Date (local) → "dd/mm/yyyy". */
export function formatDMY(d: Date): string {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** "dd/mm/yyyy" → Date (local, 00:00). null nếu sai định dạng hoặc ngày không tồn tại (vd 31/02). */
export function parseDMY(s: string): Date | null {
  const m = DMY.exec(s.trim());
  if (!m) return null;
  const day = Number(m[1]);
  const mon = Number(m[2]);
  const year = Number(m[3]);
  const d = new Date(year, mon - 1, day);
  // Date tự tràn (31/02 → 03/03) → kiểm tra ngược để loại ngày không hợp lệ.
  if (d.getFullYear() !== year || d.getMonth() !== mon - 1 || d.getDate() !== day) return null;
  return d;
}

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

/** Parse chuỗi postedOn → {start, end}. Phần sai định dạng trả null (không lọc theo phần đó). */
export function parseRange(value: string): DateRange {
  if (!value.trim()) return { start: null, end: null };
  const parts = value.split('-').map((s) => s.trim());
  const start = parseDMY(parts[0] ?? '');
  const end = parts[1] ? parseDMY(parts[1]) : null;
  return { start, end };
}

/** {start, end} → chuỗi postedOn. start rỗng → ''. chỉ start → "dd/mm/yyyy". */
export function formatRange(start: Date | null, end: Date | null): string {
  if (!start) return '';
  if (!end) return formatDMY(start);
  return `${formatDMY(start)} - ${formatDMY(end)}`;
}

/** So 2 Date theo ngày (local). */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Bỏ giờ: trả Date 00:00 local. */
export function dayOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Bài (postedAt ISO) có nằm trong range postedOn không (bao gồm 2 đầu mút).
 * - postedOn rỗng / không có start hợp lệ → KHÔNG lọc (true).
 * - có lọc nhưng bài thiếu/đỏ ngày → loại (false).
 */
export function isWithinPostedRange(iso: string | undefined, postedOn: string): boolean {
  const { start, end } = parseRange(postedOn);
  if (!start) return true;
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const t = dayOnly(d).getTime();
  const lo = start.getTime();
  const hi = (end ?? start).getTime();
  return t >= lo && t <= hi;
}
