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

  it('converte violação de constraint P2002 de agendamento em HTTP 409 em pt-br', () => {
    const res = response();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const error = new Prisma.PrismaClientKnownRequestError('Conflito', {
      code: 'P2002',
      clientVersion: '6.0.0',
      meta: { target: ['id_salas', 'data_aula', 'fk_id_turno'] }
    });

    errorHandler(error, request, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: 'Conflito de agendamento: o ambiente já está ocupado nesta data e turno.'
    }));
  });

  it('converte violação de constraint P2002 de codigo_turma em HTTP 409 em pt-br', () => {
    const res = response();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const error = new Prisma.PrismaClientKnownRequestError('Conflito', {
      code: 'P2002',
      clientVersion: '6.0.0',
      meta: { target: ['codigo_turma'] }
    });

    errorHandler(error, request, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: 'Já existe uma turma cadastrada com este código!'
    }));
  });
});