import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';

import { prisma } from '../infrastructure/prismaClient.js';
import { UnauthorizedError } from '../utils/errors.js';
import { env, getJwtSecret } from '../config/env.js';
import { getPermissions } from '../auth/permissions.js';

export class AuthService {
  static async login(email: string, password: string) {
    const user = await prisma.user.findFirst({
      where: { email: { equals: email.trim(), mode: 'insensitive' } }
    });

    if (!user) throw new UnauthorizedError('Credenciais inválidas');

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedError('Credenciais inválidas');

    const token = jwt.sign({ role: user.role }, getJwtSecret(), {
      subject: String(user.id),
      issuer: 'sgst-api',
      audience: 'sgst-web',
      expiresIn: env.jwtExpiresIn as SignOptions['expiresIn']
    });

    return {
      token,
      user: { id: user.id, email: user.email, role: user.role },
      permissions: getPermissions(user.role)
    };
  }

  static async getSession(userId: string) {
    const id = Number(userId);
    if (!Number.isInteger(id) || id <= 0) throw new UnauthorizedError('Sessão inválida');

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true }
    });
    if (!user) throw new UnauthorizedError('Sessão inválida');

    return { user, permissions: getPermissions(user.role) };
  }
}
