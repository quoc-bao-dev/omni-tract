import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PLATFORMS } from '@omni/sdk';
import { CrawlerMode } from '../config/env.validation';
import { CrawlerRegistry } from './crawler.registry';
import { PlatformCrawler } from './platform-crawler.interface';
import { PLATFORM_CRAWLERS } from './platform-crawlers.token';
import { FacebookCrawler } from './platforms/facebook/facebook.crawler';
import { MockCrawler } from './platforms/mock.crawler';

/**
 * Chọn tập adapter theo `CRAWLER_MODE` (env):
 *  - `mock`: phủ MockCrawler cho mọi nền tảng (phase dev).
 *  - `real`: adapter thật trong `platforms/` (hiện có Facebook; nền tảng khác chưa hỗ trợ
 *    → CrawlerRegistry trả unsupported_platform).
 * Thêm nền tảng thật = thêm 1 file platforms/ + push vào nhánh `real`; tầng `collect` không đổi.
 */
function createCrawlers(mode: CrawlerMode): PlatformCrawler[] {
  if (mode === CrawlerMode.real) {
    return [new FacebookCrawler()];
  }
  return PLATFORMS.map((platform) => new MockCrawler(platform));
}

@Module({
  providers: [
    {
      provide: PLATFORM_CRAWLERS,
      inject: [ConfigService],
      useFactory: (config: ConfigService): PlatformCrawler[] =>
        createCrawlers(config.get<CrawlerMode>('CRAWLER_MODE', CrawlerMode.mock)),
    },
    CrawlerRegistry,
  ],
  exports: [CrawlerRegistry],
})
export class CrawlerModule {}
