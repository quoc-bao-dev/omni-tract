import type { CollectRequest, CollectResponse, CollectStreamEvent } from '@omni/sdk';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4100/api';

/**
 * Stream crawl danh sách URL: gọi `onEvent` ngay mỗi khi server đẩy 1 event NDJSON
 * (1 URL xong → cập nhật UI tức thì). Throw nếu request lỗi mạng/HTTP.
 */
export async function collectStream(
  urls: string[],
  onEvent: (event: CollectStreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/collect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls } satisfies CollectRequest),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(`collect failed: ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  const flushLine = (line: string) => {
    const trimmed = line.trim();
    if (trimmed) onEvent(JSON.parse(trimmed) as CollectStreamEvent);
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl = buf.indexOf('\n');
    while (nl >= 0) {
      flushLine(buf.slice(0, nl));
      buf = buf.slice(nl + 1);
      nl = buf.indexOf('\n');
    }
  }
  buf += decoder.decode();
  flushLine(buf);
}

/** Gọi crawl và gom toàn bộ kết quả (tiện cho caller không cần streaming). */
export async function collect(urls: string[], signal?: AbortSignal): Promise<CollectResponse> {
  const results: CollectResponse['results'] = [];
  await collectStream(
    urls,
    (event) => {
      if (event.type === 'result') results.push(event.result);
    },
    signal,
  );
  return { results };
}
