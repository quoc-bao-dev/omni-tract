/**
 * Tách text nhiều dòng → danh sách URL: trim, bỏ dòng rỗng, **khử trùng lặp**.
 * (document §4.1 — validate & dedup ở client trước khi gửi server.)
 * Validate hợp lệ/đúng nền tảng để ở `validate.ts` (bước sau).
 */
export function parseUrlLines(text: string): string[] {
  const seen = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    const url = line.trim();
    if (url) seen.add(url);
  }
  return [...seen];
}
