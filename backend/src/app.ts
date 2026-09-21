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

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN ?? '*',
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
    } catch (error: any) {
      return res.status(503).json({ 
        status: 'unhealthy', 
        database: 'disconnected', 
        error: error?.message || 'Database ping failed' 
      });
    }
  });

  app.use('/auth', authRouter);
  app.use('/cursos', authMiddleware, cursoRouter);
  app.use('/salas', authMiddleware, salaRouter);
  app.use('/instrutores', authMiddleware, instrutorRouter);
  app.use('/feriados', feriadoRouter);
  app.use('/calcular_cronograma', calculadoraRouter);
  app.use('/turmas', authMiddleware, turmaRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

