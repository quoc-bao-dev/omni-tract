import type { CollectResultOk, Platform } from '@omni/sdk';
import { toCollectResultOk } from '../../normalizer';
import type { CrawlInput, PlatformCrawler } from '../../platform-crawler.interface';
import { fetchPermalink, fetchPostByStory } from './fetch-post';
import { parsePost } from './parse-post';
import { resolveStoryRef } from './story-id';
import { extractVideoId, fetchVideoStory } from './video';

/**
 * Crawler Facebook qua GraphQL công khai (KHÔNG account):
 *   - Post thường: URL → {actor,post} (doc 36104137065899111) → permalink (doc 8180153265427288).
 *   - Post video : URL → videoID → video query (doc 26984026684624315) lấy story.id thật
 *                  (format S:_I{actor}:VK:{videoId}) + link video → permalink lấy engagement.
 * Engagement (reaction/comment/share) luôn từ permalink; video chỉ thêm link + publish_time.
 * Parse best-effort (shape FB có thể đổi); lỗi sẽ throw → service map 'fetch_failed'.
 */
export class FacebookCrawler implements PlatformCrawler {
  readonly platform: Platform = 'facebook';

  async crawl({ sourceUrl }: CrawlInput): Promise<CollectResultOk> {
    const videoId = extractVideoId(sourceUrl);
    return videoId ? this.crawlVideo(sourceUrl, videoId) : this.crawlPost(sourceUrl);
  }

  private async crawlPost(sourceUrl: string): Promise<CollectResultOk> {
    const ref = await resolveStoryRef(sourceUrl);
    const parsed = parsePost(await fetchPostByStory(ref));
    return toCollectResultOk({
      sourceUrl,
      platform: 'facebook',
      type: parsed.type,
      title: parsed.title,
      text: parsed.text,
      images: parsed.images,
      postedAt: parsed.postedAt,
      videoUrl: parsed.videoUrl, // post video qua đường permalink vẫn có link phát
      metrics: parsed.metrics,
    });
  }

  private async crawlVideo(sourceUrl: string, videoId: string): Promise<CollectResultOk> {
    const video = await fetchVideoStory(videoId);
    const parsed = parsePost(await fetchPermalink(video.storyId));
    return toCollectResultOk({
      sourceUrl,
      platform: 'facebook',
      type: 'video',
      title: parsed.title,
      text: parsed.text,
      images: parsed.images,
      postedAt: parsed.postedAt ?? video.postedAt,
      videoUrl: video.videoUrl ?? parsed.videoUrl, // fallback nếu video query không trả link
      metrics: parsed.metrics,
    });
  }
}
