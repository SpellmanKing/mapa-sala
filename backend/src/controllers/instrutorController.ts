import { Request, Response } from 'express';
import { InstrutorService } from '../services/instrutorService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Router } from 'express';

const instrutorService = new InstrutorService();
export const instrutorRouter = Router();

instrutorRouter.get('/', asyncHandler(async (req: Request, res: Response) => {
  const instrutores = await instrutorService.getAll();
  res.json(instrutores);
}));

instrutorRouter.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const instrutor = await instrutorService.getById(Number(req.params.id));
  res.json(instrutor);
}));

instrutorRouter.post('/', asyncHandler(async (req: Request, res: Response) => {
  const instrutor = await instrutorService.create(req.body);
  res.status(201).json(instrutor);
}));

instrutorRouter.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const instrutor = await instrutorService.update(Number(req.params.id), req.body);
  res.json(instrutor);
}));

instrutorRouter.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  await instrutorService.delete(Number(req.params.id));
  res.status(204).send();
}));
