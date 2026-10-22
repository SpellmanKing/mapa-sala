import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { HttpError } from '../utils/errors.js';

type ApiErrorPayload = {
  success: false;
  error: string;
  details?: unknown;
  path?: string;
};

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  // eslint-disable-next-line no-console
  console.error(err);

  let status = 500;
  let message = 'Erro interno do servidor';
  let details: unknown = undefined;

  if (err instanceof ZodError) {
    status = 400;
    message = err.errors[0]?.message ?? 'Dados inválidos na requisição';
    details = err.errors.map(e => ({
      campo: e.path.join('.'),
      mensagem: e.message
    }));
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      status = 409;
      const targets = String(err.meta?.target ?? '');
      if (targets.includes('nome_instrutor')) {
        message = 'Já existe um instrutor cadastrado com este nome!';
      } else if (targets.includes('nome_curso')) {
        message = 'Já existe um curso cadastrado com este nome!';
      } else if (targets.includes('nome_sala')) {
        message = 'Já existe um ambiente cadastrado com este nome!';
      } else if (targets.includes('codigo_turma')) {
        message = 'Já existe uma turma cadastrada com este código!';
      } else if (targets.includes('data_feriado')) {
        message = 'Já existe um feriado ou recesso cadastrado nesta data.';
      } else if (
        targets.includes('id_salas') ||
        targets.includes('data_aula') ||
        targets.includes('fk_id_turno') ||
        targets.includes('Agendamento')
      ) {
        message = 'Conflito de agendamento: o ambiente já está ocupado nesta data e turno.';
      } else {
        message = 'Conflito de registro duplicado no banco de dados.';
      }
    } else if (err.code === 'P2003') {
      status = 409;
      message = 'Não é possível salvar ou deletar este registro devido a vínculos existentes com outros dados.';
    } else if (err.code === 'P2025') {
      status = 404;
      message = 'Registro não encontrado no banco de dados.';
    }
  } else if (err instanceof HttpError) {
    status = err.statusCode;
    message = err.message;
    details = err.details;
  }

  const payload: ApiErrorPayload = {
    success: false,
    error: message,
    details,
    path: req.originalUrl
  };

  res.status(status).json(payload);
}
