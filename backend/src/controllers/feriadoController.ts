import { Request, Response } from 'express';
import { FeriadoService } from '../services/feriadoService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Router } from 'express';
import { authorize } from '../middlewares/authMiddleware.js';
import { PERMISSIONS } from '../auth/permissions.js';
import { createFeriadoSchema, updateFeriadoSchema } from '../schemas/feriadoSchema.js';
import { idParamSchema } from '../schemas/commonSchema.js';

const feriadoService = new FeriadoService();
export const feriadoRouter = Router();

feriadoRouter.get('/', authorize(PERMISSIONS.view), asyncHandler(async (req: Request, res: Response) => {
  const feriados = await feriadoService.getAll();
  res.json(feriados);
}));

feriadoRouter.get('/tipos', authorize(PERMISSIONS.view), asyncHandler(async (_req: Request, res: Response) => {
  res.json(await feriadoService.getTypes());
}));

feriadoRouter.get('/:id', authorize(PERMISSIONS.view), asyncHandler(async (req: Request, res: Response) => {
  const feriado = await feriadoService.getById(idParamSchema.parse(req.params.id));
  res.json(feriado);
}));

feriadoRouter.post('/', authorize(PERMISSIONS.manage), asyncHandler(async (req: Request, res: Response) => {
  const feriado = await feriadoService.create(createFeriadoSchema.parse(req.body));
  res.status(201).json(feriado);
}));

feriadoRouter.put('/:id', authorize(PERMISSIONS.manage), asyncHandler(async (req: Request, res: Response) => {
  const feriado = await feriadoService.update(
    idParamSchema.parse(req.params.id),
    updateFeriadoSchema.parse(req.body)
  );
  res.json(feriado);
}));

feriadoRouter.delete('/:id', authorize(PERMISSIONS.manage), asyncHandler(async (req: Request, res: Response) => {
  await feriadoService.delete(idParamSchema.parse(req.params.id));
  res.status(204).send();
}));
