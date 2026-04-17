/**
 * TodoFilters - Group/sort/filter controls for todo list
 */

import { SlidersHorizontal } from 'lucide-react';
import { Select, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useMyWorkStore } from '@/stores/useMyWorkStore';
import type { GroupByOption, SortByOption, FilterOption } from '@/stores/useMyWorkStore';

export function TodoFilters() {
  const groupBy = useMyWorkStore((state) => state.groupBy);
  const sortBy = useMyWorkStore((state) => state.sortBy);
  const filterStatus = useMyWorkStore((state) => state.filterStatus);
  const updateGrouping = useMyWorkStore((state) => state.updateGrouping);
  const updateSorting = useMyWorkStore((state) => state.updateSorting);
  const updateFilter = useMyWorkStore((state) => state.updateFilter);

  return (
    <div className="flex items-center gap-3 px-6 py-4 border-b bg-theme-container flex-wrap">
      <div className="flex items-center gap-2 text-sm text-theme-secondary">
        <SlidersHorizontal className="h-4 w-4" />
        <span>View:</span>
      </div>

      {/* Group By */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-theme-secondary">Group:</label>
        <Select
          value={groupBy}
          onChange={(value) => updateGrouping(value as GroupByOption)}
          style={{ width: 140 }}
          options={[
            { value: 'project', label: 'By Project' },
            { value: 'due_date', label: 'By Due Date' },
            { value: 'priority', label: 'By Priority' },
            { value: 'status', label: 'By Status' },
          ]}
        />
      </div>

      {/* Sort By */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-theme-secondary">Sort:</label>
        <Select
          value={sortBy}
          onChange={(value) => updateSorting(value as SortByOption)}
          style={{ width: 140 }}
          options={[
            { value: 'due_date', label: 'Due Date' },
            { value: 'priority', label: 'Priority' },
            { value: 'created', label: 'Recently Created' },
            { value: 'estimated_time', label: 'Estimated Time' },
          ]}
        />
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-theme-secondary">Filter:</label>
        <Select
          value={filterStatus}
          onChange={(value) => updateFilter(value as FilterOption)}
          style={{ width: 120 }}
          options={[
            { value: 'all', label: 'All Tasks' },
            { value: 'active', label: 'Active Only' },
            { value: 'overdue', label: 'Overdue' },
            { value: 'today', label: 'Due Today' },
          ]}
        />
      </div>

      {/* Refresh Button */}
      <Button
        size="small"
        icon={<ReloadOutlined />}
        className="ml-auto"
        onClick={() => useMyWorkStore.getState().fetchTodos(true)}
      >
        Refresh
      </Button>
    </div>
  );
}
