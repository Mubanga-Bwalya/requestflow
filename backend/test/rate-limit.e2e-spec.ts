import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service';
import { closeE2eApp, createE2eApp, isDatabaseReady } from './e2e/create-app';

describe('Login rate limiting (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    process.env.E2E_DISABLE_THROTTLE = 'false';
    const ctx = await createE2eApp();
    app = ctx.app;
    prisma = ctx.prisma;
  });

  afterAll(() => {
    process.env.E2E_DISABLE_THROTTLE = 'true';
  });

  afterAll(async () => {
    process.env.E2E_DISABLE_THROTTLE = 'true';
    await closeE2eApp(app);
  });

  it('returns 429 after exceeding login attempts', async () => {
    const ready = await isDatabaseReady(prisma);
    if (!ready) {
      console.warn('Skipping rate-limit e2e: database not seeded');
      return;
    }

    const server = app.getHttpServer();
    // Unique email per run so other e2e suites and prior runs do not consume this IP bucket.
    // Uses dev-login (email only, throttled identically) so no Zamtel call is made.
    const payload = {
      email: `rate-limit-${Date.now()}@invalid.local`,
    };

    for (let i = 0; i < 5; i++) {
      await request(server).post('/auth/dev-login').send(payload).expect(401);
    }

    await request(server).post('/auth/dev-login').send(payload).expect(429);
  });
});
