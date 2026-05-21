import { Request, Response } from 'express';
import { CursoService } from '../services/cursoService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Router } from 'express';

const cursoService = new CursoService();
export const cursoRouter = Router();

cursoRouter.get('/', asyncHandler(async (req: Request, res: Response) => {
  const cursos = await cursoService.getAll();
  res.json(cursos);
}));

cursoRouter.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const curso = await cursoService.getById(Number(req.params.id));
  res.json(curso);
}));

cursoRouter.post('/', asyncHandler(async (req: Request, res: Response) => {
  const curso = await cursoService.create(req.body);
  res.status(201).json(curso);
}));

cursoRouter.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const curso = await cursoService.update(Number(req.params.id), req.body);
  res.json(curso);
}));

cursoRouter.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  await cursoService.delete(Number(req.params.id));
  res.status(204).send();
}));
