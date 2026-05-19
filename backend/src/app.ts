import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';

import { authRouter } from './controllers/authController.js';

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

  app.get('/health', (_req, res) => res.status(200).json({ ok: true }));

  app.use('/auth', authRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

