import { Request, Response } from 'express';
import { SalaService } from '../services/salaService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Router } from 'express';

const salaService = new SalaService();
export const salaRouter = Router();

salaRouter.get('/', asyncHandler(async (req: Request, res: Response) => {
  const salas = await salaService.getAll();
  res.json(salas);
}));

salaRouter.get('/tipos', asyncHandler(async (req: Request, res: Response) => {
  const tipos = await salaService.getTiposSala();
  res.json(tipos);
}));

salaRouter.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const sala = await salaService.getById(Number(req.params.id));
  res.json(sala);
}));

salaRouter.post('/', asyncHandler(async (req: Request, res: Response) => {
  const sala = await salaService.create(req.body);
  res.status(201).json(sala);
}));

salaRouter.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const sala = await salaService.update(Number(req.params.id), req.body);
  res.json(sala);
}));

salaRouter.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  await salaService.delete(Number(req.params.id));
  res.status(204).send();
}));
