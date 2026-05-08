import express from 'express';
import { calcularCronograma } from '../services/cronograma.js';
import { getFeriadosRecessos } from '../services/feriados_service.js';

export const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const body = req.body || {};

    const {
      cargaHorariaTotal,
      dataInicio,
      turno,
      diasSemana,
      feriadosRecessosParam = [],
      porcentagemRemoto = 0
    } = body;

    const feriados = feriadosRecessosParam.length
      ? feriadosRecessosParam
      : await getFeriadosRecessos(dataInicio, body.dataInicioPlusYear || undefined);

    const cronograma = calcularCronograma({
      cargaHorariaTotal,
      dataInicio,
      turno,
      diasSemanaSelecionados: diasSemana,
      feriadosRecessosParam: feriados,
      porcentagemRemoto
    });

    res.status(200).json(cronograma);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Compat: controller PHP pode ser usado via POST em contrato atual.
router.get('/', (req, res) => {
  res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
});

