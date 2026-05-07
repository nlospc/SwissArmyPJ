/**
 * Date formatting utilities for My Work feature
 */
/**
 * Format date to relative time string
 * Examples: "2 minutes ago", "3 hours ago", "yesterday", "2 days ago"
 */
export function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffSeconds < 60) {
        return 'just now';
    }
    if (diffMinutes < 60) {
        return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
    }
    if (diffHours < 24) {
        return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    }
    if (diffDays === 1) {
        return 'yesterday';
    }
    if (diffDays < 7) {
        return `${diffDays} days ago`;
    }
    // For older dates, show the actual date
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
}
/**
 * Format due date with overdue indicator
 * Examples:
 * - "Today"
 * - "Tomorrow"
 * - "Overdue by 3 days"
 * - "Due in 5 days"
 * - "Jan 15"
 */
export function formatDueDate(dueDateString) {
    if (!dueDateString) {
        return { text: 'No due date', isOverdue: false, isToday: false, isTomorrow: false };
    }
    const dueDate = new Date(dueDateString);
    const now = new Date();
    // Reset time to midnight for comparison
    const dueDateMidnight = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffMs = dueDateMidnight.getTime() - todayMidnight.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
        return { text: 'Today', isOverdue: false, isToday: true, isTomorrow: false };
    }
    if (diffDays === 1) {
        return { text: 'Tomorrow', isOverdue: false, isToday: false, isTomorrow: true };
    }
    if (diffDays < 0) {
        const overdueDays = Math.abs(diffDays);
        return {
            text: `Overdue by ${overdueDays} ${overdueDays === 1 ? 'day' : 'days'}`,
            isOverdue: true,
            isToday: false,
            isTomorrow: false,
        };
    }
    if (diffDays < 7) {
        return {
            text: `Due in ${diffDays} days`,
            isOverdue: false,
            isToday: false,
            isTomorrow: false,
        };
    }
    // For dates further out, show the actual date
    return {
        text: dueDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: dueDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        }),
        isOverdue: false,
        isToday: false,
        isTomorrow: false,
    };
}
/**
 * Check if a date is today
 */
export function isToday(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    return (date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear());
}
/**
 * Check if a task is overdue
 */
export function isOverdue(dueDateString) {
    if (!dueDateString)
        return false;
    const dueDate = new Date(dueDateString);
    const now = new Date();
    // Reset time to midnight for comparison
    const dueDateMidnight = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return dueDateMidnight.getTime() < todayMidnight.getTime();
}
/**
 * Format date for display
 * Examples: "Jan 15, 2024", "Today at 2:30 PM"
 */
export function formatDate(dateString, includeTime = false) {
    const date = new Date(dateString);
    if (isToday(dateString) && includeTime) {
        return `Today at ${date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
        })}`;
    }
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: includeTime ? 'numeric' : undefined,
        minute: includeTime ? '2-digit' : undefined,
    });
}
/**
 * Get week start date (Monday)
 */
export function getWeekStart(date = new Date()) {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    return new Date(date.getFullYear(), date.getMonth(), diff);
}
/**
 * Get week dates (Monday - Sunday)
 */
export function getWeekDates(date = new Date()) {
    const weekStart = getWeekStart(date);
    const dates = [];
    for (let i = 0; i < 7; i++) {
        const weekDate = new Date(weekStart);
        weekDate.setDate(weekStart.getDate() + i);
        dates.push(weekDate);
    }
    return dates;
}
/**
 * Format date range for display
 * Examples: "Jan 1 - Jan 7, 2024"
 */
export function formatDateRange(startDate, endDate) {
    const start = startDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
    const end = endDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
    return `${start} - ${end}`;
}
