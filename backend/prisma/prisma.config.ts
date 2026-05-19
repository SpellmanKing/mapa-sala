import type { PrismaClientOptions } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

// Prisma v7: datasource url must be configured here for `migrate`/direct DB connections.
// We use DATABASE_URL for local dev/CI.

const databaseUrl = process.env.DATABASE_URL;

function createPrismaClient(options: PrismaClientOptions = {}) {
  if (!databaseUrl) {
    // eslint-disable-next-line no-console
    console.warn('[prisma] DATABASE_URL is missing; Prisma will fail until env is set.');
  }

  return new PrismaClient({
    datasourceUrl: databaseUrl,
    ...options
  });
}

export const prisma = createPrismaClient();

