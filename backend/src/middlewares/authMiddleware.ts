import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/errors.js';

const JWT_SECRET = process.env.JWT_SECRET ?? 'change-me';
const REQUIRE_AUTH = process.env.REQUIRE_AUTH === 'true';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  // Se REQUIRE_AUTH não estiver ativo (modo desenvolvimento/público), prossegue
  if (!REQUIRE_AUTH) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Token de autenticação ausente ou malformado');
  }

  const parts = authHeader.split(' ');
  const token = parts[1];
  if (!token) {
    throw new UnauthorizedError('Token de autenticação ausente ou malformado');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as { sub: string; role: string };
    req.user = { id: decoded.sub, role: decoded.role };
    next();
  } catch (error) {
    throw new UnauthorizedError('Token de autenticação expirado ou inválido');
  }
}
