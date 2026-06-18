// Client KiotProxy — lấy proxy động bằng key (https://app.kiotproxy.com).
// Endpoint đã xác nhận:
//   GET /api/v1/proxies/current?key=KEY   → proxy hiện tại
//   GET /api/v1/proxies/new?key=KEY       → xoay proxy mới
const KIOTPROXY_BASE = 'https://api.kiotproxy.com/api/v1/proxies';

interface KiotProxyResponse {
  success?: boolean;
  message?: string;
  data?: Record<string, unknown>;
}

/** Lấy proxy hiện tại (mode 'current') hoặc xoay proxy mới (mode 'new'). */
export async function fetchKiotProxyUrl(
  key: string,
  mode: 'current' | 'new' = 'current',
): Promise<string> {
  const res = await fetch(`${KIOTPROXY_BASE}/${mode}?key=${encodeURIComponent(key)}`, {
    headers: { accept: 'application/json' },
  });
  const json = (await res.json().catch(() => undefined)) as KiotProxyResponse | undefined;
  if (!res.ok || !json?.success) {
    throw new Error(`KiotProxy ${mode}: ${json?.message ?? `HTTP ${res.status}`}`);
  }
  const url = toProxyUrl(json.data);
  if (!url) throw new Error('KiotProxy: response không có thông tin proxy nhận diện được');
  return url;
}

/**
 * Chuẩn hoá field proxy trong `data` về URL `http://[user:pass@]host:port`.
 * KiotProxy trả `httpProxy` (định dạng có thể là `host:port`, `host:port:user:pass`,
 * `user:pass@host:port`, hoặc URL đầy đủ) — xử lý linh hoạt các biến thể.
 */
function toProxyUrl(data: Record<string, unknown> | undefined): string | undefined {
  // KiotProxy trả `http` ("host:port"); một số bản trả `httpProxy`.
  const raw = pickString(data, 'httpProxy') ?? pickString(data, 'http');
  if (!raw) return undefined;
  if (raw.includes('://')) return raw;

  const at = raw.split('@');
  if (at.length === 2) return `http://${raw}`; // user:pass@host:port

  const parts = raw.split(':');
  if (parts.length === 4) {
    const [host, port, user, pass] = parts;
    return `http://${user}:${pass}@${host}:${port}`;
  }
  if (parts.length === 2) return `http://${raw}`; // host:port (IP-whitelist)
  return undefined;
}

function pickString(obj: Record<string, unknown> | undefined, key: string): string | undefined {
  const v = obj?.[key];
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}
