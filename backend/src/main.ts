import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './infrastructure/prismaClient.js';

async function start() {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    // eslint-disable-next-line no-console
    console.error('Não foi possível conectar ao PostgreSQL. Verifique DATABASE_URL e se o banco local está disponível.');
    await prisma.$disconnect();
    process.exitCode = 1;
    return;
  }

  const app = createApp();
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`SGST backend running on http://localhost:${env.port}`);
  });
}

void start();
