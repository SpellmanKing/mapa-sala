import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';

// Um único client por processo (recomendado em dev)
export const prisma = new PrismaClient(
  env.databaseUrl ? { datasourceUrl: env.databaseUrl } : undefined
);
