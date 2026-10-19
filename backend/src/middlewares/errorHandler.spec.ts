import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '../utils/errors.js';
import { errorHandler } from './errorHandler.js';

describe('errorHandler', () => {
  const request = { originalUrl: '/teste' } as Request;
  const next = vi.fn() as NextFunction;

  function response() {
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as unknown as Response;
    return res;
  }

  afterEach(() => vi.restoreAllMocks());

  it('sanitiza erro inesperado do Prisma e registra o detalhe no servidor', () => {
    const res = response();
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const error = new Prisma.PrismaClientInitializationError('detalhe interno da conexão', 'test');

    errorHandler(error, request, res, next);

    expect(log).toHaveBeenCalledWith(error);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Erro interno do servidor',
      details: undefined,
      path: '/teste'
    });
  });

  it('preserva a mensagem de erro de domínio conhecido', () => {
    const res = response();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    errorHandler(new HttpError(409, 'Conflito conhecido'), request, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Conflito conhecido' }));
  });
});