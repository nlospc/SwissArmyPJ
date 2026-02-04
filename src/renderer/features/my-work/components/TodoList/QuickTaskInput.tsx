/**
 * QuickTaskInput - Inline "+ Add Quick Task" input
 */

import { useState, useRef } from 'react';
import { Plus, Check, X } from 'lucide-react';
import { Button, Select } from 'antd';
import { useMyWorkStore } from '@/stores/useMyWorkStore';

interface QuickTaskInputProps {
  defaultProjectId?: number;
  projects: Array<{ id: number; name: string }>;
}

export function QuickTaskInput({ defaultProjectId, projects }: QuickTaskInputProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState<number>(defaultProjectId || projects[0]?.id || 0);
  const inputRef = useRef<HTMLInputElement>(null);
  const addQuickTask = useMyWorkStore((state) => state.addQuickTask);
  const loading = useMyWorkStore((state) => state.loading);

  const handleStart = () => {
    setIsAdding(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setTitle('');
    setProjectId(defaultProjectId || projects[0]?.id || 0);
  };

  const handleSave = async () => {
    if (!title.trim() || !projectId) return;

    await addQuickTask(projectId, title.trim());
    setTitle('');
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isAdding) {
    return (
      <Button type="primary" className="w-full" onClick={handleStart}>
        <Plus className="h-4 w-4" style={{ marginRight: 8 }} />
        Add New Task
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-blue-500 bg-blue-50">
      {/* Project Selector */}
      {!defaultProjectId && (
        <Select
          value={projectId}
          onChange={(value) => setProjectId(value)}
          style={{ width: 140 }}
          options={projects.map((p) => ({ value: p.id, label: p.name }))}
        />
      )}

      {/* Title Input */}
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Task title..."
        className="flex-1 bg-transparent border-none outline-none text-sm placeholder-gray-400"
        disabled={loading}
      />

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button
          size="small"
          type="primary"
          onClick={handleSave}
          disabled={!title.trim() || loading}
        >
          <Check className="h-3 w-3" />
        </Button>
        <Button
          size="small"
          type="text"
          onClick={handleCancel}
          disabled={loading}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
