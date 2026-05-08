import express from 'express';
import { getSalas } from '../services/salas_service.js';

export const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const salas = await getSalas();
    res.status(200).json(salas);
  } catch (e) {
    res.status(500).json({ error: 'Erro interno do servidor: ' + e.message });
  }
});

