import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './infra/common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Config đã validate fail-fast (ConfigModule). FE dev chạy 3000 → BE mặc định 4100.
  const config = app.get(ConfigService);
  const PORT = config.get<number>('PORT', 4100);
  const WEB_ORIGIN = config.get<string>('WEB_ORIGIN', 'http://localhost:3000');

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors({ origin: WEB_ORIGIN });

  // OpenAPI + Scalar API reference tại /api/docs
  const openapi = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('OmniTract API')
      .setDescription('Thu thập metric nội dung mạng xã hội (document §7).')
      .setVersion('0.1.0')
      .build(),
  );
  SwaggerModule.setup('api/openapi', app, openapi, { jsonDocumentUrl: 'api/openapi.json' });
  app.use('/api/docs', apiReference({ content: openapi }));

  await app.listen(PORT);
  Logger.log(
    `API: http://localhost:${PORT}/api  ·  Docs: /api/docs  ·  Health: /api/health`,
    'Bootstrap',
  );
}
void bootstrap();
