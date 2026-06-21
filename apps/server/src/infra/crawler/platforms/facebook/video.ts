import { fbConfig } from './fb.config';
import { firstNumber, walkObjects } from './fb-json';
import { fbGraphqlRaw, parseFbJsonChunks } from './graphql-client';

// Ưu tiên HD → SD. KHÔNG tải video, chỉ lấy link để hiển thị.
const VIDEO_URL_KEYS = [
  'browser_native_hd_url',
  'playable_url_quality_hd',
  'playable_url',
  'browser_native_sd_url',
];

/** Link phát đầu tiên (ưu tiên HD) tìm thấy ở bất kỳ độ sâu nào trong cây. */
export function extractVideoUrl(data: unknown): string | undefined {
  for (const key of VIDEO_URL_KEYS) {
    for (const o of walkObjects(data)) {
      const v = o[key];
      if (typeof v === 'string' && v.startsWith('http')) return v;
    }
  }
  return undefined;
}

/** variables video query (video_home) — giữ nguyên cấu trúc FB, chỉ thay videoID/videoIDStr. */
export function videoVariables(videoId: string) {
  return {
    caller: 'TAHOE',
    entityNumber: 5,
    feedbackSource: 41,
    feedLocation: 'TAHOE',
    isCrawler: false,
    isLoggedOut: false,
    privacySelectorRenderLocation: 'COMET_STREAM',
    renderLocation: 'video_home',
    scale: 1,
    useDefaultActor: false,
    videoID: videoId,
    videoIDStr: videoId,
    __relay_internal__pv__FBReels_enable_view_dubbed_audio_type_gkrelayprovider: true,
    __relay_internal__pv__CometUFISingleLineUFIrelayprovider: true,
    __relay_internal__pv__CometUFIShareActionMigrationrelayprovider: true,
    __relay_internal__pv__GHLShouldChangeSponsoredDataFieldNamerelayprovider: true,
    __relay_internal__pv__TestPilotShouldIncludeDemoAdUseCaserelayprovider: false,
    __relay_internal__pv__CometUFICommentAutoTranslationTyperelayprovider: 'AUTO_TRANSLATE',
    __relay_internal__pv__CometUFICommentAvatarStickerAnimatedImagerelayprovider: false,
    __relay_internal__pv__CometUFICommentActionLinksRewriteEnabledrelayprovider: true,
    __relay_internal__pv__IsWorkUserrelayprovider: false,
  };
}

export interface VideoMeta {
  /** Link phát video (HD ưu tiên) — để show/nhúng, KHÔNG tải về. */
  videoUrl?: string;
  /** Thời điểm đăng (publish_time), ISO 8601. */
  postedAt?: string;
  /** Lượt xem video — null nếu FB không công khai. */
  views?: number | null;
  /** Lượt phát video — null nếu FB không công khai. */
  plays?: number | null;
}

/**
 * Object `video_view_count_renderer.feedback` — chứa cả view & play count, nằm trong chunk @defer
 * `CometVideoHomeHeroUnit_story$defer$CometVideoHomeHeroUnitLeftBottomSection_video`.
 * Quét mọi object/chunk để không phụ thuộc vị trí chunk.
 */
function findViewCountFeedback(data: unknown): Record<string, unknown> | undefined {
  for (const o of walkObjects(data)) {
    const renderer = o.video_view_count_renderer as { feedback?: unknown } | undefined;
    const fb = renderer?.feedback;
    if (fb && typeof fb === 'object') return fb as Record<string, unknown>;
  }
  return undefined;
}

/**
 * Trích views + plays từ renderer:
 *   views = ...feedback.video_view_count
 *   plays = ...feedback.play_count
 * null nếu FB ẩn (renderer/feedback null).
 */
export function extractVideoCounts(data: unknown): { views: number | null; plays: number | null } {
  const fb = findViewCountFeedback(data);
  const num = (key: string) => (typeof fb?.[key] === 'number' ? (fb[key] as number) : null);
  return { views: num('video_view_count'), plays: num('play_count') };
}

/**
 * Bước 3: videoID (lấy từ permalink attachments[0].target.id) → link phát + publish_time + views/plays.
 * doc 26984026684624315. Response gồm NHIỀU chunk @stream/@defer → parse hết rồi quét.
 * KHÔNG cần đăng nhập.
 */
export async function fetchVideoMeta(videoId: string): Promise<VideoMeta> {
  const raw = await fbGraphqlRaw({
    docId: fbConfig.docId.video,
    variables: videoVariables(videoId),
  });
  const chunks = parseFbJsonChunks(raw);
  const publish = firstNumber(chunks, 'publish_time');
  const { views, plays } = extractVideoCounts(chunks);
  return {
    videoUrl: extractVideoUrl(chunks),
    postedAt: publish ? new Date(publish * 1000).toISOString() : undefined,
    views,
    plays,
  };
}
