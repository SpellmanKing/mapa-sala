import express from 'express';
import { handleAlocarTurma } from '../services/alocacao_service.js';

export const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const data = req.body;
    const result = await handleAlocarTurma(data);
    res.status(200).json(result);
  } catch (e) {
    const status = e.statusCode || 400;
    res.status(status).json({ error: e.message });
  }
});

router.get('/', (req, res) => {
  res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
});

