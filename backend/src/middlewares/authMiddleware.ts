import { Request, Response, NextFunction } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';
import { env, getJwtSecret } from '../config/env.js';
import { hasPermission, type Permission } from '../auth/permissions.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const [scheme, token, extra] = authHeader?.trim().split(/\s+/) ?? [];
  if (scheme !== 'Bearer' || !token || extra) {
    throw new UnauthorizedError('Token de autenticação ausente ou malformado');
  }

  const secret = getJwtSecret();

  try {
    const decoded = jwt.verify(token, secret, {
      issuer: 'sgst-api',
      audience: 'sgst-web'
    }) as JwtPayload;
    if (typeof decoded.sub !== 'string' || typeof decoded.role !== 'string') {
      throw new Error('Invalid authentication payload');
    }
    req.user = { id: decoded.sub, role: decoded.role };
    next();
  } catch {
    throw new UnauthorizedError('Token de autenticação expirado ou inválido');
  }
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (!env.requireAuth) return next();
  return authenticate(req, res, next);
}

export function authorize(permission: Permission) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!env.requireAuth) return next();
    if (!req.user) throw new UnauthorizedError('Sessão de autenticação ausente');
    if (!hasPermission(req.user.role, permission)) throw new ForbiddenError();
    next();
  };
}
