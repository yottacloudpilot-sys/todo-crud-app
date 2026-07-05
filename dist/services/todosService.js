"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTodo = exports.updateTodo = exports.createTodo = exports.getTodoById = exports.getAllTodos = exports.ValidationError = void 0;
const db_1 = require("../db");
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
function mapRow(row) {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        completed: row.completed === 1,
        createdAt: row.created_at,
    };
}
function validateTitle(title) {
    if (!title || title.trim().length === 0) {
        throw new ValidationError('title must not be empty');
    }
    if (title.length > 255) {
        throw new ValidationError('title must be 255 characters or fewer');
    }
}
function validateDescription(description) {
    if (description != null && description.length > 1000) {
        throw new ValidationError('description must be 1000 characters or fewer');
    }
}
function getAllTodos() {
    try {
        const db = (0, db_1.getDb)();
        const stmt = db.prepare('SELECT * FROM todos ORDER BY created_at DESC, id ASC');
        const rows = stmt.all();
        return rows.map(mapRow);
    }
    catch (err) {
        if (err instanceof ValidationError)
            throw err;
        throw err;
    }
}
exports.getAllTodos = getAllTodos;
function getTodoById(id) {
    try {
        const db = (0, db_1.getDb)();
        const stmt = db.prepare('SELECT * FROM todos WHERE id = ?');
        const row = stmt.get(id);
        return row ? mapRow(row) : null;
    }
    catch (err) {
        if (err instanceof ValidationError)
            throw err;
        throw err;
    }
}
exports.getTodoById = getTodoById;
function createTodo(input) {
    validateTitle(input.title);
    validateDescription(input.description);
    try {
        const db = (0, db_1.getDb)();
        const completed = input.completed === true ? 1 : 0;
        const description = input.description ?? null;
        const stmt = db.prepare('INSERT INTO todos (title, description, completed) VALUES (?, ?, ?)');
        const result = stmt.run(input.title, description, completed);
        const newId = Number(result.lastInsertRowid);
        const created = getTodoById(newId);
        if (!created) {
            throw new Error('Failed to retrieve created todo');
        }
        return created;
    }
    catch (err) {
        if (err instanceof ValidationError)
            throw err;
        throw err;
    }
}
exports.createTodo = createTodo;
function updateTodo(id, input) {
    // Only consider the three mutable fields; ignore id/createdAt if present
    const { title, description, completed } = input;
    const hasUpdate = title !== undefined || description !== undefined || completed !== undefined;
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
    if (!existing)
        return null;
    try {
        const setParts = [];
        const values = [];
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
        const db = (0, db_1.getDb)();
        const stmt = db.prepare(`UPDATE todos SET ${setParts.join(', ')} WHERE id = ?`);
        stmt.run(...values);
        return getTodoById(id);
    }
    catch (err) {
        if (err instanceof ValidationError)
            throw err;
        throw err;
    }
}
exports.updateTodo = updateTodo;
function deleteTodo(id) {
    try {
        const db = (0, db_1.getDb)();
        const stmt = db.prepare('DELETE FROM todos WHERE id = ?');
        const result = stmt.run(id);
        return Number(result.changes) > 0;
    }
    catch (err) {
        if (err instanceof ValidationError)
            throw err;
        throw err;
    }
}
exports.deleteTodo = deleteTodo;
//# sourceMappingURL=todosService.js.map