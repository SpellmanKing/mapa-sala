import { Request, Response } from 'express';
import { CursoService } from '../services/cursoService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Router } from 'express';
import { createCursoSchema, updateCursoSchema } from '../schemas/cursoSchema.js';
import { authorize } from '../middlewares/authMiddleware.js';
import { PERMISSIONS } from '../auth/permissions.js';
import { idParamSchema } from '../schemas/commonSchema.js';

const cursoService = new CursoService();
export const cursoRouter = Router();

cursoRouter.get('/', authorize(PERMISSIONS.view), asyncHandler(async (req: Request, res: Response) => {
  const cursos = await cursoService.getAll();
  res.json(cursos);
}));

cursoRouter.get('/:id', authorize(PERMISSIONS.view), asyncHandler(async (req: Request, res: Response) => {
  const curso = await cursoService.getById(idParamSchema.parse(req.params.id));
  res.json(curso);
}));

cursoRouter.post('/', authorize(PERMISSIONS.manage), asyncHandler(async (req: Request, res: Response) => {
  const data = createCursoSchema.parse(req.body);
  const curso = await cursoService.create(data);
  res.status(201).json(curso);
}));

cursoRouter.put('/:id', authorize(PERMISSIONS.manage), asyncHandler(async (req: Request, res: Response) => {
  const data = updateCursoSchema.parse(req.body);
  const curso = await cursoService.update(idParamSchema.parse(req.params.id), data);
  res.json(curso);
}));

cursoRouter.delete('/:id', authorize(PERMISSIONS.manage), asyncHandler(async (req: Request, res: Response) => {
  await cursoService.delete(idParamSchema.parse(req.params.id));
  res.status(204).send();
}));
