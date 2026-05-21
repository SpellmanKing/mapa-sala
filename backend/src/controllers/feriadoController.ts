import { Request, Response } from 'express';
import { FeriadoService } from '../services/feriadoService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Router } from 'express';

const feriadoService = new FeriadoService();
export const feriadoRouter = Router();

feriadoRouter.get('/', asyncHandler(async (req: Request, res: Response) => {
  const feriados = await feriadoService.getAll();
  res.json(feriados);
}));

feriadoRouter.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const feriado = await feriadoService.getById(Number(req.params.id));
  res.json(feriado);
}));

feriadoRouter.post('/', asyncHandler(async (req: Request, res: Response) => {
  const feriado = await feriadoService.create(req.body);
  res.status(201).json(feriado);
}));

feriadoRouter.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const feriado = await feriadoService.update(Number(req.params.id), req.body);
  res.json(feriado);
}));

feriadoRouter.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  await feriadoService.delete(Number(req.params.id));
  res.status(204).send();
}));
