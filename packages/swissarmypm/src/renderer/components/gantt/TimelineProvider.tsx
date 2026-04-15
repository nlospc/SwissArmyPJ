/**
 * Timeline Context Provider
 * Manages global timeline state for Gantt charts
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Dayjs } from 'dayjs';

export type TimeScale = 'day' | 'week' | 'month' | 'quarter';

export interface TimelineViewConfig {
  scale: TimeScale;
  viewStart: Dayjs;
  viewEnd: Dayjs;
  columnWidth: number; // Pixels per time unit
  showWeekends: boolean;
  showDependencies: boolean;
}

export interface TimelineState extends TimelineViewConfig {
  setScale: (scale: TimeScale) => void;
  setDateRange: (start: Dayjs, end: Dayjs) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  panLeft: () => void;
  panRight: () => void;
  goToday: () => void;
}

const TimelineContext = createContext<TimelineState | null>(null);

const DEFAULT_COLUMN_WIDTHS: Record<TimeScale, number> = {
  day: 40,      // 40px per day
  week: 200,    // 200px per week
  month: 400,   // 400px per month
  quarter: 800, // 800px per quarter
};

interface TimelineProviderProps {
  children: ReactNode;
  initialScale?: TimeScale;
  initialStart?: Dayjs;
  initialEnd?: Dayjs;
}

export function TimelineProvider({
  children,
  initialScale = 'month',
  initialStart,
  initialEnd,
}: TimelineProviderProps) {
  const [config, setConfig] = useState<TimelineViewConfig>(() => ({
    scale: initialScale,
    viewStart: initialStart || dayjs().startOf('month').subtract(1, 'week'),
    viewEnd: initialEnd || dayjs().endOf('month').add(1, 'week'),
    columnWidth: DEFAULT_COLUMN_WIDTHS[initialScale],
    showWeekends: true,
    showDependencies: false,
  }));

  const setScale = useCallback((scale: TimeScale) => {
    setConfig((prev) => ({
      ...prev,
      scale,
      columnWidth: DEFAULT_COLUMN_WIDTHS[scale],
    }));
  }, []);

  const setDateRange = useCallback((start: Dayjs, end: Dayjs) => {
    setConfig((prev) => ({
      ...prev,
      viewStart: start,
      viewEnd: end,
    }));
  }, []);

  const zoomIn = useCallback(() => {
    setConfig((prev) => {
      const scales: TimeScale[] = ['quarter', 'month', 'week', 'day'];
      const currentIndex = scales.indexOf(prev.scale);
      if (currentIndex < scales.length - 1) {
        return {
          ...prev,
          scale: scales[currentIndex + 1],
          columnWidth: DEFAULT_COLUMN_WIDTHS[scales[currentIndex + 1]],
        };
      }
      return prev;
    });
  }, []);

  const zoomOut = useCallback(() => {
    setConfig((prev) => {
      const scales: TimeScale[] = ['day', 'week', 'month', 'quarter'];
      const currentIndex = scales.indexOf(prev.scale);
      if (currentIndex < scales.length - 1) {
        return {
          ...prev,
          scale: scales[currentIndex + 1],
          columnWidth: DEFAULT_COLUMN_WIDTHS[scales[currentIndex + 1]],
        };
      }
      return prev;
    });
  }, []);

  const panLeft = useCallback(() => {
    setConfig((prev) => {
      const duration = prev.viewEnd.diff(prev.viewStart, 'day');
      return {
        ...prev,
        viewStart: prev.viewStart.subtract(duration / 4, 'day'),
        viewEnd: prev.viewEnd.subtract(duration / 4, 'day'),
      };
    });
  }, []);

  const panRight = useCallback(() => {
    setConfig((prev) => {
      const duration = prev.viewEnd.diff(prev.viewStart, 'day');
      return {
        ...prev,
        viewStart: prev.viewStart.add(duration / 4, 'day'),
        viewEnd: prev.viewEnd.add(duration / 4, 'day'),
      };
    });
  }, []);

  const goToday = useCallback(() => {
    setConfig((prev) => {
      const duration = prev.viewEnd.diff(prev.viewStart, 'day');
      const today = dayjs();
      return {
        ...prev,
        viewStart: today.subtract(duration / 2, 'day'),
        viewEnd: today.add(duration / 2, 'day'),
      };
    });
  }, []);

  const value: TimelineState = {
    ...config,
    setScale,
    setDateRange,
    zoomIn,
    zoomOut,
    panLeft,
    panRight,
    goToday,
  };

  return (
    <TimelineContext.Provider value={value}>
      {children}
    </TimelineContext.Provider>
  );
}

export function useTimeline(): TimelineState {
  const context = useContext(TimelineContext);
  if (!context) {
    throw new Error('useTimeline must be used within TimelineProvider');
  }
  return context;
}
