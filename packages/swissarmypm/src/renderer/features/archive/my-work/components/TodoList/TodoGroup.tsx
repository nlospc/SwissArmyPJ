/**
 * TodoGroup - Collapsible group header + task rows (renders inside a shared <tbody>)
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { TodoItem } from './TodoItem';
import type { TodoGroup as TodoGroupType } from '../../utils/groupTodos';

interface TodoGroupProps {
  group: TodoGroupType;
  defaultExpanded?: boolean;
  isFirst?: boolean;
}

export function TodoGroup({ group, defaultExpanded = true, isFirst = false }: TodoGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <>
      {/* Group label row */}
      <tr className={`bg-muted/30${isFirst ? '' : ' border-t-2 border-muted'}`}>
        <td colSpan={7} className="px-3 py-1.5">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-left hover:text-primary transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group.label}
            </span>
            <span className="text-xs text-muted-foreground/60">({group.count})</span>
          </button>
        </td>
      </tr>

      {/* Task rows */}
      {isExpanded && (
        group.todos.length === 0 ? (
          <tr>
            <td colSpan={7} className="text-center text-sm text-muted-foreground py-6">
              No tasks in this group
            </td>
          </tr>
        ) : (
          group.todos.map((todo) => (
            <TodoItem
              key={todo.uuid}
              todo={todo}
              isCompleted={todo.status === 'done' && todo.completedAt !== null}
            />
          ))
        )
      )}
    </>
  );
}
