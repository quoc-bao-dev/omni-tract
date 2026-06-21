/**
 * Kiểm tra proxy crawl FB đã hoạt động chưa.
 *   node --env-file=.env -r ts-node/register/transpile-only scripts/check-proxy.ts
 * So IP trực tiếp vs IP qua proxy + thử reach Facebook qua proxy.
 */
import { ProxyAgent } from 'undici';
import { fetchKiotProxyUrl } from '../src/infra/crawler/platforms/facebook/kiotproxy';

function out(msg: string): void {
  process.stdout.write(`${msg}\n`);
}

async function getIp(dispatcher?: ProxyAgent): Promise<string> {
  const res = await fetch('https://api.ipify.org?format=json', {
    ...(dispatcher ? { dispatcher } : {}),
  } as RequestInit);
  const j = (await res.json()) as { ip?: string };
  return j.ip ?? '?';
}

async function main() {
  const key = process.env.KIOTPROXY_KEY;
  const staticUrl = process.env.FB_PROXY_URL;

  const directIp = await getIp();
  out(`IP trực tiếp (không proxy): ${directIp}`);

  let proxyUrl: string | undefined;
  if (key) {
    out('Nguồn proxy: KIOTPROXY_KEY (động)');
    proxyUrl = await fetchKiotProxyUrl(key, 'current');
  } else if (staticUrl) {
    out('Nguồn proxy: FB_PROXY_URL (tĩnh)');
    proxyUrl = staticUrl;
  } else {
    out('❌ Chưa cấu hình proxy (KIOTPROXY_KEY / FB_PROXY_URL).');
    return;
  }

  const masked = proxyUrl.replace(/\/\/([^@]*@)?/, (_m, cred) => (cred ? '//***@' : '//'));
  out(`Proxy URL: ${masked}`);

  const agent = new ProxyAgent(proxyUrl);
  const proxyIp = await getIp(agent);
  out(`IP qua proxy            : ${proxyIp}`);
  out(
    `→ Định tuyến qua proxy  : ${proxyIp !== directIp ? '✅ CÓ (IP khác)' : '⚠️ GIỐNG IP trực tiếp'}`,
  );

  // Thử reach Facebook qua proxy.
  const fb = await fetch('https://www.facebook.com/robots.txt', {
    dispatcher: agent,
    headers: { 'user-agent': 'Mozilla/5.0' },
  } as RequestInit);
  out(`Facebook qua proxy      : HTTP ${fb.status} ${fb.ok ? '✅' : '⚠️'}`);
}

main().catch((e) => {
  process.stderr.write(`ERROR: ${(e as Error).message}\n`);
  process.exit(1);
});
