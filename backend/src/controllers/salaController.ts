import { Request, Response } from 'express';
import { SalaService } from '../services/salaService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Router } from 'express';
import { createSalaSchema, updateSalaSchema } from '../schemas/salaSchema.js';
import { authorize } from '../middlewares/authMiddleware.js';
import { PERMISSIONS } from '../auth/permissions.js';
import { idParamSchema } from '../schemas/commonSchema.js';

const salaService = new SalaService();
export const salaRouter = Router();

salaRouter.get('/', authorize(PERMISSIONS.view), asyncHandler(async (req: Request, res: Response) => {
  const salas = await salaService.getAll();
  res.json(salas);
}));

salaRouter.get('/tipos', authorize(PERMISSIONS.view), asyncHandler(async (req: Request, res: Response) => {
  const tipos = await salaService.getTiposSala();
  res.json(tipos);
}));

salaRouter.get('/:id', authorize(PERMISSIONS.view), asyncHandler(async (req: Request, res: Response) => {
  const sala = await salaService.getById(idParamSchema.parse(req.params.id));
  res.json(sala);
}));

salaRouter.post('/', authorize(PERMISSIONS.manage), asyncHandler(async (req: Request, res: Response) => {
  const data = createSalaSchema.parse(req.body);
  const sala = await salaService.create(data);
  res.status(201).json(sala);
}));

salaRouter.put('/:id', authorize(PERMISSIONS.manage), asyncHandler(async (req: Request, res: Response) => {
  const data = updateSalaSchema.parse(req.body);
  const sala = await salaService.update(idParamSchema.parse(req.params.id), data);
  res.json(sala);
}));

salaRouter.delete('/:id', authorize(PERMISSIONS.manage), asyncHandler(async (req: Request, res: Response) => {
  await salaService.delete(idParamSchema.parse(req.params.id));
  res.status(204).send();
}));
