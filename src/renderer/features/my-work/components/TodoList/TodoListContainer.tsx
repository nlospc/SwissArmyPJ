/**
 * TodoListContainer - Main container for todo list with grouping logic
 */

import { useMemo } from 'react';
import { TodoFilters } from './TodoFilters';
import { TodoGroup } from './TodoGroup';
import { QuickTaskInput } from './QuickTaskInput';
import { useMyWorkStore } from '@/stores/useMyWorkStore';
import { groupTodos, sortTodos, filterTodos } from '../../utils/groupTodos';

export function TodoListContainer() {
  const todos = useMyWorkStore((state) => Array.from(state.todos.values()));
  const groupBy = useMyWorkStore((state) => state.groupBy);
  const sortBy = useMyWorkStore((state) => state.sortBy);
  const filterStatus = useMyWorkStore((state) => state.filterStatus);
  const loading = useMyWorkStore((state) => state.loading);
  const error = useMyWorkStore((state) => state.error);

  // Extract unique projects for Quick Task input
  const projects = useMemo(() => {
    const projectMap = new Map<number, string>();

    for (const todo of todos) {
      if (!projectMap.has(todo.projectId)) {
        projectMap.set(todo.projectId, todo.projectName || 'Unknown Project');
      }
    }

    return Array.from(projectMap.entries()).map(([id, name]) => ({ id, name }));
  }, [todos]);

  // Apply filtering, sorting, and grouping
  const groupedTodos = useMemo(() => {
    // First filter
    const filtered = filterTodos(todos, filterStatus);

    // Then sort each todo
    const sorted = sortTodos(filtered, sortBy);

    // Then group
    const groups = groupTodos(sorted, groupBy);

    // Sort todos within each group
    return groups.map((group) => ({
      ...group,
      todos: sortTodos(group.todos, sortBy),
    }));
  }, [todos, groupBy, sortBy, filterStatus]);

  if (loading && todos.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-muted-foreground">Loading todos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <TodoFilters />

      {/* Todo List */}
      <div className="flex-1 overflow-y-auto pr-2">
        {groupedTodos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-sm text-muted-foreground mb-4">
              No tasks found. Add your first task to get started!
            </div>
            <QuickTaskInput projects={projects} />
          </div>
        ) : (
          <>
            {groupedTodos.map((group) => (
              <TodoGroup key={group.key} group={group} />
            ))}

            {/* Quick Add at Bottom */}
            {projects.length > 0 && (
              <div className="mt-6">
                <QuickTaskInput projects={projects} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
