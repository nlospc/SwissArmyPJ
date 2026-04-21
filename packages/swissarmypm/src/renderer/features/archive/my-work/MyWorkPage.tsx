/**
 * MyWorkPage - Main My Work feature page
 *
 * New layout:
 * - Header: Title and date
 * - Top row: 4 quick stats cards
 * - Main content: 12-column grid (8 cols tasks, 4 cols time tracker)
 */

import { useMyWorkInit } from '@/stores/useMyWorkStore';
import { TodoListContainer } from './components/TodoList/TodoListContainer';
import { StatsBar } from './components/QuickStats/StatsBar';
import { TrackerSidebar } from './components/TimeTracker/TrackerSidebar';

export function MyWorkPage() {
  // Initialize store on mount (fetches todos, stats, preferences, etc.)
  useMyWorkInit();

  return (
    <div className="flex flex-col h-full bg-theme-container">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold">My Work</h1>
        </div>
        <div className="flex items-center space-x-6 text-sm">
          <span className="text-gray-500">
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto p-6 space-y-6">
          {/* Quick Stats Cards Row */}
          <StatsBar />

          {/* Main Grid: Tasks (8 cols) + Time Tracker (4 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Task List - 8 columns */}
            <div className="lg:col-span-8">
              <TodoListContainer />
            </div>

            {/* Time Tracker - 4 columns */}
            <div className="lg:col-span-4">
              <TrackerSidebar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
