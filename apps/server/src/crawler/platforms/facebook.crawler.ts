import { Injectable, NotImplementedException } from '@nestjs/common';
import { CollectResultOk, Platform } from '@omni/sdk';
import { CrawlInput, PlatformCrawler } from '../platform-crawler.interface';

/** Phase 1 — Facebook. Nghiệp vụ crawl thật: TBD (document §7). */
@Injectable()
export class FacebookCrawler implements PlatformCrawler {
  readonly platform: Platform = 'facebook';

  crawl(_input: CrawlInput): Promise<CollectResultOk> {
    // TODO: triển khai thu thập + chuẩn hoá → Metrics khi chốt nghiệp vụ.
    throw new NotImplementedException('FacebookCrawler chưa triển khai (nghiệp vụ TBD)');
  }
}
