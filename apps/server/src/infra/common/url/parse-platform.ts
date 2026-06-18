import { Platform } from '@omni/sdk';

const HOST_PLATFORM: { match: RegExp; platform: Platform }[] = [
  { match: /(^|\.)tiktok\.com$/i, platform: 'tiktok' },
  { match: /(^|\.)facebook\.com$/i, platform: 'facebook' },
  { match: /(^|\.)fb\.(com|watch)$/i, platform: 'facebook' },
  { match: /(^|\.)instagram\.com$/i, platform: 'instagram' },
  { match: /(^|\.)threads\.(net|com)$/i, platform: 'threads' },
  { match: /(^|\.)(youtube\.com|youtu\.be)$/i, platform: 'youtube' },
  { match: /(^|\.)(x\.com|twitter\.com)$/i, platform: 'x' },
  { match: /(^|\.)linkedin\.com$/i, platform: 'linkedin' },
  { match: /(^|\.)reddit\.com$/i, platform: 'reddit' },
];

/** Nhận diện nền tảng từ URL. Trả null nếu URL sai hoặc nền tảng không hỗ trợ. */
export function parsePlatform(rawUrl: string): Platform | null {
  let host: string;
  try {
    host = new URL(rawUrl.trim().startsWith('http') ? rawUrl.trim() : `https://${rawUrl.trim()}`)
      .hostname;
  } catch {
    return null;
  }
  return HOST_PLATFORM.find((h) => h.match.test(host))?.platform ?? null;
}
