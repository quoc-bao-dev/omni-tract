import type { SelectOption } from '@/components/ui/multi-select';

export type FilterGroupKey = 'platforms' | 'postTypes' | 'statuses';

export interface FilterValue {
  postedOn: string;
  platforms: string[];
  postTypes: string[];
  statuses: string[];
}

export const EMPTY_FILTER: FilterValue = {
  postedOn: '',
  platforms: [],
  postTypes: [],
  statuses: [],
};

export const PLATFORMS: SelectOption<string>[] = [
  { value: 'tiktok', label: 'Tiktok' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'threads', label: 'Threads' },
  { value: 'youtube', label: 'Youtube' },
  { value: 'x', label: 'X' },
  { value: 'linkedin', label: 'Linkedin' },
  { value: 'reddit', label: 'Reddit' },
];

export const POST_TYPES: SelectOption<string>[] = [
  { value: 'photo', label: 'Photo' },
  { value: 'text', label: 'Text' },
  { value: 'link', label: 'Link' },
  { value: 'livestream', label: 'Livestream' },
  { value: 'video', label: 'Video' },
  { value: 'carousel', label: 'Carousel' },
];

export const STATUSES: SelectOption<string>[] = [
  { value: 'success', label: 'Success' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'unsupported', label: 'Unsupported' },
];

/** Cấu hình nhóm hiển thị ở thanh active-filters (Figma 143:9094). */
export const FILTER_GROUPS: {
  key: FilterGroupKey;
  label: string;
  options: SelectOption<string>[];
}[] = [
  { key: 'platforms', label: 'Platform:', options: PLATFORMS },
  { key: 'postTypes', label: 'Post type:', options: POST_TYPES },
  { key: 'statuses', label: 'Status:', options: STATUSES },
];

export function labelOf(options: SelectOption<string>[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

export function isFilterActive(v: FilterValue): boolean {
  return (
    v.postedOn.trim() !== '' ||
    v.platforms.length > 0 ||
    v.postTypes.length > 0 ||
    v.statuses.length > 0
  );
}
