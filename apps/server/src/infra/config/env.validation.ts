import { plainToInstance, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min, validateSync } from 'class-validator';

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

  /** Key KiotProxy — nếu có, request crawl FB đi qua proxy (lấy proxy động qua API). */
  @IsOptional()
  @IsString()
  KIOTPROXY_KEY?: string;

  /** Proxy tĩnh (http://user:pass@host:port) — fallback khi không dùng KiotProxy. */
  @IsOptional()
  @IsString()
  FB_PROXY_URL?: string;

  // Override doc_id/endpoint FB khi FB đổi (mặc định trong fb.config.ts).
  @IsOptional()
  @IsString()
  FB_GRAPHQL_URL?: string;

  @IsOptional()
  @IsString()
  FB_DOC_ID_RESOLVE?: string;

  @IsOptional()
  @IsString()
  FB_DOC_ID_POST?: string;

  @IsOptional()
  @IsString()
  FB_DOC_ID_VIDEO?: string;
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
