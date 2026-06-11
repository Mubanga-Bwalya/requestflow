import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DiagnosticsController } from './diagnostics.controller';
import { FrontendDiagnosticsService } from '../../common/diagnostics/frontend-diagnostics.service';

describe('DiagnosticsController', () => {
  const diagnostics = { record: jest.fn().mockResolvedValue({ ok: true }) };
  const jwt = { verify: jest.fn() };

  function controllerWithSecret(secret: string) {
    process.env.DIAGNOSTICS_INGEST_SECRET = secret;
    return new DiagnosticsController(
      diagnostics as unknown as FrontendDiagnosticsService,
      jwt as unknown as JwtService,
    );
  }

  afterEach(() => {
    delete process.env.DIAGNOSTICS_INGEST_SECRET;
    jest.clearAllMocks();
  });

  const dto = {
    portal: 'user' as const,
    code: 'TEST',
    message: 'boom',
    pagePath: '/x',
  };

  it('accepts valid Bearer token', async () => {
    const controller = controllerWithSecret('');
    jwt.verify.mockReturnValue({ sub: 'user-1' });
    const req = {
      headers: { authorization: 'Bearer token' },
    } as never;

    await controller.recordClientEvent(dto, req);

    expect(diagnostics.record).toHaveBeenCalledWith(dto, 'user-1');
  });

  it('accepts ingest secret when configured', async () => {
    const controller = controllerWithSecret('test-secret');
    const req = {
      headers: { 'x-diagnostics-ingest-secret': 'test-secret' },
    } as never;

    await controller.recordClientEvent(dto, req);

    expect(diagnostics.record).toHaveBeenCalledWith(dto, undefined);
  });

  it('rejects unauthenticated requests when no ingest secret', () => {
    const controller = controllerWithSecret('');
    const req = { headers: {} } as never;

    expect(() => controller.recordClientEvent(dto, req)).toThrow(
      ForbiddenException,
    );
  });

  it('rejects wrong ingest secret', () => {
    const controller = controllerWithSecret('expected');
    const req = {
      headers: { 'x-diagnostics-ingest-secret': 'wrong' },
    } as never;

    expect(() => controller.recordClientEvent(dto, req)).toThrow(
      UnauthorizedException,
    );
  });
});
