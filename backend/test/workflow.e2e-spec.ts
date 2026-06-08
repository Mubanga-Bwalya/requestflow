import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  authHeader,
  loginHelen,
  loginHenry,
  loginJane,
} from './e2e/auth-helpers';
import { closeE2eApp, createE2eApp, isDatabaseReady } from './e2e/create-app';
import { createSubmittedHrRequest } from './e2e/hr-request.helpers';
import { PrismaService } from '../src/prisma/prisma.service';
import { resolveSeedUsers, type ResolvedSeedUsers } from './e2e/resolve-users';

describe('Request workflow integrity (e2e)', () => {
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
    if (!dbReady) return true;
    return false;
  }

  it('POST provide-information — requester rejected when not NEEDS_INFORMATION (400)', async () => {
    if (skipIfNoDb()) return;

    const janeToken = await loginJane(app);
    const requestId = await createSubmittedHrRequest(app, janeToken, 'Workflow guard test');

    await request(app.getHttpServer())
      .post(`/requests/${requestId}/provide-information`)
      .set(authHeader(janeToken))
      .send({ fieldAnswers: [{ fieldKey: 'title', answerText: 'Updated title' }] })
      .expect(400);
  });

  it('POST provide-information — non-requester forbidden (403)', async () => {
    if (skipIfNoDb()) return;

    const janeToken = await loginJane(app);
    const henryToken = await loginHenry(app);
    const helenToken = await loginHelen(app);
    const requestId = await createSubmittedHrRequest(app, janeToken, 'Workflow guard test');

    await request(app.getHttpServer())
      .post(`/requests/${requestId}/request-missing-information`)
      .set(authHeader(henryToken))
      .send({ items: [{ reasonLabel: 'Need more detail' }] })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/requests/${requestId}/provide-information`)
      .set(authHeader(helenToken))
      .send({ fieldAnswers: [{ fieldKey: 'title', answerText: 'Not the requester' }] })
      .expect(403);
  });

  it('POST request-missing-information — invalid status COMPLETED (400)', async () => {
    if (skipIfNoDb()) return;

    const janeToken = await loginJane(app);
    const henryToken = await loginHenry(app);
    const requestId = await createSubmittedHrRequest(app, janeToken, 'Workflow guard test');

    await request(app.getHttpServer())
      .patch(`/requests/${requestId}/status`)
      .set(authHeader(henryToken))
      .send({ status: 'ACCEPTED' })
      .expect(200);

    await prisma.request.update({
      where: { id: requestId },
      data: { status: 'COMPLETED' },
    });

    await request(app.getHttpServer())
      .post(`/requests/${requestId}/request-missing-information`)
      .set(authHeader(henryToken))
      .send({ items: [{ reasonLabel: 'Too late' }] })
      .expect(400);
  });

  it('POST request-missing-information — happy path and provide-information (200)', async () => {
    if (skipIfNoDb()) return;

    const janeToken = await loginJane(app);
    const henryToken = await loginHenry(app);
    const requestId = await createSubmittedHrRequest(app, janeToken, 'Workflow guard test');

    await request(app.getHttpServer())
      .post(`/requests/${requestId}/request-missing-information`)
      .set(authHeader(henryToken))
      .send({ items: [{ reasonLabel: 'Need policy scope' }] })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/requests/${requestId}/provide-information`)
      .set(authHeader(janeToken))
      .send({
        fieldAnswers: [{ fieldKey: 'description', answerText: 'Clarified scope for HR' }],
      })
      .expect(201);
  });

  it('PATCH /requests/:id/status — COMPLETED blocked when assignment not complete (400)', async () => {
    if (skipIfNoDb()) return;

    const janeToken = await loginJane(app);
    const henryToken = await loginHenry(app);
    const helenToken = await loginHelen(app);
    const requestId = await createSubmittedHrRequest(app, janeToken, 'Workflow guard test');

    await request(app.getHttpServer())
      .patch(`/requests/${requestId}/status`)
      .set(authHeader(henryToken))
      .send({ status: 'ACCEPTED' })
      .expect(200);

    await request(app.getHttpServer())
      .post('/assignments')
      .set(authHeader(henryToken))
      .send({
        requestId,
        memberUserIds: [users.helenHr],
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/requests/${requestId}/status`)
      .set(authHeader(helenToken))
      .send({ status: 'IN_PROGRESS' })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/requests/${requestId}/status`)
      .set(authHeader(helenToken))
      .send({ status: 'COMPLETED' })
      .expect(400);
  });
});
