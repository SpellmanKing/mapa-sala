import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const input = z.object({
  email: z.string().trim().email(),
  password: z.string().min(12).max(128)
}).parse({
  email: process.env.ADMIN_EMAIL,
  password: process.env.ADMIN_PASSWORD
});

const prisma = new PrismaClient();

try {
  const password = await bcrypt.hash(input.password, 12);
  await prisma.user.upsert({
    where: { email: input.email },
    update: { password, role: 'ADMIN' },
    create: { email: input.email, password, role: 'ADMIN' }
  });
  console.log('Usuário administrador criado ou atualizado com sucesso.');
} finally {
  await prisma.$disconnect();
}
