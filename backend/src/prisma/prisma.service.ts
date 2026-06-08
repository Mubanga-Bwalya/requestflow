import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    try {
      await this.$connect();
    } catch (err) {
      if (process.env.NODE_ENV === 'test') {
        console.warn(
          'Prisma: database unavailable for tests (e2e will skip DB cases).',
        );
        return;
      }
      throw err;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
