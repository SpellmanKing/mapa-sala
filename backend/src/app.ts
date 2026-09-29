import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';
import { authMiddleware } from './middlewares/authMiddleware.js';

import { authRouter } from './controllers/authController.js';
import { cursoRouter } from './controllers/cursoController.js';
import { salaRouter } from './controllers/salaController.js';
import { instrutorRouter } from './controllers/instrutorController.js';
import { feriadoRouter } from './controllers/feriadoController.js';
import { calculadoraRouter } from './controllers/calculadoraController.js';
import { turmaRouter } from './controllers/turmaController.js';
import { prisma } from './infrastructure/prismaClient.js';
import { env, getJwtSecret } from './config/env.js';

export function createApp() {
  if (env.requireAuth) getJwtSecret();
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());

  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true
    })
  );

  app.use(morgan('combined'));
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.get('/', (_req, res) => res.json({ name: 'SGST API', status: 'online', version: '1.0.0' }));
  
  app.get('/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return res.status(200).json({ 
        status: 'healthy', 
        database: 'connected', 
        timestamp: new Date().toISOString() 
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Health check failed:', error);
      return res.status(503).json({ 
        status: 'unhealthy', 
        database: 'disconnected', 
        error: 'Database ping failed'
      });
    }
  });

  app.use('/auth', authRouter);
  app.use('/cursos', authMiddleware, cursoRouter);
  app.use('/salas', authMiddleware, salaRouter);
  app.use('/instrutores', authMiddleware, instrutorRouter);
  app.use('/feriados', authMiddleware, feriadoRouter);
  app.use('/calcular_cronograma', authMiddleware, calculadoraRouter);
  app.use('/turmas', authMiddleware, turmaRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
