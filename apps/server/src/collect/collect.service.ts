import { Injectable, Logger } from '@nestjs/common';
import { CollectResponse, CollectResult } from '@omni/sdk';
import { parsePlatform } from '../common/url/parse-platform';
import { CrawlerRegistry } from '../crawler/crawler.registry';

const CONCURRENCY = 5;

@Injectable()
export class CollectService {
  private readonly logger = new Logger(CollectService.name);

  constructor(private readonly registry: CrawlerRegistry) {}

  /** Fan-out có giới hạn concurrency; mỗi URL trả 1 CollectResult (partial failure, §10). */
  async collect(urls: string[]): Promise<CollectResponse> {
    const unique = [...new Set(urls.map((u) => u.trim()).filter(Boolean))];
    const results = await this.mapWithConcurrency(unique, CONCURRENCY, (url) =>
      this.collectOne(url),
    );
    return { results };
  }

  private async collectOne(sourceUrl: string): Promise<CollectResult> {
    const platform = parsePlatform(sourceUrl);
    if (!platform) {
      return { ok: false, sourceUrl, error: 'invalid_url' };
    }
    const crawler = this.registry.get(platform);
    if (!crawler) {
      return { ok: false, sourceUrl, error: 'unsupported_platform' };
    }
    try {
      return await crawler.crawl({ sourceUrl });
    } catch (err) {
      this.logger.warn(`crawl failed: ${sourceUrl} — ${(err as Error).message}`);
      // TODO: map lỗi domain → CollectErrorCode khi có nghiệp vụ thật.
      return { ok: false, sourceUrl, error: 'fetch_failed', message: (err as Error).message };
    }
  }

  private async mapWithConcurrency<T, R>(
    items: T[],
    limit: number,
    fn: (item: T) => Promise<R>,
  ): Promise<R[]> {
    const results: R[] = new Array(items.length);
    let cursor = 0;
    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const i = cursor++;
        results[i] = await fn(items[i]);
      }
    });
    await Promise.all(workers);
    return results;
  }
}
