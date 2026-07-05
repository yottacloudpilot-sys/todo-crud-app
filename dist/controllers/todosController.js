"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTodo = exports.updateTodo = exports.createTodo = exports.getTodo = exports.listTodos = void 0;
const todosService = __importStar(require("../services/todosService"));
const todosService_1 = require("../services/todosService");
function requireJsonContentType(req, res) {
    // Only enforce for requests with a body (POST, PATCH)
    const contentType = req.headers['content-type'] ?? '';
    if (!contentType.includes('application/json')) {
        res.status(415).json({ error: 'Content-Type must be application/json' });
        return false;
    }
    return true;
}
function listTodos(req, res, next) {
    try {
        const todos = todosService.getAllTodos();
        res.status(200).json(todos);
    }
    catch (err) {
        next(err);
    }
}
exports.listTodos = listTodos;
function getTodo(req, res, next) {
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
    }
    catch (err) {
        next(err);
    }
}
exports.getTodo = getTodo;
function createTodo(req, res, next) {
    if (!requireJsonContentType(req, res))
        return;
    try {
        const todo = todosService.createTodo(req.body);
        res.status(201).json(todo);
    }
    catch (err) {
        if (err instanceof todosService_1.ValidationError) {
            res.status(400).json({ error: err.message });
            return;
        }
        next(err);
    }
}
exports.createTodo = createTodo;
function updateTodo(req, res, next) {
    if (!requireJsonContentType(req, res))
        return;
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
    }
    catch (err) {
        if (err instanceof todosService_1.ValidationError) {
            res.status(400).json({ error: err.message });
            return;
        }
        next(err);
    }
}
exports.updateTodo = updateTodo;
function deleteTodo(req, res, next) {
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
    }
    catch (err) {
        next(err);
    }
}
exports.deleteTodo = deleteTodo;
//# sourceMappingURL=todosController.js.map