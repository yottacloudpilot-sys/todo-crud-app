import { TodoItem, CreateTodoInput, UpdateTodoInput } from '../models/todo';
export declare class ValidationError extends Error {
    constructor(message: string);
}
export declare function getAllTodos(): TodoItem[];
export declare function getTodoById(id: number): TodoItem | null;
export declare function createTodo(input: CreateTodoInput): TodoItem;
export declare function updateTodo(id: number, input: UpdateTodoInput): TodoItem | null;
export declare function deleteTodo(id: number): boolean;
//# sourceMappingURL=todosService.d.ts.map