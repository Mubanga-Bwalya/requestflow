import { PrismaService } from '../../prisma/prisma.service';
import { RequestNumberService } from './request-number.service';

describe('RequestNumberService', () => {
  const queryRaw = jest.fn();
  const prisma = { $queryRaw: queryRaw } as unknown as PrismaService;
  const svc = new RequestNumberService(prisma);

  beforeEach(() => {
    queryRaw.mockReset();
  });

  it('formats RF-YYYY-NNNN from sequence counter', async () => {
    const year = new Date().getFullYear();
    queryRaw.mockResolvedValue([{ last_value: 42 }]);

    const num = await svc.allocate();

    expect(num).toBe(`RF-${year}-0042`);
    expect(queryRaw).toHaveBeenCalled();
  });
});
