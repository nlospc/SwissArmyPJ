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
  // Select the Map itself, not a converted array
  const todosMap = useMyWorkStore((state) => state.todos);
  const groupBy = useMyWorkStore((state) => state.groupBy);
  const sortBy = useMyWorkStore((state) => state.sortBy);
  const filterStatus = useMyWorkStore((state) => state.filterStatus);
  const loading = useMyWorkStore((state) => state.loading);
  const error = useMyWorkStore((state) => state.error);

  // Convert Map to array in useMemo to avoid recreating on every render
  const todos = useMemo(() => Array.from(todosMap.values()), [todosMap]);

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

      {/* Quick Add Task - Sticky at Top */}
      {projects.length > 0 && (
        <div className="sticky top-0 z-10 bg-theme-container px-6 py-3 border-b shadow-sm">
          <QuickTaskInput projects={projects} />
        </div>
      )}

      {/* Todo List */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {groupedTodos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-sm text-muted-foreground mb-4">
              No tasks found. Add your first task to get started!
            </div>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="w-8 px-3 py-2" />
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Task</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Project</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Priority</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Due</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Time</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {groupedTodos.map((group, index) => (
                  <TodoGroup key={group.key} group={group} isFirst={index === 0} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
