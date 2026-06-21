import { Module } from '@nestjs/common';
import { CrawlerRegistry } from './crawler.registry';
import { PlatformCrawler } from './platform-crawler.interface';
import { PLATFORM_CRAWLERS } from './platform-crawlers.token';
import { FacebookCrawler } from './platforms/facebook/facebook.crawler';

/**
 * Tập adapter thật trong `platforms/` (hiện có Facebook; nền tảng khác chưa hỗ trợ
 * → CrawlerRegistry trả unsupported_platform).
 * Thêm nền tảng = thêm 1 file platforms/ + push vào danh sách dưới; tầng `collect` không đổi.
 */
@Module({
  providers: [
    {
      provide: PLATFORM_CRAWLERS,
      useFactory: (): PlatformCrawler[] => [new FacebookCrawler()],
    },
    CrawlerRegistry,
  ],
  exports: [CrawlerRegistry],
})
export class CrawlerModule {}
