import express from 'express';

export const router = express.Router();

router.get('/', async (req, res) => {
  res.status(501).json({ error: 'Transposição em andamento: gerenciar_cursos' });
});

