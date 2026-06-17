/** Nền tảng mạng xã hội được hỗ trợ (đồng bộ filter "Platform type" ở frontend). */
export type Platform =
  | 'tiktok'
  | 'facebook'
  | 'instagram'
  | 'threads'
  | 'youtube'
  | 'x'
  | 'linkedin'
  | 'reddit';

export const PLATFORMS: readonly Platform[] = [
  'tiktok',
  'facebook',
  'instagram',
  'threads',
  'youtube',
  'x',
  'linkedin',
  'reddit',
];
