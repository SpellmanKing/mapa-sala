import { Request, Response } from 'express';
import { TurmaService } from '../services/turmaService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Router } from 'express';
import { alocarTurmaSchema, disponibilidadeTurmaSchema, reallocarTurmaSchema } from '../schemas/turmaSchema.js';
import { authorize } from '../middlewares/authMiddleware.js';
import { PERMISSIONS } from '../auth/permissions.js';
import { idParamSchema } from '../schemas/commonSchema.js';

const turmaService = new TurmaService();
export const turmaRouter = Router();

turmaRouter.get('/', authorize(PERMISSIONS.view), asyncHandler(async (req: Request, res: Response) => {
  const turmas = await turmaService.getAll();
  res.json(turmas);
}));

turmaRouter.get('/agendamentos', authorize(PERMISSIONS.view), asyncHandler(async (req: Request, res: Response) => {
  const agendamentos = await turmaService.getAgendamentos();
  res.json(agendamentos);
}));

turmaRouter.post('/disponibilidade', authorize(PERMISSIONS.view), asyncHandler(async (req: Request, res: Response) => {
  const data = disponibilidadeTurmaSchema.parse(req.body);
  const disponibilidade = await turmaService.getDisponibilidade(data);
  res.json(disponibilidade);
}));

turmaRouter.post('/alocar', authorize(PERMISSIONS.allocate), asyncHandler(async (req: Request, res: Response) => {
  const data = alocarTurmaSchema.parse(req.body);
  const turma = await turmaService.alocarTurma(data);
  res.status(201).json(turma);
}));

turmaRouter.put('/:id/reallocar', authorize(PERMISSIONS.allocate), asyncHandler(async (req: Request, res: Response) => {
  const data = reallocarTurmaSchema.parse(req.body);
  const turma = await turmaService.reallocarTurma(idParamSchema.parse(req.params.id), data);
  res.json(turma);
}));

turmaRouter.delete('/:id', authorize(PERMISSIONS.allocate), asyncHandler(async (req: Request, res: Response) => {
  const result = await turmaService.deletarTurma(idParamSchema.parse(req.params.id));
  res.json(result);
}));
