import { fbConfig } from './fb.config';
import { firstNumber, walkObjects } from './fb-json';
import { fbGraphql } from './graphql-client';

export interface VideoStory {
  /** storyID base64 thật của video (format S:_I{actor}:VK:{videoId}) — dùng cho permalink. */
  storyId: string;
  /** Thời điểm đăng (publish_time), ISO 8601. */
  postedAt?: string;
  /** Link phát video (HD ưu tiên) — để show/nhúng, KHÔNG tải về. */
  videoUrl?: string;
}

// Ưu tiên HD → SD. KHÔNG tải video, chỉ lấy link để hiển thị.
const VIDEO_URL_KEYS = [
  'browser_native_hd_url',
  'playable_url_quality_hd',
  'playable_url',
  'browser_native_sd_url',
];

export function extractVideoUrl(data: unknown): string | undefined {
  for (const key of VIDEO_URL_KEYS) {
    for (const o of walkObjects(data)) {
      const v = o[key];
      if (typeof v === 'string' && v.startsWith('http')) return v;
    }
  }
  return undefined;
}

/** variables video query — giữ nguyên cấu trúc FB, chỉ thay videoID/videoIDStr. */
function videoVariables(videoId: string) {
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

/** video id từ URL: /watch/?v={id}, /videos/{slug}/{id}/, /reel/{id}. undefined nếu không phải video. */
export function extractVideoId(url: string): string | undefined {
  try {
    const u = new URL(url);
    const v = u.searchParams.get('v');
    if (v && /^\d+$/.test(v)) return v;
    const path = u.pathname;
    if (!/\/(?:videos|watch|reel|v)(?:\/|$)/.test(path)) return undefined;
    const m =
      path.match(/\/(?:videos|reel|v)\/(?:[^/]+\/)?(\d{6,})\/?$/) ?? path.match(/\/(\d{6,})\/?$/);
    return m?.[1];
  } catch {
    return undefined;
  }
}

/** Gọi video query → story id thật (cho permalink) + publish_time. */
export async function fetchVideoStory(videoId: string): Promise<VideoStory> {
  const data = await fbGraphql({ docId: fbConfig.docId.video, variables: videoVariables(videoId) });
  const story = (data as { data?: { video?: { story?: { id?: unknown } } } })?.data?.video?.story;
  const storyId = typeof story?.id === 'string' ? story.id : undefined;
  if (!storyId) {
    throw new Error('FB video: không lấy được story id từ video query.');
  }
  const publish = firstNumber(data, 'publish_time');
  return {
    storyId,
    postedAt: publish ? new Date(publish * 1000).toISOString() : undefined,
    videoUrl: extractVideoUrl(data),
  };
}
