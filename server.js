import express from 'express';
import cors from 'cors';

import { registerRoutes } from './src/routes/index.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos do frontend
app.use(express.static('.'));

registerRoutes(app);

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`SGST Node API listening on http://localhost:${PORT}`);
});

