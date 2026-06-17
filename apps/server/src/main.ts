import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module';

// FE (Next dev) chạy 3000 → BE mặc định 4100 để không trùng port FE/các service khác.
const PORT = Number(process.env.PORT ?? 4100);
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? 'http://localhost:3000';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
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
  // eslint-disable-next-line no-console
  console.log(`API: http://localhost:${PORT}/api  ·  Docs: http://localhost:${PORT}/api/docs`);
}
void bootstrap();
