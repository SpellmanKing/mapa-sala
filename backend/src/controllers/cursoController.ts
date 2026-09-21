import { Request, Response } from 'express';
import { CursoService } from '../services/cursoService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Router } from 'express';
import { createCursoSchema, updateCursoSchema } from '../schemas/cursoSchema.js';

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
  const data = createCursoSchema.parse(req.body);
  const curso = await cursoService.create(data as any);
  res.status(201).json(curso);
}));

cursoRouter.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const data = updateCursoSchema.parse(req.body);
  const curso = await cursoService.update(Number(req.params.id), data as any);
  res.json(curso);
}));

cursoRouter.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  await cursoService.delete(Number(req.params.id));
  res.status(204).send();
}));
