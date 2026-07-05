export interface TodoItem {
    id: number;
    title: string;
    description: string | null;
    completed: boolean;
    createdAt: string;
}
export interface CreateTodoInput {
    title: string;
    description?: string | null;
    completed?: boolean;
}
export interface UpdateTodoInput {
    title?: string;
    description?: string | null;
    completed?: boolean;
}
//# sourceMappingURL=todo.d.ts.map