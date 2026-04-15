import { create } from 'zustand';
import { ipc } from '@/lib/ipc';
import type { Todo, CreateTodoDTO, UpdateTodoDTO } from '@/shared/types';

interface TodoState {
  todos: Todo[];
  isLoading: boolean;
  error: string | null;

  // Selectors
  getTodosByDate: (date: string) => Todo[];
  getTodosForDateRange: (startDate: string, endDate: string) => Todo[];

  // Actions
  loadTodos: () => Promise<void>;
  createTodo: (data: CreateTodoDTO) => Promise<void>;
  updateTodo: (id: number, data: UpdateTodoDTO) => Promise<void>;
  toggleTodo: (id: number) => Promise<void>;
  deleteTodo: (id: number) => Promise<void>;
}

export const useTodoStore = create<TodoState>((set, get) => ({
  todos: [],
  isLoading: false,
  error: null,

  getTodosByDate: (date: string) => {
    return get().todos.filter((todo) => todo.due_date === date);
  },

  getTodosForDateRange: (startDate: string, endDate: string) => {
    return get().todos.filter((todo) => {
      if (!todo.due_date) return false;
      return todo.due_date >= startDate && todo.due_date <= endDate;
    });
  },

  loadTodos: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await ipc.todos.getAll();
      if (result.success && result.data) {
        set({ todos: result.data, isLoading: false });
      } else {
        set({ error: result.error || 'Failed to load todos', isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createTodo: async (data: CreateTodoDTO) => {
    set({ isLoading: true, error: null });
    try {
      const result = await ipc.todos.create(data);
      if (result.success && result.data) {
        set((state) => ({
          todos: [...state.todos, result.data!],
          isLoading: false,
        }));
      } else {
        set({ error: result.error || 'Failed to create todo', isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  updateTodo: async (id: number, data: UpdateTodoDTO) => {
    set({ isLoading: true, error: null });
    try {
      const result = await ipc.todos.update(id, data);
      if (result.success && result.data) {
        set((state) => ({
          todos: state.todos.map((todo) => (todo.id === id ? result.data! : todo)),
          isLoading: false,
        }));
      } else {
        set({ error: result.error || 'Failed to update todo', isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  toggleTodo: async (id: number) => {
    // Optimistic update
    set((state) => ({
      todos: state.todos.map((todo) =>
        todo.id === id ? { ...todo, done: todo.done === 1 ? 0 : 1 } : todo
      ),
    }));

    try {
      const result = await ipc.todos.toggle(id);
      if (result.success && result.data) {
        set((state) => ({
          todos: state.todos.map((todo) => (todo.id === id ? result.data! : todo)),
        }));
      } else {
        // Rollback on error
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id ? { ...todo, done: todo.done === 1 ? 0 : 1 } : todo
          ),
          error: result.error || 'Failed to toggle todo',
        }));
      }
    } catch (error: any) {
      // Rollback on error
      set((state) => ({
        todos: state.todos.map((todo) =>
          todo.id === id ? { ...todo, done: todo.done === 1 ? 0 : 1 } : todo
        ),
        error: error.message,
      }));
    }
  },

  deleteTodo: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const result = await ipc.todos.delete(id);
      if (result.success) {
        set((state) => ({
          todos: state.todos.filter((todo) => todo.id !== id),
          isLoading: false,
        }));
      } else {
        set({ error: result.error || 'Failed to delete todo', isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
}));
