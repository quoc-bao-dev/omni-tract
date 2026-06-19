import { Injectable, Logger } from '@nestjs/common';
import { CollectResponse, CollectResult, CollectStreamEvent } from '@omni/sdk';
import {
  CRAWL_CONCURRENCY,
  mapWithConcurrency,
  streamWithConcurrency,
} from '../../infra/common/concurrency';
import { parsePlatform } from '../../infra/common/url/parse-platform';
import { CrawlerRegistry } from '../../infra/crawler/crawler.registry';

@Injectable()
export class CollectService {
  private readonly logger = new Logger(CollectService.name);

  constructor(private readonly registry: CrawlerRegistry) {}

  /** Fan-out có giới hạn concurrency; mỗi URL trả 1 CollectResult (partial failure, §10). */
  async collect(urls: string[]): Promise<CollectResponse> {
    const unique = [...new Set(urls.map((u) => u.trim()).filter(Boolean))];
    const results = await mapWithConcurrency(unique, CRAWL_CONCURRENCY, (url) =>
      this.collectOne(url),
    );
    return { results };
  }

  /**
   * Streaming: yield từng event ngay khi mỗi URL crawl xong (concurrency-limited).
   * Controller serialize ra NDJSON → client cập nhật UI tức thì, không chờ cả batch.
   */
  async *collectStream(urls: string[]): AsyncGenerator<CollectStreamEvent> {
    const unique = [...new Set(urls.map((u) => u.trim()).filter(Boolean))];
    yield { type: 'start', total: unique.length };
    for await (const result of streamWithConcurrency(unique, CRAWL_CONCURRENCY, (url) =>
      this.collectOne(url),
    )) {
      yield { type: 'result', result };
    }
    yield { type: 'done' };
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
}
