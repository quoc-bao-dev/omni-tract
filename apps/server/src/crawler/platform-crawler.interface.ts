import { CollectResultOk, Platform } from '@omni/sdk';

export interface CrawlInput {
  sourceUrl: string;
}

/** Adapter thu thập cho 1 nền tảng (document §7). Ẩn chi tiết nguồn/token/rate-limit. */
export interface PlatformCrawler {
  readonly platform: Platform;
  /** Lấy + chuẩn hoá metric cho 1 URL. Throw lỗi domain nếu thất bại. */
  crawl(input: CrawlInput): Promise<CollectResultOk>;
}

/** Token DI cho tập các PlatformCrawler đăng ký. */
export const PLATFORM_CRAWLERS = Symbol('PLATFORM_CRAWLERS');
