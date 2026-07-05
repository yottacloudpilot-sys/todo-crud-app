import { getDb } from '../db';
import { TodoItem, CreateTodoInput, UpdateTodoInput } from '../models/todo';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

interface TodoRow {
  id: number;
  title: string;
  description: string | null;
  completed: number;
  created_at: string;
}

function mapRow(row: TodoRow): TodoItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    completed: row.completed === 1,
    createdAt: row.created_at,
  };
}

function validateTitle(title: string): void {
  if (!title || title.trim().length === 0) {
    throw new ValidationError('title must not be empty');
  }
  if (title.length > 255) {
    throw new ValidationError('title must be 255 characters or fewer');
  }
}

function validateDescription(description: string | null | undefined): void {
  if (description != null && description.length > 1000) {
    throw new ValidationError('description must be 1000 characters or fewer');
  }
}

export function getAllTodos(): TodoItem[] {
  try {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM todos ORDER BY created_at DESC, id ASC');
    const rows = stmt.all() as TodoRow[];
    return rows.map(mapRow);
  } catch (err) {
    if (err instanceof ValidationError) throw err;
    throw err;
  }
}

export function getTodoById(id: number): TodoItem | null {
  try {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM todos WHERE id = ?');
    const row = stmt.get(id) as TodoRow | undefined;
    return row ? mapRow(row) : null;
  } catch (err) {
    if (err instanceof ValidationError) throw err;
    throw err;
  }
}

export function createTodo(input: CreateTodoInput): TodoItem {
  validateTitle(input.title);
  validateDescription(input.description);

  try {
    const db = getDb();
    const completed = input.completed === true ? 1 : 0;
    const description = input.description ?? null;

    const stmt = db.prepare(
      'INSERT INTO todos (title, description, completed) VALUES (?, ?, ?)'
    );
    const result = stmt.run(input.title, description, completed);
    const newId = Number(result.lastInsertRowid);

    const created = getTodoById(newId);
    if (!created) {
      throw new Error('Failed to retrieve created todo');
    }
    return created;
  } catch (err) {
    if (err instanceof ValidationError) throw err;
    throw err;
  }
}

export function updateTodo(id: number, input: UpdateTodoInput): TodoItem | null {
  // Only consider the three mutable fields; ignore id/createdAt if present
  const { title, description, completed } = input;

  const hasUpdate =
    title !== undefined || description !== undefined || completed !== undefined;
  if (!hasUpdate) {
    throw new ValidationError('Request body must contain at least one field to update');
  }

  if (title !== undefined) {
    validateTitle(title);
  }
  if (description !== undefined) {
    validateDescription(description);
  }

  // Check if todo exists before attempting update
  const existing = getTodoById(id);
  if (!existing) return null;

  try {
    const setParts: string[] = [];
    const values: (string | number | null)[] = [];

    if (title !== undefined) {
      setParts.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      setParts.push('description = ?');
      values.push(description);
    }
    if (completed !== undefined) {
      setParts.push('completed = ?');
      values.push(completed ? 1 : 0);
    }

    values.push(id);

    const db = getDb();
    const stmt = db.prepare(`UPDATE todos SET ${setParts.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    return getTodoById(id);
  } catch (err) {
    if (err instanceof ValidationError) throw err;
    throw err;
  }
}

export function deleteTodo(id: number): boolean {
  try {
    const db = getDb();
    const stmt = db.prepare('DELETE FROM todos WHERE id = ?');
    const result = stmt.run(id);
    return Number(result.changes) > 0;
  } catch (err) {
    if (err instanceof ValidationError) throw err;
    throw err;
  }
}
