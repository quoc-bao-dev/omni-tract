import { Module } from '@nestjs/common';
import { ConfigModule } from './infra/config/config.module';
import { CollectModule } from './modules/collect/collect.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [ConfigModule, CollectModule, HealthModule],
})
export class AppModule {}
