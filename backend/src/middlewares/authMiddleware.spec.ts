import type { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { env } from '../config/env.js';
import {
  authenticate,
  authorize,
  authMiddleware,
  type AuthRequest
} from './authMiddleware.js';

const secret = 'test-secret-with-at-least-32-characters';
const response = {} as Response;

function request(authorization?: string): AuthRequest {
  return { headers: authorization ? { authorization } : {} } as AuthRequest;
}

function token(expiresIn: number | string = 60, role = 'ADMIN') {
  return jwt.sign({ role }, secret, {
    subject: '1',
    issuer: 'sgst-api',
    audience: 'sgst-web',
    expiresIn
  });
}

describe('middlewares de autenticação e autorização', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = secret;
    env.requireAuth = true;
  });

  it('aceita token válido e disponibiliza o usuário', () => {
    const req = request(`Bearer ${token()}`);
    const next = vi.fn() as NextFunction;

    authenticate(req, response, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toEqual({ id: '1', role: 'ADMIN' });
  });

  it('retorna 401 quando o token está ausente', () => {
    expect(() => authenticate(request(), response, vi.fn()))
      .toThrow(expect.objectContaining({ statusCode: 401 }));
  });

  it('retorna 401 quando o token está expirado', () => {
    expect(() => authenticate(request(`Bearer ${token(-1)}`), response, vi.fn()))
      .toThrow(expect.objectContaining({ statusCode: 401 }));
  });

  it('respeita REQUIRE_AUTH=false', () => {
    env.requireAuth = false;
    const next = vi.fn();

    authMiddleware(request(), response, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('permite a role ADMIN em rota protegida', () => {
    const next = vi.fn();
    const req = request();
    req.user = { id: '1', role: 'ADMIN' };

    authorize('MANAGE')(req, response, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('retorna 403 para role sem a permissão exigida', () => {
    const req = request();
    req.user = { id: '2', role: 'UNKNOWN' };

    expect(() => authorize('MANAGE')(req, response, vi.fn()))
      .toThrow(expect.objectContaining({ statusCode: 403 }));
  });

  it('retorna 401 quando a autorização não recebeu sessão', () => {
    expect(() => authorize('VIEW')(request(), response, vi.fn()))
      .toThrow(expect.objectContaining({ statusCode: 401 }));
  });
});
