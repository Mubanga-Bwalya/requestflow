import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { assertBootstrapSecurity } from './config/bootstrap-security';
import { parseCorsOrigins } from './config/cors';
import { requestIdMiddleware } from './common/middleware/request-id.middleware';
import { requestTimingMiddleware } from './common/middleware/request-timing.middleware';
import { validationExceptionFactory } from './common/validation-error-format';

async function bootstrap() {
  assertBootstrapSecurity();

  const app = await NestFactory.create(AppModule);

  app.use(requestIdMiddleware);
  app.use(requestTimingMiddleware);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: validationExceptionFactory,
    }),
  );

  app.enableCors({
    origin: parseCorsOrigins(),
    credentials: true,
  });

  const port = process.env.PORT ?? 4000;
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
