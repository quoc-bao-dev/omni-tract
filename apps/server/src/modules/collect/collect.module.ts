import { Module } from '@nestjs/common';
import { CrawlerModule } from '../../infra/crawler/crawler.module';
import { CollectController } from './collect.controller';
import { CollectService } from './collect.service';

@Module({
  imports: [CrawlerModule],
  controllers: [CollectController],
  providers: [CollectService],
})
export class CollectModule {}
