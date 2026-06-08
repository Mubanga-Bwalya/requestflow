import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service';
import { authHeader, loginJane } from './e2e/auth-helpers';
import { EMAILS } from './e2e/seed-constants';
import { closeE2eApp, createE2eApp, isDatabaseReady } from './e2e/create-app';

describe('API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const ctx = await createE2eApp();
    app = ctx.app;
    prisma = ctx.prisma;
  });

  afterAll(async () => {
    await closeE2eApp(app);
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('ok');
        expect(res.body.service).toBe('RequestFlow API');
      });
  });

  it('/workspace (GET) without token returns 401', () => {
    return request(app.getHttpServer()).get('/workspace').expect(401);
  });

  it('login and /auth/me', async () => {
    if (!(await isDatabaseReady(prisma))) {
      console.warn('Skipping login e2e: database not seeded');
      return;
    }

    const token = await loginJane(app);

    await request(app.getHttpServer())
      .get('/auth/me')
      .set(authHeader(token))
      .expect(200)
      .expect((res) => {
        expect(res.body.email).toBe(EMAILS.jane);
      });
  });
});
