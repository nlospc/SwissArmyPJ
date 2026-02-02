/**
 * QuickTaskInput - Inline "+ Add Quick Task" input
 */

import { useState, useRef } from 'react';
import { Plus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMyWorkStore } from '@/stores/useMyWorkStore';
import { cn } from '@/components/ui/utils';

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
      <button
        onClick={handleStart}
        className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors w-full shadow-sm font-medium"
      >
        <Plus className="h-4 w-4" />
        <span className="text-sm">Add New Task</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-primary bg-accent">
      {/* Project Selector */}
      {!defaultProjectId && (
        <Select
          value={projectId.toString()}
          onValueChange={(value) => setProjectId(parseInt(value, 10))}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      )}

      {/* Title Input */}
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Task title..."
        className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
        disabled={loading}
      />

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!title.trim() || loading}
          className="h-7 px-2"
        >
          <Check className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          disabled={loading}
          className="h-7 px-2"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
