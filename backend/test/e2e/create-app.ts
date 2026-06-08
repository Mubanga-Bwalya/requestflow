import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import helmet from 'helmet';
import { App } from 'supertest/types';
import { requestIdMiddleware } from '../../src/common/middleware/request-id.middleware';
import { validationExceptionFactory } from '../../src/common/validation-error-format';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { EMAILS } from './seed-constants';

export async function createE2eApp(): Promise<{
  app: INestApplication<App>;
  prisma: PrismaService;
}> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.use(requestIdMiddleware);
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
  await app.init();

  const prisma = app.get(PrismaService);
  return { app, prisma };
}

export async function isDatabaseReady(prisma: PrismaService): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const users = await prisma.user.count();
    if (users < 5) return false;
    const jane = await prisma.user.findFirst({
      where: { email: { equals: EMAILS.jane, mode: 'insensitive' } },
      select: { id: true },
    });
    return !!jane;
  } catch {
    return false;
  }
}

export async function closeE2eApp(app?: INestApplication<App>): Promise<void> {
  if (app) await app.close();
}
