import { PrismaClient } from '@prisma/client';

// Um único client por processo (recomendado em dev)
export const prisma = new PrismaClient();

