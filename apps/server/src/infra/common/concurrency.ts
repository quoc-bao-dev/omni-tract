/** Giới hạn song song mặc định cho fan-out batch (tránh rate-limit nền tảng, §9). */
export const CRAWL_CONCURRENCY = 5;

/**
 * Chạy `fn` qua từng item với số worker tối đa = `limit`, giữ nguyên thứ tự kết quả.
 * Dùng thay cho `Promise.all` tất-cả để không bắn đồng thời quá nhiều request.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}
