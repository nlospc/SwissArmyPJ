import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  App as AntApp,
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FilterOutlined,
  MoreOutlined,
  PlusOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { TimelineOptions } from 'vis-timeline';
import type { CreateWorkItemDTO, UpdateWorkItemDTO, WorkItem, Project } from '@/shared/types';
import {
  calculateWorkingDays,
  deriveRiskDelayState,
  nextStatusPatch,
  type TimelineScale,
} from '@/lib/timeline-workitems';
import {
  calculateDateRange,
  workItemsToGroups,
  workItemsToTimelineItems,
} from './timeline-adapter';
import { VisTimelineWrapper, type VisTimelineHandle, type VisTimelineItem } from './VisTimelineWrapper';

const { Text } = Typography;

type QuickDateFilter = 'all' | 'this_week' | 'this_month' | 'custom';

interface WorkItemExcelGanttProps {
  project: Project;
  workItems: WorkItem[];
  loading?: boolean;
  isSaving?: boolean;
  onBack?: () => void;
  onWorkItemUpdate?: (id: number, data: UpdateWorkItemDTO) => Promise<{ success: boolean; error?: string }>;
  onWorkItemCreate?: (data: CreateWorkItemDTO) => Promise<{ success: boolean; error?: string }>;
  onWorkItemDelete?: (id: number) => Promise<{ success: boolean; error?: string }>;
}

const STATUS_COLORS: Record<WorkItem['status'], string> = {
  not_started: 'default',
  in_progress: 'processing',
  done: 'success',
  blocked: 'error',
};

const TYPE_OPTIONS = [
  { label: 'Task', value: 'task' },
  { label: 'Milestone', value: 'milestone' },
  { label: 'Phase', value: 'phase' },
  { label: 'Issue', value: 'issue' },
  { label: 'Clash', value: 'clash' },
  { label: 'Remark', value: 'remark' },
];

const STATUS_OPTIONS = [
  { label: 'Not Started', value: 'not_started' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Blocked', value: 'blocked' },
  { label: 'Done', value: 'done' },
];

const PRIORITY_OPTIONS = [
  { label: 'Critical', value: 'critical' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
];

function csvEscape(value: unknown): string {
  const text = value == null ? '' : String(value);
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function getTimelineOptions(scale: TimelineScale, start: Date, end: Date): TimelineOptions {
  const base: TimelineOptions = {
    width: '100%',
    height: '100%',
    start,
    end,
    stack: true,
    showCurrentTime: true,
    orientation: 'top',
    editable: { updateTime: false, updateGroup: false, add: false, remove: false },
    zoomMin: 1000 * 60 * 60 * 24,
    zoomMax: 1000 * 60 * 60 * 24 * 31,
  };

  if (scale === 'day') {
    return { ...base, timeAxis: { scale: 'day', step: 1 } };
  }
  if (scale === 'week') {
    return { ...base, timeAxis: { scale: 'week', step: 1 } };
  }
  return { ...base, timeAxis: { scale: 'month', step: 1 } };
}

function zoomScale(current: TimelineScale, direction: 'in' | 'out'): TimelineScale {
  const order: TimelineScale[] = ['day', 'week', 'month'];
  const index = order.indexOf(current);
  const nextIndex = direction === 'in' ? Math.max(0, index - 1) : Math.min(order.length - 1, index + 1);
  return order[nextIndex];
}

export function WorkItemExcelGantt({
  project,
  workItems,
  loading = false,
  isSaving = false,
  onBack,
  onWorkItemUpdate,
  onWorkItemCreate,
  onWorkItemDelete,
}: WorkItemExcelGanttProps) {
  const { message } = AntApp.useApp();
  const [form] = Form.useForm();
  const timelineRef = useRef<VisTimelineHandle | null>(null);

  const [leftWidth, setLeftWidth] = useState(450);
  const [resizing, setResizing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [scale, setScale] = useState<TimelineScale>('week');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [ownerFilter, setOwnerFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<QuickDateFilter>('all');
  const [customRange, setCustomRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<WorkItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const ownerOptions = useMemo(() => {
    const owners = Array.from(new Set(workItems.map((item) => item.owner).filter(Boolean) as string[]));
    return owners.map((owner) => ({ label: owner, value: owner }));
  }, [workItems]);

  const filteredWorkItems = useMemo(() => {
    const now = dayjs();
    const weekStart = now.startOf('week');
    const weekEnd = now.endOf('week');
    const monthStart = now.startOf('month');
    const monthEnd = now.endOf('month');

    return workItems.filter((item) => {
      if (searchText.trim()) {
        const blob = `${item.title} ${item.notes || ''}`.toLowerCase();
        if (!blob.includes(searchText.trim().toLowerCase())) return false;
      }
      if (statusFilter.length > 0 && !statusFilter.includes(item.status)) return false;
      if (typeFilter.length > 0 && !typeFilter.includes(item.type)) return false;
      if (ownerFilter.length > 0 && !ownerFilter.includes(item.owner || '')) return false;
      if (priorityFilter.length > 0 && !priorityFilter.includes(item.priority || '')) return false;

      if (dateFilter === 'all') return true;
      const start = item.start_date ? dayjs(item.start_date) : null;
      const end = item.end_date ? dayjs(item.end_date) : start;
      if (!start && !end) return true;

      const itemStart = start || end;
      const itemEnd = end || start;
      if (!itemStart || !itemEnd) return true;

      if (dateFilter === 'this_week') {
        return itemEnd.isAfter(weekStart) && itemStart.isBefore(weekEnd);
      }
      if (dateFilter === 'this_month') {
        return itemEnd.isAfter(monthStart) && itemStart.isBefore(monthEnd);
      }
      if (dateFilter === 'custom' && customRange) {
        return itemEnd.isAfter(customRange[0]) && itemStart.isBefore(customRange[1]);
      }
      return true;
    });
  }, [workItems, searchText, statusFilter, typeFilter, ownerFilter, priorityFilter, dateFilter, customRange]);

  const hierarchyData = useMemo(() => {
    const byParent = new Map<number | null, WorkItem[]>();
    filteredWorkItems.forEach((item) => {
      const key = item.parent_id ?? null;
      const arr = byParent.get(key) || [];
      arr.push(item);
      byParent.set(key, arr);
    });

    const phases = (byParent.get(null) || []).filter((item) => item.type === 'phase');
    const roots = (byParent.get(null) || []).filter((item) => item.type !== 'phase');

    type TimelineTableRow = Omit<WorkItem, 'children'> & {
      key: string;
      children?: TimelineTableRow[];
    };
    const rows: TimelineTableRow[] = [];
    phases.forEach((phase) => {
      const children = (byParent.get(phase.id) || []).map((child) => {
        const { children: _existingChildren, ...childRow } = child;
        return { ...childRow, key: `wi-${child.id}` };
      });
      const { children: _existingChildren, ...phaseRow } = phase;
      rows.push({ ...phaseRow, key: `wi-${phase.id}`, children });
    });
    roots.forEach((root) => {
      const { children: _existingChildren, ...rootRow } = root;
      rows.push({ ...rootRow, key: `wi-${root.id}` });
    });
    return rows;
  }, [filteredWorkItems]);

  const timelineItems = useMemo(() => workItemsToTimelineItems(filteredWorkItems), [filteredWorkItems]);
  const timelineGroups = useMemo(() => workItemsToGroups(filteredWorkItems), [filteredWorkItems]);
  const dateRange = useMemo(() => calculateDateRange(filteredWorkItems), [filteredWorkItems]);
  const timelineOptions = useMemo(() => getTimelineOptions(scale, dateRange.start, dateRange.end), [scale, dateRange]);

  const handleResizeMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setResizing(true);
  }, []);

  useEffect(() => {
    if (!resizing) return undefined;
    const onMouseMove = (event: MouseEvent) => {
      setLeftWidth((prev) => Math.min(860, Math.max(360, prev + event.movementX)));
    };
    const onMouseUp = () => setResizing(false);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [resizing]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        const input = document.getElementById('gantt-search-input') as HTMLInputElement | null;
        input?.focus();
      }
      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        setScale((current) => zoomScale(current, 'in'));
      }
      if (event.key === '-') {
        event.preventDefault();
        setScale((current) => zoomScale(current, 'out'));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const openEditor = useCallback((item: WorkItem) => {
    setEditingItem(item);
    form.setFieldsValue({
      title: item.title,
      type: item.type,
      status: item.status,
      priority: item.priority || 'medium',
      owner: item.owner || undefined,
      notes: item.notes || undefined,
      dates: item.start_date ? [dayjs(item.start_date), item.end_date ? dayjs(item.end_date) : dayjs(item.start_date)] : undefined,
    });
    setModalVisible(true);
  }, [form]);

  const handleTimelineItemUpdate = useCallback(async (item: VisTimelineItem, callback: (item: VisTimelineItem | null) => void) => {
    callback(null);
    const workItem = filteredWorkItems.find((w) => w.id === Number(item.id));
    message.info(`Edit dates from the Work Item form${workItem ? `: ${workItem.title}` : ''}.`);
  }, [filteredWorkItems, message]);

  const handleStatusClick = useCallback(async (item: WorkItem) => {
    if (!onWorkItemUpdate) return;
    if (item.type === 'milestone') {
      message.info('Milestones use risk/delay review rather than the normal status toggle.');
      return;
    }

    const patch = nextStatusPatch(item);
    if (!patch) {
      message.info('Completed or blocked items need explicit editing before changing status again.');
      return;
    }

    const result = await onWorkItemUpdate(item.id, patch);
    if (!result.success) {
      message.error(result.error || 'Failed to update work item status');
      return;
    }
    message.success(patch.status === 'in_progress' ? 'Actual start date recorded' : 'Actual end date recorded');
  }, [message, onWorkItemUpdate]);

  const handleExportCsv = useCallback(() => {
    const headers = ['Name', 'Type', 'Start', 'End', 'Status', 'Owner', 'Priority'];
    const rows = filteredWorkItems.map((item) => [
      item.title,
      item.type,
      item.start_date || '',
      item.end_date || '',
      item.status,
      item.owner || '',
      item.priority || '',
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}-timeline.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [filteredWorkItems, project.name]);

  const onCreateClick = useCallback(() => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      type: 'task',
      status: 'not_started',
      priority: 'medium',
    });
    setModalVisible(true);
  }, [form]);

  const saveModal = useCallback(async () => {
    const values = await form.validateFields();
    const [start, end] = values.dates || [];
    const payload: UpdateWorkItemDTO = {
      title: values.title,
      type: values.type,
      status: values.status,
      priority: values.priority,
      owner: values.owner || undefined,
      notes: values.notes || undefined,
      start_date: start ? dayjs(start).format('YYYY-MM-DD') : undefined,
      end_date: end ? dayjs(end).format('YYYY-MM-DD') : undefined,
    };

    if (payload.start_date && payload.end_date && dayjs(payload.end_date).isBefore(dayjs(payload.start_date))) {
      message.warning('End date cannot be earlier than start date.');
      return;
    }

    if (editingItem && onWorkItemUpdate) {
      const result = await onWorkItemUpdate(editingItem.id, payload);
      if (!result.success) {
        message.error(result.error || 'Failed to update work item');
        return;
      }
      message.success('Work item updated');
    } else if (!editingItem && onWorkItemCreate) {
      const createPayload: CreateWorkItemDTO = {
        project_id: project.id,
        title: payload.title || 'Untitled',
        type: (payload.type as CreateWorkItemDTO['type']) || 'task',
        status: payload.status as CreateWorkItemDTO['status'],
        priority: payload.priority as CreateWorkItemDTO['priority'],
        owner: payload.owner,
        notes: payload.notes,
        start_date: payload.start_date,
        end_date: payload.end_date,
      };
      const result = await onWorkItemCreate(createPayload);
      if (!result.success) {
        message.error(result.error || 'Failed to create work item');
        return;
      }
      message.success('Work item created');
    }

    setModalVisible(false);
  }, [form, editingItem, onWorkItemUpdate, onWorkItemCreate, message, project.id]);

  const tableColumns: ColumnsType<WorkItem> = useMemo(() => [
    {
      title: 'Work Item',
      dataIndex: 'title',
      key: 'title',
      width: 260,
      render: (value: string, record) => {
        const risk = deriveRiskDelayState(record);
        return (
          <div className="min-w-0">
            <div className={record.type === 'phase' ? 'font-semibold text-slate-800' : 'font-medium text-slate-700'}>
              {value}
            </div>
            <div className="mt-1 flex items-center gap-1">
              <Tag className="m-0 uppercase text-[10px]">{record.type}</Tag>
              {risk.severity !== 'none' && (
                <Tag color={risk.severity === 'delay' ? 'error' : 'warning'} className="m-0 uppercase text-[10px]">
                  {risk.label}
                </Tag>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Planned',
      key: 'planned',
      width: 170,
      render: (_, record) => {
        const days = calculateWorkingDays(record.start_date, record.end_date || record.start_date);
        return (
          <div className="text-xs text-slate-600">
            <div>{record.start_date || '-'} {'->'} {record.end_date || record.start_date || '-'}</div>
            <div className="mt-1 text-slate-400">{days == null ? '-' : `${days} working days`}</div>
          </div>
        );
      },
    },
    {
      title: 'Actual',
      key: 'actual',
      width: 150,
      render: (_, record) => (
        <div className="text-xs text-slate-600">
          <div>Start: {record.actual_start_date || '-'}</div>
          <div className="mt-1">End: {record.actual_end_date || '-'}</div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (value: WorkItem['status'], record) => {
        const patch = nextStatusPatch(record);
        const disabled = record.type === 'milestone' || !patch || !onWorkItemUpdate;
        return (
          <Space direction="vertical" size={4}>
            <Tag color={STATUS_COLORS[value]} className="m-0 uppercase text-[10px] font-semibold">
              {value.replace('_', ' ')}
            </Tag>
            <Button size="small" disabled={disabled} onClick={(event) => {
              event.stopPropagation();
              void handleStatusClick(record);
            }}>
              {patch?.status === 'in_progress' ? 'Start' : patch?.status === 'done' ? 'Finish' : 'Review'}
            </Button>
          </Space>
        );
      },
    },
    {
      title: 'Owner',
      dataIndex: 'owner',
      key: 'owner',
      width: 130,
      render: (value: string | null) => <Text className="text-xs text-slate-600">{value || '-'}</Text>,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (value: WorkItem['priority']) => <Text className="text-xs text-slate-600 uppercase">{value || '-'}</Text>,
    },
  ], [handleStatusClick, onWorkItemUpdate]);

  return (
    <div data-sap-gantt-root className="flex h-full min-h-0 flex-col overflow-hidden bg-slate-50">
      <div className="h-14 px-5 bg-white border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={onBack}
            size="small"
            className="border-slate-300"
          />
          <Input
            id="gantt-search-input"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search tasks..."
            allowClear
            size="small"
            className="w-64"
          />
          <Select
            value={scale}
            onChange={(value) => setScale(value)}
            size="small"
            className="w-28"
            options={[
              { label: 'Day', value: 'day' },
              { label: 'Week', value: 'week' },
              { label: 'Month', value: 'month' },
            ]}
          />
          <Tooltip title="Status / Type / Owner / Priority / Date filters">
            <Space.Compact size="small">
              <Select
                mode="multiple"
                allowClear
                maxTagCount={1}
                placeholder="Status"
                value={statusFilter}
                onChange={setStatusFilter}
                options={STATUS_OPTIONS}
                className="w-28"
              />
              <Select
                mode="multiple"
                allowClear
                maxTagCount={1}
                placeholder="Type"
                value={typeFilter}
                onChange={setTypeFilter}
                options={TYPE_OPTIONS}
                className="w-24"
              />
              <Select
                mode="multiple"
                allowClear
                maxTagCount={1}
                placeholder="Owner"
                value={ownerFilter}
                onChange={setOwnerFilter}
                options={ownerOptions}
                className="w-28"
              />
              <Select
                mode="multiple"
                allowClear
                maxTagCount={1}
                placeholder="Priority"
                value={priorityFilter}
                onChange={setPriorityFilter}
                options={PRIORITY_OPTIONS}
                className="w-28"
              />
              <Select
                value={dateFilter}
                onChange={(value) => setDateFilter(value)}
                options={[
                  { label: 'All Dates', value: 'all' },
                  { label: 'This Week', value: 'this_week' },
                  { label: 'This Month', value: 'this_month' },
                  { label: 'Custom', value: 'custom' },
                ]}
                className="w-28"
              />
              {dateFilter === 'custom' && (
                <DatePicker.RangePicker
                  size="small"
                  value={customRange}
                  onChange={(range) => setCustomRange(range as [dayjs.Dayjs, dayjs.Dayjs] | null)}
                />
              )}
            </Space.Compact>
          </Tooltip>
        </div>

        <div className="flex items-center gap-2">
          <Button icon={<FilterOutlined />} size="small" onClick={() => {
            setStatusFilter([]);
            setTypeFilter([]);
            setOwnerFilter([]);
            setPriorityFilter([]);
            setDateFilter('all');
            setCustomRange(null);
          }}>
            Reset
          </Button>
          <Button icon={<ZoomOutOutlined />} size="small" onClick={() => setScale((current) => zoomScale(current, 'out'))} />
          <Button icon={<ZoomInOutlined />} size="small" onClick={() => setScale((current) => zoomScale(current, 'in'))} />
          <Button icon={<CalendarOutlined />} size="small" onClick={() => timelineRef.current?.moveTo(new Date())}>
            Today
          </Button>
          <Button icon={<DownloadOutlined />} size="small" onClick={handleExportCsv}>
            Export
          </Button>
          <Button type="primary" icon={<PlusOutlined />} size="small" onClick={onCreateClick}>
            Create Task
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div style={{ width: leftWidth }} className="min-h-0 bg-white border-r border-slate-200 overflow-hidden">
          <Table
            size="small"
            loading={loading}
            pagination={false}
            columns={tableColumns}
            dataSource={hierarchyData}
            rowKey="id"
            expandable={{ defaultExpandAllRows: true }}
            scroll={{ x: 900, y: 'calc(100vh - 330px)' }}
            onRow={(record) => ({
              onClick: () => setSelectedRowId(record.id),
              onDoubleClick: () => openEditor(record),
              className: selectedRowId === record.id ? 'gantt-row-selected' : 'gantt-row-hover',
            })}
          />
        </div>

        <div
          role="separator"
          className={`w-1 cursor-col-resize ${resizing ? 'bg-blue-600' : 'bg-slate-200 hover:bg-blue-500'} flex items-center justify-center`}
          onMouseDown={handleResizeMouseDown}
        >
          <div className="w-3 h-8 rounded-md border border-slate-300 bg-white shadow-sm flex items-center justify-center -ml-1">
            <MoreOutlined className="text-[10px] text-slate-500 rotate-90" />
          </div>
        </div>

        <div data-sap-gantt-timeline-pane className="min-h-0 flex-1 overflow-hidden bg-slate-50">
          <VisTimelineWrapper
            ref={timelineRef}
            className="professional-timeline"
            items={timelineItems}
            groups={timelineGroups}
            options={timelineOptions}
            onItemUpdate={handleTimelineItemUpdate}
            onItemDoubleClick={(item) => {
              const found = workItems.find((workItem) => workItem.id === Number(item.id));
              if (found) {
                setSelectedRowId(found.id);
                openEditor(found);
              }
            }}
            onSelect={(props) => {
              const id = Number(props.items?.[0]);
              if (!Number.isNaN(id)) setSelectedRowId(id);
            }}
          />
        </div>
      </div>

      <div className="h-8 px-6 bg-white border-t border-slate-200 text-[10px] text-slate-500 uppercase tracking-wider font-semibold flex items-center justify-between">
        <Space size={16}>
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 bg-blue-600 rounded-sm" /> Active</span>
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-sm" /> Done</span>
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 bg-amber-500 rounded-sm" /> At Risk</span>
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 bg-rose-500 rounded-sm" /> Blocked</span>
        </Space>
        <span>{isSaving ? 'Saving...' : 'Double-click rows to edit dates | Timeline blocks are read-only | +/- switches scale'}</span>
      </div>

      <Modal
        open={modalVisible}
        title={editingItem ? `Edit Item: ${editingItem.title}` : 'Create Work Item'}
        onCancel={() => setModalVisible(false)}
        onOk={saveModal}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Title is required' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select options={TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select options={STATUS_OPTIONS} />
          </Form.Item>
          <Form.Item name="priority" label="Priority">
            <Select options={PRIORITY_OPTIONS} allowClear />
          </Form.Item>
          <Form.Item name="owner" label="Owner">
            <Input allowClear />
          </Form.Item>
          <Form.Item name="dates" label="Timeline">
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} />
          </Form.Item>
          {editingItem && onWorkItemDelete && (
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={async () => {
                const result = await onWorkItemDelete(editingItem.id);
                if (!result.success) {
                  message.error(result.error || 'Failed to delete work item');
                  return;
                }
                message.success('Work item deleted');
                setModalVisible(false);
              }}
            >
              Delete Item
            </Button>
          )}
        </Form>
      </Modal>

      <style>{`
        .gantt-row-selected td {
          background: #eff6ff !important;
        }
        .gantt-row-hover:hover td {
          background: #f8fafc !important;
        }
        .professional-timeline .vis-time-axis .vis-grid.vis-vertical {
          border-left: 1px solid #e2e8f0 !important;
        }
        .professional-timeline .vis-panel.vis-top,
        .professional-timeline .vis-panel.vis-bottom {
          border-color: #e2e8f0 !important;
          background: #ffffff !important;
        }
        .professional-timeline .vis-labelset .vis-label {
          border-bottom: 1px solid #f1f5f9 !important;
          background: #ffffff !important;
        }
        .professional-timeline .vis-item {
          border-radius: 6px !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08) !important;
        }
        .professional-timeline .vis-item.timeline-task.status-done {
          background: #10b981 !important;
          border-color: #059669 !important;
          color: #ffffff !important;
        }
        .professional-timeline .vis-item.timeline-task.status-in_progress {
          background: #2563eb !important;
          border-color: #1d4ed8 !important;
          color: #ffffff !important;
        }
        .professional-timeline .vis-item.timeline-task.status-blocked,
        .professional-timeline .vis-item.timeline-issue.status-blocked,
        .professional-timeline .vis-item.timeline-clash {
          background: repeating-linear-gradient(45deg, #ef4444, #ef4444 8px, #dc2626 8px, #dc2626 16px) !important;
          border-color: #dc2626 !important;
          color: #ffffff !important;
        }
        .professional-timeline .vis-item.timeline-issue {
          background: #f59e0b !important;
          border-color: #d97706 !important;
          color: #ffffff !important;
        }
        .professional-timeline .vis-item.timeline-milestone .vis-dot {
          width: 13px !important;
          height: 13px !important;
          border-radius: 2px !important;
          transform: rotate(45deg) !important;
          border: 2px solid #ffffff !important;
          background: #7c3aed !important;
        }
        .professional-timeline .vis-item.timeline-phase {
          background: rgba(0, 0, 0, 0) !important;
          border-top: 2px solid #475569 !important;
          border-left: 2px solid #475569 !important;
          border-right: 2px solid #475569 !important;
          border-bottom: 0 !important;
          border-radius: 4px 4px 0 0 !important;
          height: 12px !important;
          margin-top: 8px !important;
        }
      `}</style>
    </div>
  );
}
