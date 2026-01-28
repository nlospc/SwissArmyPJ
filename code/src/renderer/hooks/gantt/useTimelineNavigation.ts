import { useState, useCallback, useEffect } from 'react';
import { useGanttStore } from '@/stores/useGanttStore';
import { DAY_MS } from '@/utils/date';

export function useTimelineNavigation(getTimelineWidthPx: () => number | null) {
  const { timelineWindow, setTimelineWindow, zoomTimeline } = useGanttStore();
  const viewStart = timelineWindow.from;
  const viewEnd = timelineWindow.to;

  const [panState, setPanState] = useState<{
    startX: number;
    originalFrom: Date;
    originalTo: Date;
  } | null>(null);

  const handlePanStart = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setPanState({ startX: e.clientX, originalFrom: viewStart, originalTo: viewEnd });
  }, [viewStart, viewEnd]);

  const handlePanMove = useCallback((e: MouseEvent) => {
    if (!panState) return;
    const tw = getTimelineWidthPx();
    if (!tw) return;
    const spanMs = panState.originalTo.getTime() - panState.originalFrom.getTime();
    if (spanMs <= 0) return;
    const spanDays = spanMs / DAY_MS;
    const deltaX = e.clientX - panState.startX;
    const deltaDays = Math.round((-deltaX / tw) * spanDays);
    const nextFrom = new Date(panState.originalFrom.getTime() + deltaDays * DAY_MS);
    const nextTo = new Date(panState.originalTo.getTime() + deltaDays * DAY_MS);
    setTimelineWindow(nextFrom, nextTo);
  }, [panState, getTimelineWidthPx, setTimelineWindow]);

  const handlePanEnd = useCallback(() => {
    setPanState(null);
  }, []);

  useEffect(() => {
    if (!panState) return;
    window.addEventListener('mousemove', handlePanMove);
    window.addEventListener('mouseup', handlePanEnd);
    return () => {
      window.removeEventListener('mousemove', handlePanMove);
      window.removeEventListener('mouseup', handlePanEnd);
    };
  }, [panState, handlePanMove, handlePanEnd]);

  const handleGanttWheel = useCallback((e: React.WheelEvent, leftPanelWidth: number) => {
    if (!e.ctrlKey && !e.metaKey) return;
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    if (e.clientX - rect.left < leftPanelWidth + 4) return;
    e.preventDefault();
    const tw = getTimelineWidthPx();
    if (!tw) return;
    const x = e.clientX - rect.left - leftPanelWidth - 4;
    const clampedX = Math.min(tw, Math.max(0, x));
    const spanMs = viewEnd.getTime() - viewStart.getTime();
    if (spanMs <= 0) return;
    const anchor = new Date(viewStart.getTime() + (clampedX / tw) * spanMs);
    const factor = e.deltaY > 0 ? 1 / 0.75 : 0.75;
    zoomTimeline(factor, anchor);
  }, [viewStart, viewEnd, getTimelineWidthPx, zoomTimeline]);

  const handleAutoZoom = useCallback((items: { start_date: string | null; end_date: string | null }[]) => {
    if (items.length === 0) return;
    const dates = items.flatMap(i => [
      i.start_date ? new Date(i.start_date).getTime() : Date.now(),
      i.end_date ? new Date(i.end_date).getTime() : Date.now(),
    ]).filter(d => !isNaN(d));
    if (dates.length === 0) return;
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const padding = Math.max(DAY_MS * 7, (maxDate - minDate) * 0.1);
    setTimelineWindow(new Date(minDate - padding), new Date(maxDate + padding));
  }, [setTimelineWindow]);

  return { handlePanStart, handleGanttWheel, handleAutoZoom, isPanning: panState !== null };
}
