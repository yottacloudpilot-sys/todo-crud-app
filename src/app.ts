import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import todosRouter from './routes/todos';
import { errorHandler } from './middleware/errorHandler';

export function createApp(): Application {
  const app = express();

  // CORS — strip trailing slash to avoid browser origin mismatch
  const corsOrigin = (process.env.CORS_ORIGIN || '*').replace(/\/$/, '');
  app.use(cors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type'],
  }));

  // Parse JSON bodies — triggers entity.parse.failed on malformed JSON
  app.use(express.json());

  // Mount todos router
  app.use('/todos', todosRouter);

  // 404 catch-all for undefined routes
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}
