import { Module } from '@nestjs/common';
import { CrawlerRegistry } from './crawler.registry';
import { PLATFORM_CRAWLERS } from './platform-crawler.interface';
import { FacebookCrawler } from './platforms/facebook.crawler';

@Module({
  providers: [
    FacebookCrawler,
    // Phase 1: chỉ Facebook. Thêm nền tảng → thêm vào mảng này.
    {
      provide: PLATFORM_CRAWLERS,
      useFactory: (fb: FacebookCrawler) => [fb],
      inject: [FacebookCrawler],
    },
    CrawlerRegistry,
  ],
  exports: [CrawlerRegistry],
})
export class CrawlerModule {}
