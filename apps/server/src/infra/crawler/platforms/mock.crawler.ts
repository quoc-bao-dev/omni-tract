import { CollectResultOk, Metrics, Platform, PostType } from '@omni/sdk';
import { toCollectResultOk } from '../normalizer';
import { CrawlInput, PlatformCrawler } from '../platform-crawler.interface';

const POST_TYPES: PostType[] = ['photo', 'text', 'link', 'livestream', 'video', 'carousel'];
const FAIL_RATE = 0.15;

const rnd = (max: number) => Math.floor(Math.random() * max);
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function mockMetrics(): Metrics {
  const base = 1000 + rnd(900_000);
  return {
    likes: base + rnd(5000),
    comments: rnd(20_000),
    shares: rnd(10_000),
    views: base * (5 + rnd(20)),
    saves: rnd(8000),
    plays: base * (2 + rnd(10)),
  };
}

/**
 * MOCK adapter (phase dev): metric giả + delay nhỏ, ~15% URL fail để demo "Partial errors".
 * Là 1 PlatformCrawler bình thường nên swap sang adapter thật không đụng tầng trên (§7).
 * Bật/tắt qua env `CRAWLER_MODE` ở CrawlerModule — KHÔNG trộn vào code adapter thật.
 */
export class MockCrawler implements PlatformCrawler {
  constructor(readonly platform: Platform) {}

  async crawl({ sourceUrl }: CrawlInput): Promise<CollectResultOk> {
    await delay(4000 + rnd(900));
    if (Math.random() < FAIL_RATE) {
      throw new Error('mock: tạm thời không lấy được dữ liệu');
    }
    return toCollectResultOk({
      sourceUrl,
      platform: this.platform,
      type: POST_TYPES[rnd(POST_TYPES.length)] as PostType,
      title: 'Mock content title',
      postedAt: new Date(Date.now() - rnd(60) * 86_400_000).toISOString(),
      metrics: mockMetrics(),
    });
  }
}
