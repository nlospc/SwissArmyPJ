import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Timeline Context Provider
 * Manages global timeline state for Gantt charts
 */
import { createContext, useContext, useState, useCallback } from 'react';
const TimelineContext = createContext(null);
const DEFAULT_COLUMN_WIDTHS = {
    day: 40, // 40px per day
    week: 200, // 200px per week
    month: 400, // 400px per month
    quarter: 800, // 800px per quarter
};
export function TimelineProvider({ children, initialScale = 'month', initialStart, initialEnd, }) {
    const [config, setConfig] = useState(() => ({
        scale: initialScale,
        viewStart: initialStart || dayjs().startOf('month').subtract(1, 'week'),
        viewEnd: initialEnd || dayjs().endOf('month').add(1, 'week'),
        columnWidth: DEFAULT_COLUMN_WIDTHS[initialScale],
        showWeekends: true,
        showDependencies: false,
    }));
    const setScale = useCallback((scale) => {
        setConfig((prev) => ({
            ...prev,
            scale,
            columnWidth: DEFAULT_COLUMN_WIDTHS[scale],
        }));
    }, []);
    const setDateRange = useCallback((start, end) => {
        setConfig((prev) => ({
            ...prev,
            viewStart: start,
            viewEnd: end,
        }));
    }, []);
    const zoomIn = useCallback(() => {
        setConfig((prev) => {
            const scales = ['quarter', 'month', 'week', 'day'];
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
            const scales = ['day', 'week', 'month', 'quarter'];
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
    const value = {
        ...config,
        setScale,
        setDateRange,
        zoomIn,
        zoomOut,
        panLeft,
        panRight,
        goToday,
    };
    return (_jsx(TimelineContext.Provider, { value: value, children: children }));
}
export function useTimeline() {
    const context = useContext(TimelineContext);
    if (!context) {
        throw new Error('useTimeline must be used within TimelineProvider');
    }
    return context;
}
