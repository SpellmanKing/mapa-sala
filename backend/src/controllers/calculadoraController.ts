import { Request, Response } from 'express';
import { CalculadoraService } from '../services/calculadoraService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Router } from 'express';

const calculadoraService = new CalculadoraService();
export const calculadoraRouter = Router();

calculadoraRouter.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { cargaHoraria, dataInicio, diasSemana } = req.body;
  if (!cargaHoraria || !dataInicio || !diasSemana || !Array.isArray(diasSemana)) {
    return res.status(400).json({ error: 'Parâmetros inválidos. Necessário cargaHoraria, dataInicio, e diasSemana.' });
  }

  const resultado = await calculadoraService.calcularCronograma(
    Number(cargaHoraria),
    new Date(dataInicio),
    diasSemana
  );

  res.json(resultado);
}));
