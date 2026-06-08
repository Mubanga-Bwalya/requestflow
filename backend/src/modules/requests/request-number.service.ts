import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RequestNumberService {
  constructor(private readonly prisma: PrismaService) {}

  /** Allocates the next RF-YYYY-NNNN for the current calendar year (transaction-safe). */
  async allocate(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `RF-${year}-`;

    const rows = await this.prisma.$queryRaw<{ last_value: number }[]>(
      Prisma.sql`
        INSERT INTO request_number_sequences (year, last_value)
        VALUES (${year}, 1)
        ON CONFLICT (year) DO UPDATE
        SET last_value = request_number_sequences.last_value + 1
        RETURNING last_value
      `,
    );

    const seq = Number(rows[0]?.last_value ?? 1);
    return `${prefix}${String(seq).padStart(4, '0')}`;
  }
}
