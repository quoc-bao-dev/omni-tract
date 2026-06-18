import { fbConfig } from './fb.config';
import { fbGraphql } from './graphql-client';

export interface StoryRef {
  actorId: string;
  postId: string;
}

/** variables của composer-preview — giữ nguyên cấu trúc FB, chỉ thay `params.url`. */
function resolveVariables(url: string) {
  return {
    feedLocation: 'FEED_COMPOSER',
    goodwillCampaignId: '',
    goodwillCampaignMediaIds: [],
    goodwillContentType: null,
    params: { url },
    privacySelectorRenderLocation: 'COMET_STREAM',
    referringStoryRenderLocation: null,
    renderLocation: 'composer_preview',
    parentStoryID: null,
    scale: 1,
    useDefaultActor: false,
    shouldIncludeStoryAttachment: false,
    __relay_internal__pv__GHLShouldChangeSponsoredDataFieldNamerelayprovider: true,
    __relay_internal__pv__TestPilotShouldIncludeDemoAdUseCaserelayprovider: false,
    __relay_internal__pv__CometUFICommentActionLinksRewriteEnabledrelayprovider: true,
    __relay_internal__pv__CometUFICommentAvatarStickerAnimatedImagerelayprovider: false,
    __relay_internal__pv__IsWorkUserrelayprovider: false,
    __relay_internal__pv__FBReels_enable_view_dubbed_audio_type_gkrelayprovider: true,
    __relay_internal__pv__CometFeedShareMedia_shouldPrefetchShareImagerelayprovider: false,
    __relay_internal__pv__CometImmersivePhotoCanUserDisable3DMotionrelayprovider: false,
    __relay_internal__pv__WorkCometIsEmployeeGKProviderrelayprovider: false,
    __relay_internal__pv__IsMergQAPollsrelayprovider: false,
    __relay_internal__pv__FBReels_deprecate_short_form_video_context_gkrelayprovider: true,
    __relay_internal__pv__FBReelsMediaFooter_comet_enable_reels_ads_gkrelayprovider: true,
  };
}

interface ScrapeData {
  share_type?: number;
  share_params?: unknown;
}

/**
 * URL → {actorId, postId}. Hai dạng URL (đã xác nhận shape share_scrape_data):
 *  - id-số `/{pageId}/posts/{postId}/` → share_type 18, share_params là MẢNG [actor, "posts/{id}/"].
 *  - username/slug `/{name}/posts/{slug}/{postId}/` → share_type 100, params là OBJECT (không có id)
 *    ⇒ post_id lấy từ URL, actor (page id) resolve riêng từ URL profile gốc.
 */
export async function resolveStoryRef(url: string): Promise<StoryRef> {
  const data = await fbGraphql({
    docId: fbConfig.docId.resolveUrl,
    variables: resolveVariables(url),
  });

  // 1) Dạng id-số: trích trực tiếp từ share_params (mảng).
  const direct = extractFromScrapeArray(data);
  if (direct) return direct;

  // 2) Dạng username/slug: post_id từ URL + page id resolve riêng.
  const postId = extractPostId(url);
  if (postId) {
    const actorId = await resolveActorId(url);
    if (actorId) return { actorId, postId };
  }

  // 3) URL là profile/page (không có post).
  if (readScrape(data)?.share_type === 1) {
    throw new Error('FB resolve: URL là profile/page, không phải post — chưa hỗ trợ.');
  }
  throw new Error('FB resolve: không trích được actor_id/post_id từ URL.');
}

/** Dạng id-số: share_params = [actorId, "posts/{postId}/"]. */
function extractFromScrapeArray(data: unknown): StoryRef | undefined {
  const scrape = readScrape(data);
  if (!scrape || !Array.isArray(scrape.share_params)) return undefined;
  const params = scrape.share_params.map((x) => String(x));
  const actorId = params.find((s) => /^\d+$/.test(s));
  const postId = params.map(extractPostId).find((id): id is string => !!id && id !== actorId);
  return actorId && postId ? { actorId, postId } : undefined;
}

/**
 * Trích post_id từ 1 share_param HOẶC 1 URL:
 * "story_fbid={id}", "posts|videos|reel|photos/{id}", đuôi "/{id}/", hoặc chuỗi số dài.
 */
function extractPostId(input: string): string | undefined {
  const path = input.split('?')[0];
  const m =
    input.match(/[?&]story_fbid=(\d+)/) ??
    path.match(/(?:posts|videos|reel|photos|permalink)\/(\d+)/) ??
    path.match(/\/(\d{8,})\/?$/) ??
    path.match(/(\d{8,})/);
  return m?.[1];
}

/** Resolve page/profile id từ URL profile gốc (segment đầu của path). */
async function resolveActorId(url: string): Promise<string | undefined> {
  const base = baseProfileUrl(url);
  if (!base) return undefined;
  const data = await fbGraphql({
    docId: fbConfig.docId.resolveUrl,
    variables: resolveVariables(base),
  });
  const params = readScrape(data)?.share_params;
  if (!Array.isArray(params)) return undefined;
  return params.map((x) => String(x)).find((s) => /^\d+$/.test(s));
}

function baseProfileUrl(url: string): string | undefined {
  try {
    const u = new URL(url);
    const seg = u.pathname.split('/').filter(Boolean)[0];
    if (!seg) return undefined;
    if (seg === 'profile.php') {
      const id = u.searchParams.get('id');
      return id ? `https://www.facebook.com/profile.php?id=${id}` : undefined;
    }
    return `https://www.facebook.com/${seg}`;
  } catch {
    return undefined;
  }
}

function readScrape(data: unknown): ScrapeData | undefined {
  const raw = (data as { data?: { link_preview?: { share_scrape_data?: unknown } } })?.data
    ?.link_preview?.share_scrape_data;
  if (typeof raw !== 'string') return undefined;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as ScrapeData) : undefined;
  } catch {
    return undefined;
  }
}

/** encoded_storyID = base64("S:_I{actor_id}:{post_id}:{post_id}"). */
export function encodeStoryId({ actorId, postId }: StoryRef): string {
  return Buffer.from(`S:_I${actorId}:${postId}:${postId}`, 'utf8').toString('base64');
}
