/**
 * Gantt Chart Utilities
 */
/**
 * Get date range for a given view mode
 */
export function getDateRangeForView(viewMode, anchorDate = new Date()) {
    const start = new Date(anchorDate);
    const end = new Date(anchorDate);
    switch (viewMode) {
        case 'day':
            start.setDate(start.getDate() - 7);
            end.setDate(end.getDate() + 7);
            break;
        case 'week':
            start.setDate(start.getDate() - 21);
            end.setDate(end.getDate() + 21);
            break;
        case 'month':
            start.setMonth(start.getMonth() - 3);
            end.setMonth(end.getMonth() + 3);
            break;
        case 'quarter':
            start.setMonth(start.getMonth() - 6);
            end.setMonth(end.getMonth() + 12);
            break;
    }
    return { startDate: start, endDate: end };
}
/**
 * Calculate total days between two dates
 */
export function getTotalDays(range) {
    const timeDiff = range.endDate.getTime() - range.startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
}
/**
 * Check if a date falls on a weekend
 */
export function isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}
/**
 * Format date for display based on view mode
 */
export function formatDateForView(date, viewMode) {
    let options;
    switch (viewMode) {
        case 'day':
            options = { month: 'short', day: 'numeric', weekday: 'short' };
            break;
        case 'week':
            options = { month: 'short', day: 'numeric' };
            break;
        case 'month':
            options = { month: 'short', year: 'numeric' };
            break;
        case 'quarter':
            options = { month: 'short', year: 'numeric' };
            break;
        default:
            options = { month: 'short', year: 'numeric' };
    }
    return date.toLocaleDateString('en-US', options);
}
/**
 * Calculate position and width of a bar
 */
export function calculateBarMetrics(startDate, endDate, range, dayWidth) {
    const totalDays = getTotalDays(range);
    const startOffset = Math.max(0, (startDate.getTime() - range.startDate.getTime()) / (1000 * 3600 * 24));
    const duration = Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    return {
        left: startOffset * dayWidth,
        width: duration * dayWidth,
    };
}
/**
 * Generate date headers for the timeline
 */
export function generateDateHeaders(range, viewMode) {
    const headers = [];
    const totalDays = getTotalDays(range);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i <= totalDays; i++) {
        const date = new Date(range.startDate);
        date.setDate(date.getDate() + i);
        date.setHours(0, 0, 0, 0);
        headers.push({
            date,
            label: formatDateForView(date, viewMode),
            isToday: date.getTime() === today.getTime(),
            isWeekend: isWeekend(date),
        });
    }
    return headers;
}
/**
 * Get status color
 */
export function getStatusColor(status) {
    const colorMap = {
        done: '#52c41a',
        in_progress: '#1677ff',
        blocked: '#ff4d4f',
        not_started: '#d9d9d9',
        on_track: '#52c41a',
        at_risk: '#faad14',
        off_track: '#ff4d4f',
    };
    return colorMap[status] || '#d9d9d9';
}
/**
 * Parse date string or return default date
 */
export function parseDate(dateString) {
    if (!dateString)
        return new Date();
    return new Date(dateString);
}
/**
 * Format date to string
 */
export function formatDateString(date) {
    return date.toISOString().split('T')[0];
}
