/**
 * PreferencesPanel - User settings for My Work feature
 */

import { useState, useEffect } from 'react';
import { useMyWorkStore, UserPreferences, GroupByOption, SortByOption } from '@/stores/useMyWorkStore';

interface PreferencesPanelProps {
  onClose?: () => void;
}

export function PreferencesPanel({ onClose }: PreferencesPanelProps) {
  const preferences = useMyWorkStore((state) => state.preferences);
  const updatePreferences = useMyWorkStore((state) => state.updatePreferences);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  
  // Local state for form
  const [localPrefs, setLocalPrefs] = useState<Partial<UserPreferences>>({});

  // Update local state when preferences load
  useEffect(() => {
    if (preferences) {
      setLocalPrefs(preferences);
    }
  }, [preferences]);

  // Handle input change
  const handleChange = (key: keyof UserPreferences, value: any) => {
    setLocalPrefs((prev) => ({ ...prev, [key]: value }));
  };

  // Handle save
  const handleSave = async () => {
    if (!preferences) return;
    
    setIsSaving(true);
    setSaveMessage(null);

    try {
      await updatePreferences(localPrefs);
      setSaveMessage('Settings saved successfully!');
      
      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle reset to defaults
  const handleReset = () => {
    const defaults: Partial<UserPreferences> = {
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
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500 dark:text-gray-400">Loading preferences...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          My Work Settings
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        )}
      </div>

      {/* Pomodoro Settings */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2">
          🍅 Pomodoro Timer
        </h3>

        <div className="grid grid-cols-2 gap-4">
          {/* Work Duration */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Work Duration (minutes)
            </label>
            <input
              type="number"
              min="1"
              max="120"
              value={localPrefs.pomodoroWorkDuration || 25}
              onChange={(e) => handleChange('pomodoroWorkDuration', parseInt(e.target.value) || 25)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Short Break */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Short Break (minutes)
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={localPrefs.pomodoroShortBreak || 5}
              onChange={(e) => handleChange('pomodoroShortBreak', parseInt(e.target.value) || 5)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Long Break */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Long Break (minutes)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={localPrefs.pomodoroLongBreak || 15}
              onChange={(e) => handleChange('pomodoroLongBreak', parseInt(e.target.value) || 15)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Sessions Before Long Break */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Work Sessions Before Long Break
            </label>
            <input
              type="number"
              min="2"
              max="10"
              value={localPrefs.pomodoroSessionsBeforeLong || 4}
              onChange={(e) => handleChange('pomodoroSessionsBeforeLong', parseInt(e.target.value) || 4)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Auto-start Breaks */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Auto-start Breaks
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Automatically start break after work session
            </p>
          </div>
          <button
            onClick={() => handleChange('autoStartBreaks', !localPrefs.autoStartBreaks)}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              ${localPrefs.autoStartBreaks 
                ? 'bg-blue-600' 
                : 'bg-gray-300 dark:bg-gray-600'
              }
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${localPrefs.autoStartBreaks ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        </div>
      </section>

      {/* Time Tracking Settings */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2">
          ⏱️ Time Tracking
        </h3>

        {/* Daily Time Target */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Daily Time Target (minutes)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="30"
              max="1440"
              step="30"
              value={localPrefs.dailyTimeTarget || 480}
              onChange={(e) => handleChange('dailyTimeTarget', parseInt(e.target.value) || 480)}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
              {
