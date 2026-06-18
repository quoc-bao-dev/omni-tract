import { CollectResultOk, Metrics, Platform, PostType } from '@omni/sdk';

/** Dữ liệu thô 1 adapter lấy được, trước khi chuẩn hoá thành CollectResultOk. */
export interface RawContent {
  sourceUrl: string;
  platform: Platform;
  type: PostType;
  title?: string;
  /** ISO 8601. */
  postedAt?: string;
  metrics: Metrics;
}

/**
 * Gom dữ liệu thô từ adapter → `CollectResultOk` chuẩn (@omni/sdk):
 * tự sinh `contentId` và stamp `fetchedAt`. Mọi adapter đi qua đây để đồng nhất output.
 */
export function toCollectResultOk(raw: RawContent): CollectResultOk {
  const rand = Math.floor(Math.random() * 1e6).toString(36);
  return {
    ok: true,
    sourceUrl: raw.sourceUrl,
    contentId: `${raw.platform}_${Date.now().toString(36)}_${rand}`,
    platform: raw.platform,
    type: raw.type,
    title: raw.title,
    postedAt: raw.postedAt,
    metrics: raw.metrics,
    fetchedAt: new Date().toISOString(),
  };
}
