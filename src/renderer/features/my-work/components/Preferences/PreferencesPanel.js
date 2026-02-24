import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * PreferencesPanel - User settings for My Work feature
 */
import { useState, useEffect } from 'react';
import { useMyWorkStore } from '@/stores/useMyWorkStore';
export function PreferencesPanel({ onClose }) {
    const preferences = useMyWorkStore((state) => state.preferences);
    const updatePreferences = useMyWorkStore((state) => state.updatePreferences);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState(null);
    // Local state for form
    const [localPrefs, setLocalPrefs] = useState({});
    // Update local state when preferences load
    useEffect(() => {
        if (preferences) {
            setLocalPrefs(preferences);
        }
    }, [preferences]);
    // Handle input change
    const handleChange = (key, value) => {
        setLocalPrefs((prev) => ({ ...prev, [key]: value }));
    };
    // Handle save
    const handleSave = async () => {
        if (!preferences)
            return;
        setIsSaving(true);
        setSaveMessage(null);
        try {
            await updatePreferences(localPrefs);
            setSaveMessage('Settings saved successfully!');
            // Clear message after 3 seconds
            setTimeout(() => setSaveMessage(null), 3000);
        }
        catch (error) {
            setSaveMessage('Failed to save settings. Please try again.');
        }
        finally {
            setIsSaving(false);
        }
    };
    // Handle reset to defaults
    const handleReset = () => {
        const defaults = {
            pomodoroWorkDuration: 25,
            pomodoroShortBreak: 5,
            pomodoroLongBreak: 15,
            pomodoroSessionsBeforeLong: 4,
            dailyTimeTarget: 480, // 8 hours
            enableDesktopNotifications: true,
            notificationSound: true,
            autoStartBreaks: false,
            defaultGroupBy: 'project',
            defaultSortBy: 'due_date',
            showCompletedTasks: false,
        };
        setLocalPrefs(defaults);
    };
    if (!preferences) {
        return (_jsx("div", { className: "flex items-center justify-center p-8", children: _jsx("div", { className: "text-gray-500 dark:text-gray-400", children: "Loading preferences..." }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-gray-100", children: "My Work Settings" }), onClose && (_jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300", children: "\u2715" }))] }), _jsxs("section", { className: "space-y-4", children: [_jsx("h3", { className: "text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2", children: "\uD83C\uDF45 Pomodoro Timer" }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1", children: "Work Duration (minutes)" }), _jsx("input", { type: "number", min: "1", max: "120", value: localPrefs.pomodoroWorkDuration || 25, onChange: (e) => handleChange('pomodoroWorkDuration', parseInt(e.target.value) || 25), className: "w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1", children: "Short Break (minutes)" }), _jsx("input", { type: "number", min: "1", max: "30", value: localPrefs.pomodoroShortBreak || 5, onChange: (e) => handleChange('pomodoroShortBreak', parseInt(e.target.value) || 5), className: "w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1", children: "Long Break (minutes)" }), _jsx("input", { type: "number", min: "1", max: "60", value: localPrefs.pomodoroLongBreak || 15, onChange: (e) => handleChange('pomodoroLongBreak', parseInt(e.target.value) || 15), className: "w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1", children: "Work Sessions Before Long Break" }), _jsx("input", { type: "number", min: "2", max: "10", value: localPrefs.pomodoroSessionsBeforeLong || 4, onChange: (e) => handleChange('pomodoroSessionsBeforeLong', parseInt(e.target.value) || 4), className: "w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-700 dark:text-gray-300", children: "Auto-start Breaks" }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: "Automatically start break after work session" })] }), _jsx("button", { onClick: () => handleChange('autoStartBreaks', !localPrefs.autoStartBreaks), className: `
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              ${localPrefs.autoStartBreaks
                                    ? 'bg-blue-600'
                                    : 'bg-gray-300 dark:bg-gray-600'}
            `, children: _jsx("span", { className: `
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${localPrefs.autoStartBreaks ? 'translate-x-6' : 'translate-x-1'}
              ` }) })] })] }), _jsxs("section", { className: "space-y-4", children: [_jsx("h3", { className: "text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2", children: "\u23F1\uFE0F Time Tracking" }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1", children: "Daily Time Target (minutes)" }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("input", { type: "number", min: "30", max: "1440", step: "30", value: localPrefs.dailyTimeTarget || 480, onChange: (e) => handleChange('dailyTimeTarget', parseInt(e.target.value) || 480), className: "flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent" }), _jsx("span", { className: "text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap", children: `${Math.round(((localPrefs.dailyTimeTarget || 480) / 60) * 10) / 10}h / day` })] })] })] })] }));
}
