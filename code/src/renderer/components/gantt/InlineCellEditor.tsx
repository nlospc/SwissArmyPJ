import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { CalendarIcon } from '../../icons';

type CellValue = string | number | null | undefined;

export type EditorType = 'text' | 'select' | 'date';

export const clampProgress = (progress: number): number => {
  return Math.max(0, Math.min(100, progress));
};

export const progressFromStatus = (status: string, currentProgress: number): number => {
  switch (status) {
    case 'done':
      return 100;
    case 'todo':
      return 0;
    case 'in_progress':
      return currentProgress > 0 ? currentProgress : 10;
    case 'blocked':
      return currentProgress;
    default:
      return currentProgress;
  }
};

export const statusFromProgress = (progress: number, currentStatus: string): 'todo' | 'in_progress' | 'done' | 'blocked' => {
  if (progress >= 100) return 'done';
  if (progress <= 0) return 'todo';
  // Preserve current status if it's valid, otherwise default to in_progress
  if (currentStatus === 'todo' || currentStatus === 'in_progress' || currentStatus === 'done' || currentStatus === 'blocked') {
    return currentStatus;
  }
  return 'in_progress';
};

interface TextOptions {
  type: 'text';
  placeholder?: string;
}

interface SelectOptions {
  type: 'select';
  options: { value: string; label: string; icon?: string }[];
}

interface DateOptions {
  type: 'date';
  isRange?: boolean;
}

type EditorOptions = TextOptions | SelectOptions | DateOptions;

interface InlineCellEditorProps {
  type: EditorType;
  value: CellValue;
  options?: EditorOptions;
  onSave: (value: string) => void;
  onCancel: () => void;
  position: { left: number; top: number; width: number | string };
  inPlace?: boolean;
}

export const InlineCellEditor = ({
  type,
  value,
  options,
  onSave,
  onCancel,
  position,
  inPlace = false,
}: InlineCellEditorProps) => {
  const [editValue, setEditValue] = useState(String(value ?? ''));
  const editorRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  useEffect(() => {
    // Focus the editor on mount
    editorRef.current?.focus();
    // For text inputs, select all text
    if (editorRef.current instanceof HTMLInputElement) {
      editorRef.current.select();
    }
  }, []);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSave(editValue);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleBlur = () => {
    // For text and select, save on blur
    // For date, we have explicit save/cancel buttons
    if (type !== 'date') {
      onSave(editValue);
    }
  };

  // Base classes for editor
  const baseClasses = "px-2 text-sm border-2 border-primary rounded focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white";
  const absoluteClasses = inPlace ? "absolute inset-0" : "absolute";

  if (type === 'text') {
    const textOptions = options as TextOptions;
    return (
      <input
        ref={editorRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={textOptions?.placeholder}
        className={inPlace ? `${baseClasses} w-full h-full` : `${baseClasses} ${absoluteClasses}`}
        style={inPlace ? {} : { left: position.left, top: position.top, width: position.width, height: '34px' }}
      />
    );
  }

  if (type === 'select') {
    const selectOptions = options as SelectOptions;
    return (
      <select
        ref={editorRef as React.RefObject<HTMLSelectElement>}
        value={editValue}
        onChange={(e) => {
          setEditValue(e.target.value);
          onSave(e.target.value);
        }}
        onBlur={onCancel}
        className={inPlace ? `${baseClasses} w-full h-full` : `${baseClasses} ${absoluteClasses}`}
        style={inPlace ? {} : { left: position.left, top: position.top, width: position.width, height: '34px' }}
      >
        {selectOptions.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  if (type === 'date') {
    return <DateInlineEditor value={value} onSave={onSave} position={position} inPlace={inPlace} />;
  }

  return null;
};

// Date editor with calendar popup
interface DateInlineEditorProps {
  value: CellValue;
  onSave: (value: string) => void;
  position: { left: number; top: number; width: number | string };
  inPlace?: boolean;
}

const DateInlineEditor = ({ value, onSave, position, inPlace = false }: DateInlineEditorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? new Date(value as string) : null
  );
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const formatLocalISODate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const startOfMonth = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(1);
    return d;
  };

  const getCalendarDays = (month: Date) => {
    const firstOfMonth = startOfMonth(month);
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

    // Get Monday as first day of week
    const firstDayOfWeek = firstOfMonth.getDay();
    const mondayOffset = firstDayOfWeek === 0 ? -6 : 1 - firstDayOfWeek;

    const days: (Date | null)[] = [];

    // Add empty cells for days before the 1st
    for (let i = 0; i < (mondayOffset < 0 ? 7 + mondayOffset : mondayOffset); i++) {
      days.push(null);
    }

    // Add actual days
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(month.getFullYear(), month.getMonth(), d);
      date.setHours(0, 0, 0, 0);
      days.push(date);
    }

    return days;
  };

  const isSameDay = (a: Date | null, b: Date | null) => {
    if (!a || !b) return false;
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    onSave(formatLocalISODate(day));
    setIsOpen(false);
  };

  const calendarDays = getCalendarDays(currentMonth);
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  return (
    <div className={inPlace ? "absolute inset-0" : "relative"} style={inPlace ? {} : { left: position.left, top: position.top, width: position.width }}>
      {/* Trigger button */}
      <button
        type="button"
        className="w-full h-full px-2 text-sm text-left border-2 border-primary rounded bg-white hover:bg-background-hover flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">{selectedDate ? formatLocalISODate(selectedDate) : 'Set date...'}</span>
        <CalendarIcon className="w-3.5 h-3.5 text-text-tertiary flex-shrink-0" />
      </button>

      {/* Calendar popup */}
      {isOpen && (
        <div
          ref={pickerRef}
          className="absolute z-50 mt-1 bg-white border border-border rounded-lg shadow-lg p-3 w-[280px]"
          style={{ left: 0, top: '100%' }}
        >
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              className="p-1 hover:bg-background-hover rounded"
              onClick={() => {
                const newMonth = new Date(currentMonth);
                newMonth.setMonth(newMonth.getMonth() - 1);
                setCurrentMonth(newMonth);
              }}
            >
              ‹
            </button>
            <span className="text-sm font-medium text-text-primary">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button
              type="button"
              className="p-1 hover:bg-background-hover rounded"
              onClick={() => {
                const newMonth = new Date(currentMonth);
                newMonth.setMonth(newMonth.getMonth() + 1);
                setCurrentMonth(newMonth);
              }}
            >
              ›
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 text-[10px] text-text-tertiary mb-1">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div key={d} className="text-center py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {weeks.flat().map((day, idx) => {
              if (!day) return <div key={idx} className="h-7" />;

              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());

              return (
                <button
                  key={idx}
                  type="button"
                  className={`h-7 rounded text-sm transition-colors ${
                    isSelected
                      ? 'bg-primary text-white'
                      : isToday
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-background-hover text-text-primary'
                  }`}
                  onClick={() => handleDayClick(day)}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <button
              type="button"
              className="text-xs text-text-secondary hover:text-text-primary"
              onClick={() => {
                setSelectedDate(null);
                onSave('');
              }}
            >
              Clear
            </button>
            <button
              type="button"
              className="text-xs px-2 py-1 bg-secondary text-white rounded hover:bg-secondary/90"
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Type definitions for cell rendering
export interface CellConfig {
  key: string;
  type: EditorType;
  options?: EditorOptions;
  getValue: (wp: WorkPackage) => CellValue;
  getDisplay?: (wp: WorkPackage) => string;
  className?: string;
}

import type { WorkPackage } from '@shared/types';
