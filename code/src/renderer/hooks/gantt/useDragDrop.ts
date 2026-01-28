import { useState, useCallback, useEffect } from 'react';
import { useGanttStore } from '@/stores/useGanttStore';
import {
  DAY_MS,
  formatLocalISODate,
  parseLocalISODate,
  snapStartForUnit,
  snapEndForUnit,
  type RenderUnit,
} from '@/utils/date';
import type { WorkPackage } from '@shared/types';

interface DragState {
  taskId: number;
  kind: 'move' | 'resize_start' | 'resize_end' | 'milestone_move';
  startX: number;
  originalStart: Date;
  originalEnd: Date;
}

interface DragTooltip {
  x: number;
  y: number;
  start: string;
  end: string;
  hint: string;
}

export function useDragDrop(
  renderUnit: RenderUnit,
  getTimelineWidthPx: () => number | null
) {
  const { timelineWindow, updateWorkPackage, setSelectedTaskId } = useGanttStore();
  const viewStart = timelineWindow.from;
  const viewEnd = timelineWindow.to;

  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragTooltip, setDragTooltip] = useState<DragTooltip | null>(null);

  const handleBeginDrag = useCallback((
    task: WorkPackage,
    kind: DragState['kind'],
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (task.scheduling_mode === 'automatic') return;
    if (!task.start_date || !task.end_date) return;

    setDragState({
      taskId: task.id,
      kind,
      startX: e.clientX,
      originalStart: parseLocalISODate(task.start_date),
      originalEnd: parseLocalISODate(task.end_date),
    });
    setSelectedTaskId(task.id);
    setDragTooltip({
      x: e.clientX, y: e.clientY,
      start: task.start_date, end: task.end_date,
      hint: 'Ctrl: day precision | Shift: lock duration',
    });
  }, [setSelectedTaskId]);

  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!dragState) return;
    const tw = getTimelineWidthPx();
    if (!tw) return;
    const spanMs = viewEnd.getTime() - viewStart.getTime();
    if (spanMs <= 0) return;
    const spanDays = spanMs / DAY_MS;
    const deltaX = e.clientX - dragState.startX;
    const deltaDays = Math.round((deltaX / tw) * spanDays);
    const ctrlPrecision = e.ctrlKey || e.metaKey;
    const snapUnit: RenderUnit = ctrlPrecision ? 'day' : renderUnit;
    const lockDuration = e.shiftKey;
    const { originalStart, originalEnd } = dragState;
    const originalDurationMs = Math.max(DAY_MS, originalEnd.getTime() - originalStart.getTime());
    let nextStart = new Date(originalStart.getTime());
    let nextEnd = new Date(originalEnd.getTime());

    if (dragState.kind === 'move' || (lockDuration && dragState.kind !== 'milestone_move')) {
      nextStart = new Date(originalStart.getTime() + deltaDays * DAY_MS);
      nextEnd = new Date(originalEnd.getTime() + deltaDays * DAY_MS);
      const snappedStart = snapStartForUnit(nextStart, snapUnit);
      const shiftMs = snappedStart.getTime() - nextStart.getTime();
      nextStart = snappedStart;
      nextEnd = new Date(nextEnd.getTime() + shiftMs);
    } else if (dragState.kind === 'resize_start') {
      nextStart = snapStartForUnit(new Date(originalStart.getTime() + deltaDays * DAY_MS), snapUnit);
      nextEnd = new Date(originalStart.getTime() + originalDurationMs);
    } else if (dragState.kind === 'resize_end') {
      nextStart = new Date(originalStart.getTime());
      nextEnd = snapEndForUnit(new Date(originalEnd.getTime() + deltaDays * DAY_MS), snapUnit);
    } else if (dragState.kind === 'milestone_move') {
      const moved = new Date(originalStart.getTime() + deltaDays * DAY_MS);
      const snapped = snapStartForUnit(moved, snapUnit);
      nextStart = snapped;
      nextEnd = snapped;
    }

    if (dragState.kind !== 'milestone_move') {
      if (nextEnd.getTime() - nextStart.getTime() < DAY_MS) {
        nextEnd = new Date(nextStart.getTime() + DAY_MS);
      }
    }

    const nextStartIso = formatLocalISODate(nextStart);
    const nextEndIso = formatLocalISODate(nextEnd);

    useGanttStore.setState((state) => ({
      workPackages: state.workPackages.map((wp) =>
        wp.id === dragState.taskId ? { ...wp, start_date: nextStartIso, end_date: nextEndIso } : wp
      ),
    }));

    setDragTooltip({
      x: e.clientX, y: e.clientY,
      start: nextStartIso, end: nextEndIso,
      hint: `${snapUnit} snap${ctrlPrecision ? ' (precision)' : ''} | Shift: lock duration`,
    });
  }, [dragState, renderUnit, viewStart, viewEnd, getTimelineWidthPx]);

  const handleDragEnd = useCallback(async () => {
    if (!dragState) return;
    const origStartIso = formatLocalISODate(dragState.originalStart);
    const origEndIso = formatLocalISODate(dragState.originalEnd);
    const currentState = useGanttStore.getState();
    const updated = currentState.workPackages.find((wp) => wp.id === dragState.taskId);
    if (updated && updated.start_date && updated.end_date &&
        (updated.start_date !== origStartIso || updated.end_date !== origEndIso)) {
      await updateWorkPackage(dragState.taskId, {
        start_date: updated.start_date,
        end_date: updated.end_date,
      });
    }
    setDragState(null);
    setDragTooltip(null);
  }, [dragState, updateWorkPackage]);

  useEffect(() => {
    if (!dragState) return;
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [dragState, handleDragMove, handleDragEnd]);

  return { dragState, dragTooltip, handleBeginDrag, isDragging: dragState !== null };
}
