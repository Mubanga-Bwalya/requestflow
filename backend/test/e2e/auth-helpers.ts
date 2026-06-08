import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { EMAILS, PASSWORD } from './seed-constants';

export async function loginAs(
  app: INestApplication<App>,
  email: string,
  options?: { adminOnly?: boolean },
): Promise<string> {
  const req = request(app.getHttpServer()).post('/auth/login').send({
    email,
    password: PASSWORD,
  });
  if (options?.adminOnly) {
    req.query({ adminOnly: 'true' });
  }
  const res = await req;
  if (res.status !== 201) {
    throw new Error(`Login failed for ${email}: HTTP ${res.status}`);
  }
  return res.body.accessToken as string;
}

export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

export async function loginJane(app: INestApplication<App>) {
  return loginAs(app, EMAILS.jane);
}

export async function loginHenry(app: INestApplication<App>) {
  return loginAs(app, EMAILS.henry);
}

export async function loginMary(app: INestApplication<App>) {
  return loginAs(app, EMAILS.mary);
}

export async function loginHelen(app: INestApplication<App>) {
  return loginAs(app, EMAILS.helen);
}

export async function loginMark(app: INestApplication<App>) {
  return loginAs(app, EMAILS.mark);
}

export async function loginAdmin(app: INestApplication<App>) {
  return loginAs(app, EMAILS.admin, { adminOnly: true });
}
