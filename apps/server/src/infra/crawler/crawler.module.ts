import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PLATFORMS } from '@omni/sdk';
import { CrawlerMode } from '../config/env.validation';
import { CrawlerRegistry } from './crawler.registry';
import { PlatformCrawler } from './platform-crawler.interface';
import { PLATFORM_CRAWLERS } from './platform-crawlers.token';
import { MockCrawler } from './platforms/mock.crawler';

/**
 * Chọn tập adapter theo `CRAWLER_MODE` (env):
 *  - `mock`: phủ MockCrawler cho mọi nền tảng (phase dev).
 *  - `real`: đăng ký adapter thật trong `platforms/*.crawler.ts` (TBD nghiệp vụ, §7).
 * Thêm nền tảng thật = thêm 1 file platforms/ + push vào nhánh `real`; tầng `collect` không đổi.
 */
function createCrawlers(mode: CrawlerMode): PlatformCrawler[] {
  if (mode === CrawlerMode.real) {
    // TODO(§7): return [new FacebookCrawler(), new TiktokCrawler(), ...] khi chốt nghiệp vụ.
    return [];
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
