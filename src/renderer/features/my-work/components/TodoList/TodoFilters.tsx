/**
 * TodoFilters - Group/sort/filter controls for todo list
 */

import { SlidersHorizontal } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
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
    <div className="flex items-center gap-3 px-6 py-4 border-b bg-white flex-wrap">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <SlidersHorizontal className="h-4 w-4" />
        <span>View:</span>
      </div>

      {/* Group By */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground">Group:</label>
        <Select value={groupBy} onValueChange={(value) => updateGrouping(value as GroupByOption)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="project">By Project</SelectItem>
              <SelectItem value="due_date">By Due Date</SelectItem>
              <SelectItem value="priority">By Priority</SelectItem>
              <SelectItem value="status">By Status</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Sort By */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground">Sort:</label>
        <Select value={sortBy} onValueChange={(value) => updateSorting(value as SortByOption)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="due_date">Due Date</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="created">Recently Created</SelectItem>
              <SelectItem value="estimated_time">Estimated Time</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground">Filter:</label>
        <Select value={filterStatus} onValueChange={(value) => updateFilter(value as FilterOption)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="today">Due Today</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Refresh Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => useMyWorkStore.getState().fetchTodos(true)}
        className="ml-auto"
      >
        Refresh
      </Button>
    </div>
  );
}
