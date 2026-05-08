import express from 'express';

export const router = express.Router();

router.get('/', async (req, res) => {
  // Placeholder nesta fase.
  res.status(501).json({ error: 'Transposição em andamento: calculadora_inteligente' });
});

router.post('/', (req, res) => {
  res.status(405).json({ error: 'Método não permitido. Utilize GET.' });
});

