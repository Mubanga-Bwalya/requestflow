import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { authHeader } from './auth-helpers';
import { hrPolicyRequestPayload } from './request-payload';

export async function createSubmittedHrRequest(
  app: INestApplication<App>,
  requesterToken: string,
  title = 'E2E HR request',
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/requests')
    .set(authHeader(requesterToken))
    .send(hrPolicyRequestPayload({ title }))
    .expect(201);
  return res.body.id as string;
}
