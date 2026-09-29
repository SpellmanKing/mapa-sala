import { Request, Response } from 'express';
import { InstrutorService } from '../services/instrutorService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Router } from 'express';
import { authorize } from '../middlewares/authMiddleware.js';
import { PERMISSIONS } from '../auth/permissions.js';
import { createInstrutorSchema, updateInstrutorSchema } from '../schemas/instrutorSchema.js';
import { idParamSchema } from '../schemas/commonSchema.js';

const instrutorService = new InstrutorService();
export const instrutorRouter = Router();

instrutorRouter.get('/', authorize(PERMISSIONS.view), asyncHandler(async (req: Request, res: Response) => {
  const instrutores = await instrutorService.getAll();
  res.json(instrutores);
}));

instrutorRouter.get('/:id', authorize(PERMISSIONS.view), asyncHandler(async (req: Request, res: Response) => {
  const instrutor = await instrutorService.getById(idParamSchema.parse(req.params.id));
  res.json(instrutor);
}));

instrutorRouter.post('/', authorize(PERMISSIONS.manage), asyncHandler(async (req: Request, res: Response) => {
  const instrutor = await instrutorService.create(createInstrutorSchema.parse(req.body));
  res.status(201).json(instrutor);
}));

instrutorRouter.put('/:id', authorize(PERMISSIONS.manage), asyncHandler(async (req: Request, res: Response) => {
  const instrutor = await instrutorService.update(
    idParamSchema.parse(req.params.id),
    updateInstrutorSchema.parse(req.body)
  );
  res.json(instrutor);
}));

instrutorRouter.delete('/:id', authorize(PERMISSIONS.manage), asyncHandler(async (req: Request, res: Response) => {
  await instrutorService.delete(idParamSchema.parse(req.params.id));
  res.status(204).send();
}));
