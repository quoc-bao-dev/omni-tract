import { Module } from '@nestjs/common';
import { CollectModule } from './collect/collect.module';

@Module({
  imports: [CollectModule],
})
export class AppModule {}
