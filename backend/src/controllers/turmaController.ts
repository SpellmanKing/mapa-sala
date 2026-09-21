import { Request, Response } from 'express';
import { TurmaService } from '../services/turmaService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Router } from 'express';
import { alocarTurmaSchema, reallocarTurmaSchema } from '../schemas/turmaSchema.js';

const turmaService = new TurmaService();
export const turmaRouter = Router();

turmaRouter.get('/', asyncHandler(async (req: Request, res: Response) => {
  const turmas = await turmaService.getAll();
  res.json(turmas);
}));

turmaRouter.get('/agendamentos', asyncHandler(async (req: Request, res: Response) => {
  const agendamentos = await turmaService.getAgendamentos();
  res.json(agendamentos);
}));

turmaRouter.post('/alocar', asyncHandler(async (req: Request, res: Response) => {
  const data = alocarTurmaSchema.parse(req.body);
  const turma = await turmaService.alocarTurma(data as any);
  res.status(201).json(turma);
}));

turmaRouter.put('/:id/reallocar', asyncHandler(async (req: Request, res: Response) => {
  const data = reallocarTurmaSchema.parse(req.body);
  const turma = await turmaService.reallocarTurma(Number(req.params.id), data as any);
  res.json(turma);
}));

turmaRouter.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const result = await turmaService.deletarTurma(Number(req.params.id));
  res.json(result);
}));
