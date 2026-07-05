export interface TodoItem {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: string; // ISO 8601 UTC string
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
