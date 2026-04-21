/**
 * TodoItem - Individual task row in the todo table
 */

import { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  Play,
  Timer,
  Calendar,
  Clock,
  AlertCircle,
  Square,
  MoreVertical,
  Edit,
  Trash2,
} from 'lucide-react';
import { Button, Dropdown, Modal, Select, Input, Tag } from 'antd';
import { useMyWorkStore, type TodoItem as TodoItemType } from '@/stores/useMyWorkStore';
import { formatDuration } from '../../utils/timeFormatters';
import { formatDueDate } from '../../utils/dateHelpers';

interface TodoItemProps {
  todo: TodoItemType;
  isCompleted?: boolean;
}

const priorityTagColors: Record<string, string> = {
  critical: 'red',
  high: 'orange',
  medium: 'blue',
  low: 'default',
};

export function TodoItem({ todo, isCompleted = false }: TodoItemProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editData, setEditData] = useState({ title: todo.name, status: todo.status, end_date: todo.dueDate || '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const markDone = useMyWorkStore((state) => state.markDone);
  const startTimer = useMyWorkStore((state) => state.startTimer);
  const startPomodoro = useMyWorkStore((state) => state.startPomodoro);
  const stopTimer = useMyWorkStore((state) => state.stopTimer);
  const fetchTodos = useMyWorkStore((state) => state.fetchTodos);
  const activeLogsMap = useMyWorkStore((state) => state.activeLogs);

  const activeTimerLog = useMemo(() => {
    return Array.from(activeLogsMap.values()).find(
      (log) => log.workItemId === todo.id
    );
  }, [activeLogsMap, todo.id]);

  const hasActiveTimer = !!activeTimerLog;
  const dueDateInfo = formatDueDate(todo.dueDate);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { ipc } = await import('@/lib/ipc');
      const result = await ipc.workItems.delete(todo.id);
      if (result.success) {
        await fetchTodos(true);
        setIsDeleteOpen(false);
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editData.title.trim()) return;
    setIsSaving(true);
    try {
      const { ipc } = await import('@/lib/ipc');
      const result = await ipc.workItems.update(todo.id, {
        title: editData.title.trim(),
        status: editData.status as 'not_started' | 'in_progress' | 'done' | 'blocked',
        end_date: editData.end_date || null,
      });
      if (result.success) {
        await fetchTodos(true);
        setIsEditOpen(false);
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const menuItems = [
    {
      key: 'edit',
      label: 'Edit Task',
      icon: <Edit className="h-4 w-4" />,
      onClick: () => {
        setEditData({ title: todo.name, status: todo.status, end_date: todo.dueDate || '' });
        setIsEditOpen(true);
      },
    },
    {
      key: 'delete',
      label: 'Delete Task',
      icon: <Trash2 className="h-4 w-4" />,
      danger: true,
      onClick: () => setIsDeleteOpen(true),
    },
  ];

  return (
    <tr
      className={[
        'border-b last:border-0 transition-colors hover:bg-theme-container',
        isCompleted ? 'opacity-60' : '',
        dueDateInfo.isOverdue && !isCompleted ? 'bg-red-50' : '',
      ].filter(Boolean).join(' ')}
    >
      {/* Checkbox */}
      <td className="w-8 px-3 py-2.5">
        <button
          onClick={() => markDone(todo.id)}
          className="text-theme-secondary hover:text-blue-600 transition-colors"
          disabled={isCompleted}
        >
          {isCompleted ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <Circle className="h-4 w-4" />
          )}
        </button>
      </td>

      {/* Task */}
      <td className="px-3 py-2.5">
        <span className={`font-medium text-sm${isCompleted ? ' line-through text-theme-secondary' : ''}`}>
          {todo.name}
        </span>
      </td>

      {/* Project */}
      <td className="px-3 py-2.5 text-sm text-theme-secondary">
        {todo.projectName}
      </td>

      {/* Priority */}
      <td className="px-3 py-2.5">
        {todo.priority && todo.priority !== 'none' ? (
          <Tag color={priorityTagColors[todo.priority] || 'default'} style={{ fontSize: 10 }}>
            {todo.priority.toUpperCase()}
          </Tag>
        ) : (
          <span className="text-xs text-theme-secondary">—</span>
        )}
      </td>

      {/* Due */}
      <td className="px-3 py-2.5">
        {todo.dueDate ? (
          <span className={`text-sm flex items-center gap-1${dueDateInfo.isOverdue ? ' text-red-600 font-medium' : dueDateInfo.isToday ? ' text-amber-600 font-medium' : ''}`}>
            <Calendar className="h-3 w-3" />
            {dueDateInfo.text}
            {dueDateInfo.isOverdue && <AlertCircle className="h-3 w-3" />}
          </span>
        ) : (
          <span className="text-xs text-theme-secondary">—</span>
        )}
      </td>

      {/* Time */}
      <td className="px-3 py-2.5 text-sm text-theme-secondary">
        {todo.estimatedMinutes || todo.loggedMinutes > 0 ? (
          <div className="flex flex-col gap-0.5">
            {todo.estimatedMinutes ? (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(todo.estimatedMinutes)} est
              </span>
            ) : null}
            {todo.loggedMinutes > 0 ? (
              <span className="flex items-center gap-1 text-green-600">
                <Clock className="h-3 w-3" />
                {formatDuration(todo.loggedMinutes)} logged
              </span>
            ) : null}
          </div>
        ) : (
          <span>—</span>
        )}
      </td>

      {/* Actions */}
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          {!isCompleted && (
            <>
              {hasActiveTimer ? (
                <>
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-600 rounded text-xs font-medium">
                    <Clock className="h-3 w-3 animate-pulse" />
                    Running
                  </div>
                  <Button
                    size="small"
                    onClick={() => activeTimerLog && stopTimer(activeTimerLog.id)}
                    title="Stop timer"
                    style={{ height: 28, width: 28, padding: 0 }}
                  >
                    <Square className="h-3 w-3" />
                  </Button>
                </>
              ) : (
                <>
                  <Button size="small" onClick={() => startTimer(todo.id, false)} style={{ height: 28 }}>
                    <Play className="h-3 w-3" style={{ marginRight: 4 }} />
                    Start
                  </Button>
                  <Button size="small" onClick={() => startPomodoro(todo.id)} style={{ height: 28 }}>
                    <Timer className="h-3 w-3" style={{ marginRight: 4 }} />
                    Pomo
                  </Button>
                </>
              )}
            </>
          )}

          <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={['click']}>
            <Button type="text" size="small" style={{ height: 28, width: 28, padding: 0 }}>
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </Dropdown>
        </div>

        {/* Delete Confirmation Modal */}
        <Modal
          open={isDeleteOpen}
          onCancel={() => setIsDeleteOpen(false)}
          title="Delete Task"
          width={400}
          footer={[
            <Button key="cancel" disabled={isDeleting} onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>,
            <Button key="delete" danger type="primary" disabled={isDeleting} onClick={handleDelete}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>,
          ]}
        >
          <p>Are you sure you want to delete "{todo.name}"? This action cannot be undone.</p>
        </Modal>

        {/* Edit Modal */}
        <Modal
          open={isEditOpen}
          onCancel={() => setIsEditOpen(false)}
          title="Edit Task"
          width={500}
          footer={[
            <Button key="cancel" disabled={isSaving} onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>,
            <Button key="save" type="primary" disabled={!editData.title.trim() || isSaving} onClick={handleSaveEdit}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>,
          ]}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Task Name</label>
              <Input
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                placeholder="Enter task name..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <Select
                value={editData.status}
                onChange={(value) => setEditData({ ...editData, status: value })}
                style={{ width: '100%' }}
                options={[
                  { value: 'not_started', label: 'Not Started' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'blocked', label: 'Blocked' },
                  { value: 'done', label: 'Done' },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Due Date</label>
              <Input
                type="date"
                value={editData.end_date}
                onChange={(e) => setEditData({ ...editData, end_date: e.target.value })}
              />
            </div>
          </div>
        </Modal>
      </td>
    </tr>
  );
}
