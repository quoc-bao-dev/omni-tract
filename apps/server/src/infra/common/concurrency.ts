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

/**
 * Như `mapWithConcurrency` nhưng **yield kết quả ngay khi mỗi item xong** (không giữ thứ tự),
 * tối đa `limit` item chạy song song. Dùng cho streaming: đẩy từng kết quả về client tức thì.
 */
export async function* streamWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): AsyncGenerator<R> {
  const inflight = new Map<number, Promise<{ key: number; value: R }>>();
  let cursor = 0;

  const start = () => {
    if (cursor >= items.length) return;
    const i = cursor++;
    inflight.set(
      i,
      fn(items[i], i).then((value) => ({ key: i, value })),
    );
  };

  for (let k = 0; k < Math.min(limit, items.length); k++) start();

  while (inflight.size > 0) {
    const { key, value } = await Promise.race(inflight.values());
    inflight.delete(key);
    yield value;
    start();
  }
}
