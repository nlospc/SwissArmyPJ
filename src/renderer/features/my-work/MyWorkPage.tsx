/**
 * MyWorkPage - Main My Work feature page
 *
 * Three-column layout:
 * - Left: Todo list with filters and grouping
 * - Center: Quick stats
 * - Right: Time tracker (Pomodoro + Today's Log)
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
      <div className="bg-theme-container border-b px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">My Work</h1>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Todo List - Left column */}
        <div className="flex-1 overflow-auto border-r bg-theme-container">
          <TodoListContainer />
        </div>

        {/* Right Sidebar - Time Tracker */}
        <div className="w-80 overflow-auto bg-theme-container">
          <TrackerSidebar />
        </div>
      </div>

      {/* Quick Stats Bar - Bottom */}
      <div className="bg-theme-container border-t">
        <StatsBar />
      </div>
    </div>
  );
}
