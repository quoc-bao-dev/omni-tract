import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { validateEnv } from './env.validation';

/** Cấu hình toàn cục: nạp + validate env fail-fast (ARCHITECTURE §10). */
@Module({
  imports: [NestConfigModule.forRoot({ isGlobal: true, cache: true, validate: validateEnv })],
})
export class ConfigModule {}
