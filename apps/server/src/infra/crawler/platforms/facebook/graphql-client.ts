import { ProxyAgent } from 'undici';
import { fbConfig } from './fb.config';
import { fetchKiotProxyUrl } from './kiotproxy';

// FB gate nội dung theo IP (datacenter hay bị chặn) → định tuyến qua proxy.
//   KIOTPROXY_KEY: lấy proxy động qua API KiotProxy (cache + xoay khi lỗi).
//   FB_PROXY_URL : proxy tĩnh (fallback).
const PROXY_TTL_MS = 60_000;
let proxyCache: { agent: ProxyAgent; url: string; until: number } | null = null;

async function fbDispatcher(forceRotate = false): Promise<ProxyAgent | undefined> {
  const key = process.env.KIOTPROXY_KEY;
  const staticUrl = process.env.FB_PROXY_URL;
  const now = Date.now();

  if (key) {
    if (forceRotate || !proxyCache || proxyCache.until <= now) {
      const url = await fetchKiotProxyUrl(key, forceRotate ? 'new' : 'current');
      proxyCache = { agent: new ProxyAgent(url), url, until: now + PROXY_TTL_MS };
    }
    return proxyCache.agent;
  }
  if (staticUrl) {
    if (!proxyCache || proxyCache.url !== staticUrl) {
      proxyCache = {
        agent: new ProxyAgent(staticUrl),
        url: staticUrl,
        until: Number.POSITIVE_INFINITY,
      };
    }
    return proxyCache.agent;
  }
  return undefined;
}

// Header tối thiểu giả lập trình duyệt — KHÔNG dùng account/cookie (theo yêu cầu).
const HEADERS: Record<string, string> = {
  'content-type': 'application/x-www-form-urlencoded',
  accept: '*/*',
  'accept-language': 'en-US,en;q=0.9',
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  origin: 'https://www.facebook.com',
  'sec-fetch-site': 'same-origin',
};

export interface FbGraphqlRequest {
  /** doc_id của persisted query FB. */
  docId: string;
  /** Object `variables` — giữ nguyên cấu trúc FB, chỉ thay giá trị cần. */
  variables: unknown;
}

/**
 * Gọi GraphQL FB bằng persisted query (doc_id + variables), form-urlencoded.
 * Throw nếu HTTP lỗi, response không parse được, hoặc payload có `errors`.
 */
export async function fbGraphql({ docId, variables }: FbGraphqlRequest): Promise<unknown> {
  const body = new URLSearchParams({
    doc_id: docId,
    variables: JSON.stringify(variables),
    server_timestamps: 'true',
    fb_api_caller_class: 'RelayModern',
  });

  // `dispatcher` là tuỳ chọn undici của fetch trong Node (không có trong type DOM).
  const send = async (dispatcher?: ProxyAgent) =>
    fetch(fbConfig.graphqlUrl, {
      method: 'POST',
      headers: HEADERS,
      body,
      ...(dispatcher ? { dispatcher } : {}),
    } as RequestInit);

  let res: Response;
  try {
    res = await send(await fbDispatcher());
  } catch (err) {
    // Proxy chết/timeout → xoay proxy mới rồi thử lại 1 lần (chỉ khi dùng KiotProxy).
    if (!process.env.KIOTPROXY_KEY) throw err;
    res = await send(await fbDispatcher(true));
  }
  if (!res.ok) {
    throw new Error(`FB GraphQL HTTP ${res.status}`);
  }

  const json = parseFbJson(await res.text());
  const errors = (json as { errors?: unknown }).errors;
  if (Array.isArray(errors) && errors.length > 0) {
    throw new Error(`FB GraphQL errors: ${JSON.stringify(errors).slice(0, 300)}`);
  }
  return json;
}

/** FB có thể chèn `for (;;);` và/hoặc trả nhiều dòng JSON (@stream). Lấy JSON hợp lệ đầu tiên. */
function parseFbJson(text: string): unknown {
  const cleaned = text.replace(/^for \(;;\);/, '').trim();
  for (const chunk of [cleaned, ...cleaned.split('\n')]) {
    const parsed = tryParse(chunk);
    if (parsed !== undefined) return parsed;
  }
  throw new Error('FB GraphQL: không parse được JSON response');
}

function tryParse(s: string): unknown | undefined {
  try {
    return JSON.parse(s);
  } catch {
    return undefined;
  }
}
