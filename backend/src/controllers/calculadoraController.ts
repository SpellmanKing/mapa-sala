import { Request, Response } from 'express';
import { CalculadoraService } from '../services/calculadoraService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Router } from 'express';
import { calculadoraSchema } from '../schemas/calculadoraSchema.js';
import { authorize } from '../middlewares/authMiddleware.js';
import { PERMISSIONS } from '../auth/permissions.js';

const calculadoraService = new CalculadoraService();
export const calculadoraRouter = Router();

calculadoraRouter.post('/', authorize(PERMISSIONS.view), asyncHandler(async (req: Request, res: Response) => {
  const { cargaHoraria, dataInicio, diasSemana, horasPorDia } = calculadoraSchema.parse(req.body);

  const resultado = await calculadoraService.calcularCronograma(
    cargaHoraria,
    dataInicio,
    diasSemana,
    horasPorDia
  );

  res.json(resultado);
}));
