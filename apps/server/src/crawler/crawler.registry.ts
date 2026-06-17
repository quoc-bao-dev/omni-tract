import { Inject, Injectable } from '@nestjs/common';
import { Platform } from '@omni/sdk';
import { PLATFORM_CRAWLERS, PlatformCrawler } from './platform-crawler.interface';

/** Phân giải PlatformCrawler theo nền tảng. Thêm nền tảng = đăng ký thêm provider. */
@Injectable()
export class CrawlerRegistry {
  private readonly byPlatform = new Map<Platform, PlatformCrawler>();

  constructor(@Inject(PLATFORM_CRAWLERS) crawlers: PlatformCrawler[]) {
    for (const c of crawlers) this.byPlatform.set(c.platform, c);
  }

  /** null nếu nền tảng chưa được hỗ trợ. */
  get(platform: Platform): PlatformCrawler | null {
    return this.byPlatform.get(platform) ?? null;
  }
}
