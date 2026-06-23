import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  authHeader,
  loginAdmin,
  loginHelen,
  loginHenry,
  loginMusa,
  loginMark,
  loginMary,
} from './e2e/auth-helpers';
import { closeE2eApp, createE2eApp, isDatabaseReady } from './e2e/create-app';
import { hrPolicyRequestPayload } from './e2e/request-payload';
import { RequestNumberService } from '../src/modules/requests/request-number.service';
import { EMAILS, SEED } from './e2e/seed-constants';
import { resolveSeedUsers, type ResolvedSeedUsers } from './e2e/resolve-users';

describe('Security regression (e2e)', () => {
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
      await prisma.$executeRawUnsafe(
        `CREATE TABLE IF NOT EXISTS request_number_sequences (
          year INT PRIMARY KEY,
          last_value INT NOT NULL DEFAULT 0
        )`,
      );
      try {
        await loginMusa(app);
        users = await resolveSeedUsers(prisma);
      } catch {
        dbReady = false;
        console.warn(
          'Skipping security e2e: dev-login failed. Apply migrations and run npm run db:seed if needed.',
        );
      }
    }
  });

  afterAll(async () => {
    await closeE2eApp(app);
  });

  function skipIfNoDb(): boolean {
    if (!dbReady) {
      console.warn('Skipping e2e: database not seeded. See backend/database/README.md');
      return true;
    }
    return false;
  }

  it('GET /requests/:id — cross-user isolation (404)', async () => {
    if (skipIfNoDb()) return;

    const musaToken = await loginMusa(app);
    const helenToken = await loginHelen(app);

    const created = await request(app.getHttpServer())
      .post('/requests')
      .set(authHeader(musaToken))
      .send(hrPolicyRequestPayload({ title: 'IDOR isolation test' }))
      .expect(201);

    const requestId = created.body.id as string;

    await request(app.getHttpServer())
      .get(`/requests/${requestId}`)
      .set(authHeader(helenToken))
      .expect(404);
  });

  it('PATCH /requests/:id/status — non-manager cannot ACCEPT (403)', async () => {
    if (skipIfNoDb()) return;

    const musaToken = await loginMusa(app);

    const created = await request(app.getHttpServer())
      .post('/requests')
      .set(authHeader(musaToken))
      .send(hrPolicyRequestPayload({ title: 'Status authz test' }))
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/requests/${created.body.id}/status`)
      .set(authHeader(musaToken))
      .send({ status: 'ACCEPTED' })
      .expect(403);
  });

  it('PATCH /requests/:id/status — target manager can ACCEPT', async () => {
    if (skipIfNoDb()) return;

    const musaToken = await loginMusa(app);
    const henryToken = await loginHenry(app);

    const created = await request(app.getHttpServer())
      .post('/requests')
      .set(authHeader(musaToken))
      .send(hrPolicyRequestPayload({ title: 'Manager accept test' }))
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/requests/${created.body.id}/status`)
      .set(authHeader(henryToken))
      .send({ status: 'ACCEPTED' })
      .expect(200);
  });

  it('POST /requests/:id/request-missing-information — non-manager forbidden (403)', async () => {
    if (skipIfNoDb()) return;

    const musaToken = await loginMusa(app);
    const helenToken = await loginHelen(app);

    const created = await request(app.getHttpServer())
      .post('/requests')
      .set(authHeader(musaToken))
      .send(hrPolicyRequestPayload({ title: 'Missing info authz' }))
      .expect(201);

    await request(app.getHttpServer())
      .post(`/requests/${created.body.id}/request-missing-information`)
      .set(authHeader(helenToken))
      .send({ items: [{ reasonLabel: 'Need more detail' }] })
      .expect(403);
  });

  it('GET /assignments/:id — non-member isolation (404)', async () => {
    if (skipIfNoDb()) return;

    const musaToken = await loginMusa(app);
    const henryToken = await loginHenry(app);
    const markToken = await loginMark(app);

    const created = await request(app.getHttpServer())
      .post('/requests')
      .set(authHeader(musaToken))
      .send(hrPolicyRequestPayload({ title: 'Assignment IDOR test' }))
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/requests/${created.body.id}/status`)
      .set(authHeader(henryToken))
      .send({ status: 'ACCEPTED' })
      .expect(200);

    const assignment = await request(app.getHttpServer())
      .post('/assignments')
      .set(authHeader(henryToken))
      .send({
        requestId: created.body.id,
        memberUserIds: [users.helenHr],
      })
      .expect(201);

    const assignmentId = assignment.body.id as string;

    await request(app.getHttpServer())
      .get(`/assignments/${assignmentId}`)
      .set(authHeader(markToken))
      .expect(404);
  });

  it('PATCH /assignments/:id/milestones/:milestoneId — non-member forbidden (403)', async () => {
    if (skipIfNoDb()) return;

    const musaToken = await loginMusa(app);
    const henryToken = await loginHenry(app);
    const helenToken = await loginHelen(app);
    const markToken = await loginMark(app);

    const created = await request(app.getHttpServer())
      .post('/requests')
      .set(authHeader(musaToken))
      .send(hrPolicyRequestPayload({ title: 'Milestone authz test' }))
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/requests/${created.body.id}/status`)
      .set(authHeader(henryToken))
      .send({ status: 'ACCEPTED' })
      .expect(200);

    const assignment = await request(app.getHttpServer())
      .post('/assignments')
      .set(authHeader(henryToken))
      .send({
        requestId: created.body.id,
        memberUserIds: [users.helenHr],
      })
      .expect(201);

    const milestone = await request(app.getHttpServer())
      .post(`/assignments/${assignment.body.id}/milestones`)
      .set(authHeader(helenToken))
      .send({
        title: 'Draft policy review',
        ownerUserId: users.helenHr,
      })
      .expect(201);

    const milestoneId = milestone.body.milestones?.[0]?.id as string | undefined;
    expect(milestoneId).toBeDefined();

    await request(app.getHttpServer())
      .patch(`/assignments/${assignment.body.id}/milestones/${milestoneId}`)
      .set(authHeader(markToken))
      .send({ progress: 50 })
      .expect(403);
  });

  it('PATCH /assignments/:id/status — non-member forbidden (403)', async () => {
    if (skipIfNoDb()) return;

    const musaToken = await loginMusa(app);
    const henryToken = await loginHenry(app);
    const markToken = await loginMark(app);

    const created = await request(app.getHttpServer())
      .post('/requests')
      .set(authHeader(musaToken))
      .send(hrPolicyRequestPayload({ title: 'Assignment mutate authz' }))
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/requests/${created.body.id}/status`)
      .set(authHeader(henryToken))
      .send({ status: 'ACCEPTED' });

    const assignment = await request(app.getHttpServer())
      .post('/assignments')
      .set(authHeader(henryToken))
      .send({
        requestId: created.body.id,
        memberUserIds: [users.helenHr],
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/assignments/${assignment.body.id}/status`)
      .set(authHeader(markToken))
      .send({ status: 'IN_PROGRESS' })
      .expect(403);
  });

  it('PATCH /requests/:id/status COMPLETED — member forbidden (403)', async () => {
    if (skipIfNoDb()) return;

    const musaToken = await loginMusa(app);
    const henryToken = await loginHenry(app);
    const helenToken = await loginHelen(app);

    const created = await request(app.getHttpServer())
      .post('/requests')
      .set(authHeader(musaToken))
      .send(hrPolicyRequestPayload({ title: 'Member complete request authz' }))
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/requests/${created.body.id}/status`)
      .set(authHeader(henryToken))
      .send({ status: 'ACCEPTED' });

    await request(app.getHttpServer())
      .post('/assignments')
      .set(authHeader(henryToken))
      .send({
        requestId: created.body.id,
        memberUserIds: [users.helenHr],
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/requests/${created.body.id}/status`)
      .set(authHeader(helenToken))
      .send({ status: 'COMPLETED' })
      .expect(403);
  });

  it('PATCH /assignments/:id/status COMPLETED — member forbidden (403)', async () => {
    if (skipIfNoDb()) return;

    const musaToken = await loginMusa(app);
    const henryToken = await loginHenry(app);
    const helenToken = await loginHelen(app);

    const created = await request(app.getHttpServer())
      .post('/requests')
      .set(authHeader(musaToken))
      .send(hrPolicyRequestPayload({ title: 'Member complete assignment authz' }))
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/requests/${created.body.id}/status`)
      .set(authHeader(henryToken))
      .send({ status: 'ACCEPTED' });

    const assignment = await request(app.getHttpServer())
      .post('/assignments')
      .set(authHeader(henryToken))
      .send({
        requestId: created.body.id,
        memberUserIds: [users.helenHr],
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/assignments/${assignment.body.id}/status`)
      .set(authHeader(helenToken))
      .send({ status: 'COMPLETED' })
      .expect(403);
  });

  it('PATCH /assignments/:id/status READY_FOR_REVIEW — member forbidden, manager allowed', async () => {
    if (skipIfNoDb()) return;

    const musaToken = await loginMusa(app);
    const henryToken = await loginHenry(app);
    const helenToken = await loginHelen(app);

    const created = await request(app.getHttpServer())
      .post('/requests')
      .set(authHeader(musaToken))
      .send(hrPolicyRequestPayload({ title: 'Ready for review authz' }))
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/requests/${created.body.id}/status`)
      .set(authHeader(henryToken))
      .send({ status: 'ACCEPTED' });

    const assignment = await request(app.getHttpServer())
      .post('/assignments')
      .set(authHeader(henryToken))
      .send({
        requestId: created.body.id,
        memberUserIds: [users.helenHr],
      })
      .expect(201);

    const assignmentId = assignment.body.id as string;

    await request(app.getHttpServer())
      .patch(`/assignments/${assignmentId}/status`)
      .set(authHeader(helenToken))
      .send({ status: 'READY_FOR_REVIEW' })
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/assignments/${assignmentId}/status`)
      .set(authHeader(henryToken))
      .send({ status: 'READY_FOR_REVIEW' })
      .expect(200);
  });

  it('demoted admin — old token rejected on admin API (403)', async () => {
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
    } finally {
      await prisma.user.update({
        where: { id: users.admin },
        data: { roleId: SEED.role.admin },
      });
    }
  });

  it('POST /assignments — cross-department assignee rejected (400)', async () => {
    if (skipIfNoDb()) return;

    const musaToken = await loginMusa(app);
    const henryToken = await loginHenry(app);

    const created = await request(app.getHttpServer())
      .post('/requests')
      .set(authHeader(musaToken))
      .send(hrPolicyRequestPayload({ title: 'Cross-dept assignee test' }))
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/requests/${created.body.id}/status`)
      .set(authHeader(henryToken))
      .send({ status: 'ACCEPTED' });

    await request(app.getHttpServer())
      .post('/assignments')
      .set(authHeader(henryToken))
      .send({
        requestId: created.body.id,
        memberUserIds: [users.markMkt],
      })
      .expect(400);
  });

  it('DTO validation — invalid assignment payload (400)', async () => {
    if (skipIfNoDb()) return;

    const henryToken = await loginHenry(app);

    await request(app.getHttpServer())
      .post('/assignments')
      .set(authHeader(henryToken))
      .send({
        requestId: 'not-a-uuid',
        memberUserIds: [],
      })
      .expect(400);
  });

  it('DTO validation — invalid system settings (400)', async () => {
    if (skipIfNoDb()) return;

    const adminToken = await loginAdmin(app);

    await request(app.getHttpServer())
      .patch('/system-settings')
      .set(authHeader(adminToken))
      .send({ fileUploadLimitMb: 9999 })
      .expect(400);
  });

  it('DTO validation — invalid department name (400)', async () => {
    if (skipIfNoDb()) return;

    const adminToken = await loginAdmin(app);

    await request(app.getHttpServer())
      .post('/departments')
      .set(authHeader(adminToken))
      .send({ name: '' })
      .expect(400);
  });

  it('JWT role from DB — /auth/me reflects demotion while token is stale', async () => {
    if (skipIfNoDb()) return;

    const adminToken = await loginAdmin(app);

    await prisma.user.update({
      where: { id: users.admin },
      data: { roleId: SEED.role.employee },
    });

    try {
      const me = await request(app.getHttpServer())
        .get('/auth/me')
        .set(authHeader(adminToken))
        .expect(200);

      expect(me.body.roleName).toBe('Employee');

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

  it('request numbers are unique under parallel allocation', async () => {
    if (skipIfNoDb()) return;

    const svc = new RequestNumberService(prisma);

    const numbers = await Promise.all(
      Array.from({ length: 8 }, () => svc.allocate()),
    );
    const unique = new Set(numbers);
    expect(unique.size).toBe(numbers.length);
    for (const n of numbers) {
      expect(n).toMatch(/^RF-\d{4}-\d{4}$/);
    }
  });
});
