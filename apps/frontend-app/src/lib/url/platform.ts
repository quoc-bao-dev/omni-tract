import type { Platform } from '@omni/sdk';

const HOST_PLATFORM: { match: RegExp; platform: Platform }[] = [
  { match: /tiktok\.com$/i, platform: 'tiktok' },
  { match: /(facebook\.com|fb\.com|fb\.watch)$/i, platform: 'facebook' },
  { match: /instagram\.com$/i, platform: 'instagram' },
  { match: /threads\.(net|com)$/i, platform: 'threads' },
  { match: /(youtube\.com|youtu\.be)$/i, platform: 'youtube' },
  { match: /(x\.com|twitter\.com)$/i, platform: 'x' },
  { match: /linkedin\.com$/i, platform: 'linkedin' },
  { match: /reddit\.com$/i, platform: 'reddit' },
];

/** Đoán nền tảng từ URL (client). null nếu không nhận diện. */
export function parsePlatform(rawUrl: string): Platform | null {
  let host: string;
  try {
    const u = rawUrl.trim();
    host = new URL(u.startsWith('http') ? u : `https://${u}`).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
  return HOST_PLATFORM.find((h) => h.match.test(host))?.platform ?? null;
}
