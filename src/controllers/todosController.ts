import { Request, Response, NextFunction } from 'express';
import * as todosService from '../services/todosService';
import { ValidationError } from '../services/todosService';

function requireJsonContentType(req: Request, res: Response): boolean {
  // Only enforce for requests with a body (POST, PATCH)
  const contentType = req.headers['content-type'] ?? '';
  if (!contentType.includes('application/json')) {
    res.status(415).json({ error: 'Content-Type must be application/json' });
    return false;
  }
  return true;
}

export function listTodos(req: Request, res: Response, next: NextFunction): void {
  try {
    const todos = todosService.getAllTodos();
    res.status(200).json(todos);
  } catch (err) {
    next(err);
  }
}

export function getTodo(req: Request, res: Response, next: NextFunction): void {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(404).json({ error: `Todo with id ${req.params.id} not found` });
      return;
    }
    const todo = todosService.getTodoById(id);
    if (!todo) {
      res.status(404).json({ error: `Todo with id ${id} not found` });
      return;
    }
    res.status(200).json(todo);
  } catch (err) {
    next(err);
  }
}

export function createTodo(req: Request, res: Response, next: NextFunction): void {
  if (!requireJsonContentType(req, res)) return;
  try {
    const todo = todosService.createTodo(req.body);
    res.status(201).json(todo);
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }
}

export function updateTodo(req: Request, res: Response, next: NextFunction): void {
  if (!requireJsonContentType(req, res)) return;
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(404).json({ error: `Todo with id ${req.params.id} not found` });
      return;
    }
    const todo = todosService.updateTodo(id, req.body);
    if (!todo) {
      res.status(404).json({ error: `Todo with id ${id} not found` });
      return;
    }
    res.status(200).json(todo);
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }
}

export function deleteTodo(req: Request, res: Response, next: NextFunction): void {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(404).json({ error: `Todo with id ${req.params.id} not found` });
      return;
    }
    const deleted = todosService.deleteTodo(id);
    if (!deleted) {
      res.status(404).json({ error: `Todo with id ${id} not found` });
      return;
    }
    res.status(200).json({ id });
  } catch (err) {
    next(err);
  }
}
