import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../services/todosService';

interface BodyParseError extends Error {
  type?: string;
  status?: number;
}

export function errorHandler(
  err: BodyParseError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  // Handle express.json() parse errors (malformed JSON)
  if (err.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Invalid JSON in request body' });
    return;
  }

  // Handle validation errors from the service layer
  if (err instanceof ValidationError) {
    res.status(400).json({ error: err.message });
    return;
  }

  // Unexpected errors → 503
  console.error('Unexpected error:', err);
  res.status(503).json({ error: 'Service temporarily unavailable' });
}
