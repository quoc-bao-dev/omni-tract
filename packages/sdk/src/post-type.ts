/** Loại nội dung (đồng bộ filter "Post type" ở frontend). */
export type PostType = 'photo' | 'text' | 'link' | 'livestream' | 'video' | 'carousel';

export const POST_TYPES: readonly PostType[] = [
  'photo',
  'text',
  'link',
  'livestream',
  'video',
  'carousel',
];
