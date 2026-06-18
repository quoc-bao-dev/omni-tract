import { fbConfig } from './fb.config';
import { fbGraphql } from './graphql-client';
import { encodeStoryId, type StoryRef } from './story-id';

/** variables permalink — giữ nguyên cấu trúc FB, chỉ thay `storyID`. */
function postVariables(storyID: string) {
  return {
    feedbackSource: 2,
    feedLocation: 'PERMALINK',
    focusCommentID: null,
    privacySelectorRenderLocation: 'COMET_STREAM',
    renderLocation: 'permalink',
    scale: 1,
    storyID,
    useDefaultActor: false,
    __relay_internal__pv__GHLShouldChangeAdIdFieldNamerelayprovider: false,
    __relay_internal__pv__CometImmersivePhotoCanUserDisable3DMotionrelayprovider: false,
    __relay_internal__pv__IsWorkUserrelayprovider: false,
    __relay_internal__pv__IsMergQAPollsrelayprovider: false,
    __relay_internal__pv__CometUFIReactionsEnableShortNamerelayprovider: false,
    __relay_internal__pv__CometUFIShareActionMigrationrelayprovider: true,
    __relay_internal__pv__IncludeCommentWithAttachmentrelayprovider: true,
    __relay_internal__pv__StoriesArmadilloReplyEnabledrelayprovider: true,
    __relay_internal__pv__EventCometCardImage_prefetchEventImagerelayprovider: false,
  };
}

/** Permalink theo storyID base64 trực tiếp (post thường: tự encode; video: dùng story.id sẵn có). */
export async function fetchPermalink(storyID: string): Promise<unknown> {
  return fbGraphql({ docId: fbConfig.docId.post, variables: postVariables(storyID) });
}

/** Trả JSON thô của post thường (storyID = S:_I{actor}:{post}:{post}). */
export async function fetchPostByStory(ref: StoryRef): Promise<unknown> {
  return fetchPermalink(encodeStoryId(ref));
}
