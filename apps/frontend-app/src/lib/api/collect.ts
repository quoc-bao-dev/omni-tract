import type { CollectRequest, CollectResponse } from '@omni/sdk';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4100/api';

/** Gọi @omni/api để crawl danh sách URL. Throw nếu request lỗi mạng/HTTP. */
export async function collect(urls: string[], signal?: AbortSignal): Promise<CollectResponse> {
  const res = await fetch(`${BASE_URL}/collect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls } satisfies CollectRequest),
    signal,
  });
  if (!res.ok) throw new Error(`collect failed: ${res.status}`);
  return (await res.json()) as CollectResponse;
}
