import type { CollectResultOk, Platform } from '@omni/sdk';
import { toCollectResultOk } from '../../normalizer';
import type { CrawlInput, PlatformCrawler } from '../../platform-crawler.interface';
import { fetchPostByStory } from './fetch-post';
import { extractVideoTargetId, parsePost } from './parse-post';
import { resolveStoryRef } from './story-id';
import { fetchVideoMeta } from './video';

/**
 * Crawler Facebook qua GraphQL công khai (KHÔNG account/đăng nhập). Luồng 3 bước:
 *   1) URL → {actor_id, post_id}            (composer-preview, doc 36104137065899111)
 *   2) storyID = base64("S:_I{a}:{p}:{p}")  → permalink: meta + engagement + video target id
 *      (node.comet_sections.content.story.attachments[0].target.id)
 *   3) nếu là video: videoID → link phát + publish_time   (video query, doc 26984026684624315)
 * URL truyền THẲNG vào API ở bước 1, không tiền xử lý. Lỗi → throw → service map 'fetch_failed'.
 */
export class FacebookCrawler implements PlatformCrawler {
  readonly platform: Platform = 'facebook';

  async crawl({ sourceUrl }: CrawlInput): Promise<CollectResultOk> {
    const ref = await resolveStoryRef(sourceUrl); // bước 1
    const permalink = await fetchPostByStory(ref); // bước 2
    const parsed = parsePost(permalink);

    let { type, videoUrl, postedAt } = parsed;
    const videoId = extractVideoTargetId(permalink);
    if (videoId) {
      type = 'video';
      try {
        const video = await fetchVideoMeta(videoId); // bước 3
        videoUrl = video.videoUrl ?? videoUrl;
        postedAt = postedAt ?? video.postedAt;
      } catch {
        // video query lỗi → vẫn trả meta + engagement đã lấy từ permalink
      }
    }

    return toCollectResultOk({
      sourceUrl,
      platform: 'facebook',
      type,
      title: parsed.title,
      author: parsed.author,
      text: parsed.text,
      images: parsed.images,
      postedAt,
      videoUrl,
      metrics: parsed.metrics,
    });
  }
}
