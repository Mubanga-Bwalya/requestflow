import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service';
import { recomputeAssignmentProgress } from '../src/modules/assignments/assignment.mapper';
import {
  authHeader,
  loginHelen,
  loginHenry,
  loginJane,
} from './e2e/auth-helpers';
import { closeE2eApp, createE2eApp, isDatabaseReady } from './e2e/create-app';
import { createSubmittedHrRequest } from './e2e/hr-request.helpers';
import { resolveSeedUsers, type ResolvedSeedUsers } from './e2e/resolve-users';

describe('Concurrency safety (e2e)', () => {
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

  async function acceptRequest(requestId: string, henryToken: string) {
    await request(app.getHttpServer())
      .patch(`/requests/${requestId}/status`)
      .set(authHeader(henryToken))
      .send({ status: 'ACCEPTED' })
      .expect(200);
  }

  it('POST /assignments — concurrent assign returns one 201 and one 409', async () => {
    if (skipIfNoDb()) return;

    const janeToken = await loginJane(app);
    const henryToken = await loginHenry(app);
    const requestId = await createSubmittedHrRequest(app, janeToken, 'Concurrent assign');
    await acceptRequest(requestId, henryToken);

    const payload = {
      requestId,
      memberUserIds: [users.helenHr],
    };

    const [first, second] = await Promise.all([
      request(app.getHttpServer())
        .post('/assignments')
        .set(authHeader(henryToken))
        .send(payload),
      request(app.getHttpServer())
        .post('/assignments')
        .set(authHeader(henryToken))
        .send(payload),
    ]);

    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([201, 409]);

    const assignments = await prisma.assignment.count({ where: { requestId } });
    expect(assignments).toBe(1);
  });

  it('PATCH /requests/:id/status — concurrent update returns one 200 and one 409', async () => {
    if (skipIfNoDb()) return;

    const janeToken = await loginJane(app);
    const henryToken = await loginHenry(app);
    const requestId = await createSubmittedHrRequest(app, janeToken, 'Concurrent status');

    const [first, second] = await Promise.all([
      request(app.getHttpServer())
        .patch(`/requests/${requestId}/status`)
        .set(authHeader(henryToken))
        .send({ status: 'ACCEPTED' }),
      request(app.getHttpServer())
        .patch(`/requests/${requestId}/status`)
        .set(authHeader(henryToken))
        .send({ status: 'ACCEPTED' }),
    ]);

    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([200, 409]);
  });

  it('PATCH /assignments/:id/status — concurrent update returns one 200 and one 409', async () => {
    if (skipIfNoDb()) return;

    const janeToken = await loginJane(app);
    const henryToken = await loginHenry(app);
    const helenToken = await loginHelen(app);
    const requestId = await createSubmittedHrRequest(app, janeToken, 'Concurrent assignment status');
    await acceptRequest(requestId, henryToken);

    const created = await request(app.getHttpServer())
      .post('/assignments')
      .set(authHeader(henryToken))
      .send({ requestId, memberUserIds: [users.helenHr] })
      .expect(201);

    const assignmentId = created.body.id as string;

    const [first, second] = await Promise.all([
      request(app.getHttpServer())
        .patch(`/assignments/${assignmentId}/status`)
        .set(authHeader(helenToken))
        .send({ status: 'IN_PROGRESS' }),
      request(app.getHttpServer())
        .patch(`/assignments/${assignmentId}/status`)
        .set(authHeader(helenToken))
        .send({ status: 'IN_PROGRESS' }),
    ]);

    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([200, 409]);
  });

  it('POST request-missing-information — concurrent duplicate returns one 201 and one 409', async () => {
    if (skipIfNoDb()) return;

    const janeToken = await loginJane(app);
    const henryToken = await loginHenry(app);
    const requestId = await createSubmittedHrRequest(app, janeToken, 'Concurrent missing info');
    await acceptRequest(requestId, henryToken);

    const payload = { items: [{ reasonLabel: 'Need more detail' }] };

    const [first, second] = await Promise.all([
      request(app.getHttpServer())
        .post(`/requests/${requestId}/request-missing-information`)
        .set(authHeader(henryToken))
        .send(payload),
      request(app.getHttpServer())
        .post(`/requests/${requestId}/request-missing-information`)
        .set(authHeader(henryToken))
        .send(payload),
    ]);

    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([201, 409]);

    const openCount = await prisma.missingInformationRequest.count({
      where: { requestId, status: 'OPEN' },
    });
    expect(openCount).toBe(1);
  });

  it('PATCH milestone — concurrent updates keep progress consistent with DB', async () => {
    if (skipIfNoDb()) return;

    const janeToken = await loginJane(app);
    const henryToken = await loginHenry(app);
    const helenToken = await loginHelen(app);
    const requestId = await createSubmittedHrRequest(app, janeToken, 'Concurrent milestone');
    await acceptRequest(requestId, henryToken);

    const created = await request(app.getHttpServer())
      .post('/assignments')
      .set(authHeader(henryToken))
      .send({ requestId, memberUserIds: [users.helenHr] })
      .expect(201);

    const assignmentId = created.body.id as string;
    const milestone = await request(app.getHttpServer())
      .post(`/assignments/${assignmentId}/milestones`)
      .set(authHeader(helenToken))
      .send({
        title: 'Policy draft',
        ownerUserId: users.helenHr,
      })
      .expect(201);

    const milestoneId = milestone.body.milestones?.[0]?.id as string;
    expect(milestoneId).toBeDefined();

    await Promise.all([
      request(app.getHttpServer())
        .patch(`/assignments/${assignmentId}/milestones/${milestoneId}`)
        .set(authHeader(helenToken))
        .send({ progress: 40 }),
      request(app.getHttpServer())
        .patch(`/assignments/${assignmentId}/milestones/${milestoneId}`)
        .set(authHeader(helenToken))
        .send({ progress: 80 }),
    ]);

    const [assignmentRow, milestones] = await Promise.all([
      prisma.assignment.findUnique({ where: { id: assignmentId } }),
      prisma.milestone.findMany({ where: { assignmentId } }),
    ]);

    expect(assignmentRow).not.toBeNull();
    const expected = recomputeAssignmentProgress(milestones);
    expect(assignmentRow!.progressPercentage).toBe(expected);
    expect(milestones).toHaveLength(1);
    expect([40, 80]).toContain(milestones[0]!.progressPercentage);
  });
});
