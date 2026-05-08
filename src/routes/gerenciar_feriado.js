import express from 'express';

export const router = express.Router();

router.get('/', async (req, res) => {
  res.status(501).json({ error: 'Transposição em andamento: gerenciar_feriado' });
});
router.post('/', (req, res) => res.status(501).json({ error: 'Transposição em andamento' }));
router.put('/', (req, res) => res.status(501).json({ error: 'Transposição em andamento' }));
router.delete('/', (req, res) => res.status(501).json({ error: 'Transposição em andamento' }));

