/** Rút gọn số lớn: 420900 → "420.9K", 1200000 → "1.2M". */
export function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined) return '–';
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${trim(value / 1_000_000)}M`;
  if (abs >= 1_000) return `${trim(value / 1_000)}K`;
  return String(value);
}

function trim(n: number): string {
  return n.toFixed(1).replace(/\.0$/, '');
}

/** ISO → dd/mm/yyyy. '–' nếu rỗng/sai. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '–';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '–';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}
