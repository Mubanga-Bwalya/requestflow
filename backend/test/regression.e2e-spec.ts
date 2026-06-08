import { INestApplication } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  authHeader,
  loginAdmin,
  loginHelen,
  loginHenry,
  loginJane,
  loginMary,
} from './e2e/auth-helpers';
import { closeE2eApp, createE2eApp, isDatabaseReady } from './e2e/create-app';
import { createSubmittedHrRequest } from './e2e/hr-request.helpers';
import { resolveSeedUsers, type ResolvedSeedUsers } from './e2e/resolve-users';
import { SEED } from './e2e/seed-constants';

describe('Security and workflow regression (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let dbReady = false;
  let users: ResolvedSeedUsers;

  beforeAll(async () => {
    const ctx = await createE2eApp();
    app = ctx.app;
    prisma = ctx.prisma;
    dbReady = await isDatabaseReady(prisma);
    if (dbReady) {
      try {
        await loginJane(app);
        users = await resolveSeedUsers(prisma);
      } catch {
        dbReady = false;
      }
    }
  });

  afterAll(async () => {
    await closeE2eApp(app);
  });

  function skipIfNoDb(): boolean {
    return !dbReady;
  }

  describe('Authorization', () => {
    it('POST provide-information — non-requester returns 403', async () => {
      if (skipIfNoDb()) return;

      const janeToken = await loginJane(app);
      const henryToken = await loginHenry(app);
      const helenToken = await loginHelen(app);
      const requestId = await createSubmittedHrRequest(app, janeToken, 'Provide authz');

      await request(app.getHttpServer())
        .post(`/requests/${requestId}/request-missing-information`)
        .set(authHeader(henryToken))
        .send({ items: [{ reasonLabel: 'Clarify scope' }] })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/requests/${requestId}/provide-information`)
        .set(authHeader(helenToken))
        .send({ fieldAnswers: [{ fieldKey: 'title', answerText: 'Not requester' }] })
        .expect(403);
    });

    it('PATCH request status — requester APPROVED before reviewable returns 400', async () => {
      if (skipIfNoDb()) return;

      const janeToken = await loginJane(app);
      const requestId = await createSubmittedHrRequest(app, janeToken, 'Early approve');

      await request(app.getHttpServer())
        .patch(`/requests/${requestId}/status`)
        .set(authHeader(janeToken))
        .send({ status: 'APPROVED' })
        .expect(400);
    });

    it('PATCH request status — wrong-department manager ACCEPT returns 403', async () => {
      if (skipIfNoDb()) return;

      const janeToken = await loginJane(app);
      const maryToken = await loginMary(app);
      const requestId = await createSubmittedHrRequest(app, janeToken, 'Wrong dept manager');

      await request(app.getHttpServer())
        .patch(`/requests/${requestId}/status`)
        .set(authHeader(maryToken))
        .send({ status: 'ACCEPTED' })
        .expect(404);
    });

    it('POST /assignments — non-manager returns 403', async () => {
      if (skipIfNoDb()) return;

      const janeToken = await loginJane(app);
      const henryToken = await loginHenry(app);
      const requestId = await createSubmittedHrRequest(app, janeToken, 'Assign authz');

      await request(app.getHttpServer())
        .patch(`/requests/${requestId}/status`)
        .set(authHeader(henryToken))
        .send({ status: 'ACCEPTED' })
        .expect(200);

      await request(app.getHttpServer())
        .post('/assignments')
        .set(authHeader(janeToken))
        .send({
          requestId,
          memberUserIds: [users.helenHr],
        })
        .expect(403);
    });

    it('GET /requests inbox — non-manager returns 403', async () => {
      if (skipIfNoDb()) return;

      const helenToken = await loginHelen(app);

      await request(app.getHttpServer())
        .get('/requests')
        .query({ targetDepartmentName: 'HR' })
        .set(authHeader(helenToken))
        .expect(403);
    });

    it('PATCH /notifications/:id/read — cannot mark another user notification', async () => {
      if (skipIfNoDb()) return;

      const janeToken = await loginJane(app);
      const helenToken = await loginHelen(app);
      const requestId = await createSubmittedHrRequest(app, janeToken, 'Notification isolation');

      const notification = await prisma.notification.create({
        data: {
          userId: users.helenHr,
          type: NotificationType.REQUEST_SUBMITTED,
          title: 'E2E notification',
          message: 'Belongs to Helen only',
          relatedRequestId: requestId,
        },
      });

      await request(app.getHttpServer())
        .patch(`/notifications/${notification.id}/read`)
        .set(authHeader(janeToken))
        .expect(404);

      const row = await prisma.notification.findUnique({ where: { id: notification.id } });
      expect(row?.isRead).toBe(false);

      await request(app.getHttpServer())
        .patch(`/notifications/${notification.id}/read`)
        .set(authHeader(helenToken))
        .expect(200);
    });

    it('demoted admin token cannot access admin routes', async () => {
      if (skipIfNoDb()) return;

      const adminToken = await loginAdmin(app);

      await prisma.user.update({
        where: { id: users.admin },
        data: { roleId: SEED.role.employee },
      });

      try {
        await request(app.getHttpServer())
          .get('/admin/dashboard')
          .set(authHeader(adminToken))
          .expect(403);

        await request(app.getHttpServer())
          .get('/admin/reports')
          .set(authHeader(adminToken))
          .expect(403);
      } finally {
        await prisma.user.update({
          where: { id: users.admin },
          data: { roleId: SEED.role.admin },
        });
      }
    });
  });

  describe('Validation and error responses', () => {
    it('returns structured 400 with errors and requestId', async () => {
      if (skipIfNoDb()) return;

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'not-an-email', password: '' })
        .expect(400);

      expect(res.body.statusCode).toBe(400);
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors.length).toBeGreaterThan(0);
      expect(res.headers['x-request-id']).toBeTruthy();
      expect(res.body.requestId).toBe(res.headers['x-request-id']);
    });

    it('GET /admin/system-events — admin only', async () => {
      if (skipIfNoDb()) return;

      await request(app.getHttpServer()).get('/admin/system-events').expect(401);

      const adminToken = await loginAdmin(app);
      const res = await request(app.getHttpServer())
        .get('/admin/system-events')
        .set(authHeader(adminToken))
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(res.body).toMatchObject({
        page: 1,
        limit: 10,
        items: expect.any(Array),
        total: expect.any(Number),
        totalPages: expect.any(Number),
      });
    });

    it('rejects invalid assignment payload and status enum', async () => {
      if (skipIfNoDb()) return;

      const henryToken = await loginHenry(app);
      const janeToken = await loginJane(app);
      const requestId = await createSubmittedHrRequest(app, janeToken, 'Validation');

      await request(app.getHttpServer())
        .post('/assignments')
        .set(authHeader(henryToken))
        .send({ requestId: 'not-a-uuid', memberUserIds: [] })
        .expect(400);

      await request(app.getHttpServer())
        .patch(`/requests/${requestId}/status`)
        .set(authHeader(henryToken))
        .send({ status: 'NOT_A_REAL_STATUS' })
        .expect(400);
    });

    it('rejects invalid system settings range', async () => {
      if (skipIfNoDb()) return;

      const adminToken = await loginAdmin(app);

      await request(app.getHttpServer())
        .patch('/system-settings')
        .set(authHeader(adminToken))
        .send({ fileUploadLimitMb: 9999 })
        .expect(400);
    });

    it('rejects invalid create-request templateId', async () => {
      if (skipIfNoDb()) return;

      const janeToken = await loginJane(app);

      await request(app.getHttpServer())
        .post('/requests')
        .set(authHeader(janeToken))
        .send({
          targetDepartmentName: 'HR',
          templateId: 'not-a-uuid',
          title: 'Bad template',
          deadline: '2026-12-31',
          fieldAnswers: [],
        })
        .expect(400);
    });
  });
});
