import type { User } from '@prisma/client';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcrypt';
import { prisma } from '../infrastructure/prismaClient.js';
import { AuthService } from './authService.js';

vi.mock('../infrastructure/prismaClient.js', () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn()
    }
  }
}));

vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn()
  }
}));

const user: User = {
  id: 1,
  email: 'admin@example.com',
  password: 'bcrypt-hash',
  role: 'ADMIN',
  createdAt: new Date(),
  updatedAt: new Date()
};

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret-with-at-least-32-characters';
  });

  it('autentica credenciais válidas sem retornar o hash', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(user);
    vi.mocked(bcrypt.compare).mockResolvedValue(true);

    const result = await AuthService.login('ADMIN@example.com', 'valid-password');
    const payload = jwt.verify(result.token, process.env.JWT_SECRET!, {
      issuer: 'sgst-api',
      audience: 'sgst-web'
    }) as JwtPayload;

    expect(result.user).toEqual({ id: 1, email: user.email, role: 'ADMIN' });
    expect(result.user).not.toHaveProperty('password');
    expect(result.permissions).toContain('ADMIN');
    expect(payload.sub).toBe('1');
    expect(payload.role).toBe('ADMIN');
  });

  it('rejeita e-mail inexistente com mensagem genérica', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

    await expect(AuthService.login('missing@example.com', 'password'))
      .rejects.toMatchObject({ statusCode: 401, message: 'Credenciais inválidas' });
  });

  it('rejeita senha inválida com a mesma mensagem genérica', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(user);
    vi.mocked(bcrypt.compare).mockResolvedValue(false);

    await expect(AuthService.login(user.email, 'wrong-password'))
      .rejects.toMatchObject({ statusCode: 401, message: 'Credenciais inválidas' });
  });
});
