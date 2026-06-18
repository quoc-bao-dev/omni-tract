import { plainToInstance, Type } from 'class-transformer';
import { IsEnum, IsInt, IsString, Max, Min, validateSync } from 'class-validator';

/** Nguồn dữ liệu crawl: mock (phase dev) hay adapter thật (§7). */
export enum CrawlerMode {
  mock = 'mock',
  real = 'real',
}

/** Schema biến môi trường — validate fail-fast lúc bootstrap (ARCHITECTURE §10). */
export class EnvVars {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 4100;

  /** CORS allowlist origin của FE (bắt buộc vì FE static gọi cross-origin). */
  @IsString()
  WEB_ORIGIN = 'http://localhost:3000';

  @IsEnum(CrawlerMode)
  CRAWLER_MODE: CrawlerMode = CrawlerMode.mock;
}

/** Dùng cho ConfigModule.forRoot({ validate }). Throw → app không khởi động nếu env sai. */
export function validateEnv(config: Record<string, unknown>): EnvVars {
  const validated = plainToInstance(EnvVars, config, { enableImplicitConversion: true });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    const detail = errors.map((e) => Object.values(e.constraints ?? {}).join(', ')).join('\n');
    throw new Error(`Invalid environment variables:\n${detail}`);
  }
  return validated;
}
