import express from 'express';

export const router = express.Router();

router.post('/', async (req, res) => {
  res.status(501).json({ error: 'Transposição em andamento: gerenciar_turma' });
});

