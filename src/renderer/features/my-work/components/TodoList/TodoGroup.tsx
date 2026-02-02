/**
 * TodoGroup - Collapsible group section for todos
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { TodoItem } from './TodoItem';
import type { TodoGroup as TodoGroupType } from '../../utils/groupTodos';

interface TodoGroupProps {
  group: TodoGroupType;
  defaultExpanded?: boolean;
}

export function TodoGroup({ group, defaultExpanded = true }: TodoGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="mb-6">
      {/* Group Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 mb-3 w-full text-left hover:text-primary transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {group.label}
        </h3>
        <span className="text-xs text-muted-foreground/70">
          ({group.count})
        </span>
      </button>

      {/* Group Items */}
      {isExpanded && (
        <div className="space-y-3">
          {group.todos.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              No tasks in this group
            </div>
          ) : (
            group.todos.map((todo) => (
              <TodoItem
                key={todo.uuid}
                todo={todo}
                isCompleted={todo.status === 'done' && todo.completedAt !== null}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
