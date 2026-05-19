import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { prisma } from '../infrastructure/prismaClient.js';
import { UnauthorizedError } from '../utils/errors.js';

const JWT_SECRET = process.env.JWT_SECRET ?? 'change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1d';

export class AuthService {
  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) throw new UnauthorizedError('Credenciais inválidas');

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedError('Credenciais inválidas');

    const token = jwt.sign({ sub: String(user.id), role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });

    return {
      token,
      user
    };
  }
}

