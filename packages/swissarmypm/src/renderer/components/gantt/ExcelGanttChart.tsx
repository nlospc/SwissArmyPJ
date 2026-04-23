import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
  Table, Tag, Button, Space, Input, Select, Tooltip, Modal, Form, 
  DatePicker, Typography, App as AntApp, theme, Row, Col 
} from 'antd';
import { 
  ReloadOutlined, PlusOutlined, MoreOutlined,
  CheckCircleFilled, ExclamationCircleFilled, StopFilled, ClockCircleOutlined,
  UserOutlined, SearchOutlined, ZoomInOutlined, ZoomOutOutlined,
  CalendarOutlined, DownloadOutlined, FolderOpenFilled, CaretRightOutlined, CaretDownOutlined
} from '@ant-design/icons';
import { 
  Search, Filter, Download, ZoomIn, ZoomOut, 
  Calendar, Plus, MoreVertical
} from 'lucide-react';
import dayjs from 'dayjs';
import { VisTimelineWrapper, type VisTimelineItem } from './VisTimelineWrapper';
import { 
  projectsToTimelineItems, 
  portfoliosToGroups,
  calculateDateRange,
  timelineItemToProjectUpdate
} from './timeline-adapter';
import type { Project, WorkItem, Portfolio } from '@/shared/types';
import type { TimelineOptions } from 'vis-timeline';

const { Title, Text } = Typography;

interface ExcelGanttChartProps {
  projects: Project[];
  portfolios: Portfolio[];
  loading?: boolean;
  onProjectClick?: (project: Project) => void;
  onProjectUpdate?: (projectId: number, updates: Partial<Project>) => void;
  viewMode?: 'year' | 'month' | 'day';
}

export function ExcelGanttChart({
  projects,
  portfolios,
  loading = false,
  onProjectClick,
  onProjectUpdate,
  viewMode: initialViewMode = 'month',
}: ExcelGanttChartProps) {
  const { message } = AntApp.useApp();
  
  // State
  const [searchText, setSearchText] = useState('');
  const [viewScale, setViewScale] = useState<'day' | 'week' | 'month'>(
    initialViewMode === 'day' ? 'day' : 'month'
  );
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [leftWidth, setLeftWidth] = useState(400);
  const [isDragging, setIsDragging] = useState(false);
  
  // Modal State
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectModalVisible, setProjectModalVisible] = useState(false);
  const [projectForm] = Form.useForm();

  // Process data for hierarchical table (Portfolios -> Projects)
  const hierarchicalData = useMemo(() => {
    const data: any[] = portfolios.map(pf => ({
      ...pf,
      id: pf.id,
      isPortfolio: true,
      key: `pf-${pf.id}`,
      name: pf.name,
      children: projects.filter(p => p.portfolio_id === pf.id).map(p => ({
        ...p,
        id: p.id,
        isPortfolio: false,
        key: `p-${p.id}`,
      }))
    }));

    const unassignedProjects = projects.filter(p => !p.portfolio_id);
    if (unassignedProjects.length > 0) {
      data.push({
        id: 'unassigned',
        name: 'Individual Projects',
        isPortfolio: true,
        key: 'pf-unassigned',
        children: unassignedProjects.map(p => ({
          ...p,
          id: p.id,
          isPortfolio: false,
          key: `p-${p.id}`,
        }))
      });
    }
    return data;
  }, [portfolios, projects]);

  const filteredData = useMemo(() => {
    if (!searchText) return hierarchicalData;
    const filterItems = (items: any[]): any[] => {
      return items.map(item => ({ ...item }))
        .filter(item => {
          const matches = item.name.toLowerCase().includes(searchText.toLowerCase());
          if (item.children) {
            item.children = filterItems(item.children);
            return matches || item.children.length > 0;
          }
          return matches;
        });
    };
    return filterItems(hierarchicalData);
  }, [hierarchicalData, searchText]);

  // Timeline Data
  const timelineItems = useMemo(() => projectsToTimelineItems(projects), [projects]);
  const timelineGroups = useMemo(() => portfoliosToGroups(portfolios), [portfolios]);
  const dateRange = useMemo(() => calculateDateRange(projects), [projects]);

  const timelineOptions: TimelineOptions = useMemo(() => ({
    height: '100%',
    width: '100%',
    stack: true,
    showCurrentTime: true,
    orientation: 'top',
    editable: { updateTime: true, updateGroup: true, add: false, remove: false },
    zoomMin: 1000 * 60 * 60 * 24 * 7,
    zoomMax: 1000 * 60 * 60 * 24 * 365 * 3,
    start: dateRange.start,
    end: dateRange.end,
  }), [dateRange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setLeftWidth(Math.max(200, Math.min(800, e.clientX - 64)));
    };
    const stop = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', stop);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', stop);
      };
    }
  }, [isDragging]);

  const handleOpenEdit = (project: Project) => {
    setEditingProject(project);
    projectForm.setFieldsValue({
      name: project.name,
      owner: project.owner || '',
      status: project.status,
      dates: project.start_date || project.end_date
        ? [dayjs(project.start_date), dayjs(project.end_date)]
        : null,
      description: project.description || '',
      tags: project.tags || [],
      portfolio_id: project.portfolio_id || null,
    });
    setProjectModalVisible(true);
  };

  const handleItemUpdate = (item: VisTimelineItem, callback: any) => {
    const project = projects.find(p => p.id === Number(item.id));
    if (project && onProjectUpdate) {
      const updates = timelineItemToProjectUpdate(item);
      onProjectUpdate(project.id, updates);
      message.success(`Updated: ${project.name}`);
      callback(item);
    } else {
      callback(null);
    }
  };

  const columns = [
    {
      title: 'Portfolio / Project',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: any) => (
        <Space size={record.isPortfolio ? 4 : 8} className="py-0.5">
          {record.isPortfolio ? (
            <FolderOpenFilled className="text-amber-500 text-xs" />
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-4" />
          )}
          <Text strong={record.isPortfolio} className={`${record.isPortfolio ? 'text-slate-700' : 'text-slate-900'} text-xs truncate`}>
            {name}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string, record: any) => record.isPortfolio ? null : (
        <Tag color={status === 'done' ? 'success' : status === 'blocked' ? 'error' : 'processing'} className="text-[9px] font-bold uppercase px-1.5 border-none">
          {status?.replace('_', ' ')}
        </Tag>
      )
    }
  ];

  return (
    <div className="h-full min-h-0 flex flex-col bg-white dark:bg-gray-950 ProfessionalGantt overflow-hidden">
      <div className="px-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between" style={{ height: 56 }}>
        <div className="flex items-center gap-4">
          <Input 
            placeholder="Search projects..." 
            prefix={<Search className="w-4 h-4 text-slate-400" />} 
            value={searchText} 
            onChange={e => setSearchText(e.target.value)} 
            className="w-48 rounded-md" 
            size="small" 
            allowClear 
          />
          <Space size="small">
            <Select 
              value={viewScale} 
              onChange={val => setViewScale(val as any)} 
              size="small" 
              style={{ width: 90 }} 
              options={[
                { label: 'Days', value: 'day' }, 
                { label: 'Weeks', value: 'week' }, 
                { label: 'Months', value: 'month' }
              ]} 
            />
          </Space>
        </div>
        <div className="flex items-center gap-2">
          <Button icon={<Calendar className="w-3.5 h-3.5" />} size="small">Today</Button>
          <Button icon={<Download className="w-3.5 h-3.5" />} size="small">Export</Button>
          <Button type="primary" icon={<Plus className="w-3.5 h-3.5" />} size="small" className="bg-blue-600">New Project</Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        <div style={{ width: `${leftWidth}px` }} className="shrink-0 border-r border-slate-200 flex flex-col bg-white overflow-hidden min-h-0">
          <Table
            columns={columns}
            dataSource={filteredData}
            pagination={false}
            size="small"
            expandable={{
              defaultExpandAllRows: true,
              expandIcon: ({ expanded, onExpand, record }) =>
                record.isPortfolio ? (
                  expanded ? <CaretDownOutlined className="text-[10px] mr-1" onClick={e => onExpand(record, e)} /> : <CaretRightOutlined className="text-[10px] mr-1" onClick={e => onExpand(record, e)} />
                ) : null
            }}
            scroll={{ y: 999 }}
            onRow={(record) => ({
              onClick: () => setSelectedRowId(record.id),
              onDoubleClick: () => !record.isPortfolio && onProjectClick?.(record as Project),
              className: `cursor-pointer transition-colors ${selectedRowId === record.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`
            })}
          />
        </div>

        <div className={`w-1 cursor-col-resize hover:bg-blue-500 z-50 flex items-center justify-center ${isDragging ? 'bg-blue-600' : 'bg-slate-200 dark:bg-gray-800'}`} onMouseDown={handleMouseDown}>
          <div className="w-3 h-6 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-full flex items-center justify-center -ml-1 shadow-sm"><MoreVertical className="w-2 h-2 text-slate-400" /></div>
        </div>

        <div className="flex-1 min-w-0 min-h-0 bg-slate-50 dark:bg-gray-950 overflow-hidden relative">
          <VisTimelineWrapper 
            className="professional-timeline"
            items={timelineItems} 
            groups={timelineGroups} 
            options={timelineOptions} 
            onItemUpdate={handleItemUpdate} 
            onItemDoubleClick={(item) => { 
              const p = projects.find(p => p.id === Number(item.id)); 
              if (p) handleOpenEdit(p); 
            }} 
          />
        </div>
      </div>

      <div className="px-6 border-t border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider" style={{ height: 32 }}>
        <Space size="large">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Done</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-blue-600" /> Active</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> At Risk</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-red-500" /> Blocked</div>
        </Space>
        <span>Double-click Project to Drill-down • Drag to Reschedule</span>
      </div>

      <Modal 
        title={`Edit: ${editingProject?.name}`} 
        open={projectModalVisible} 
        onOk={async () => {
          const values = await projectForm.validateFields();
          const [start, end] = values.dates || [null, null];
          onProjectUpdate?.(editingProject!.id, { 
            ...values, 
            start_date: start?.format('YYYY-MM-DD'), 
            end_date: end?.format('YYYY-MM-DD') 
          });
          setProjectModalVisible(false);
        }} 
        onCancel={() => setProjectModalVisible(false)} 
        okText="Save" 
        width={540} 
        destroyOnHidden
      >
        <Form form={projectForm} layout="vertical" size="small" className="pt-2">
          <Form.Item name="name" label="Project Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="Description"><Input.TextArea rows={3} /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="owner" label="Owner"><Input prefix={<UserOutlined />} /></Form.Item></Col>
            <Col span={12}><Form.Item name="status" label="Status"><Select options={[{label:'Done',value:'done'},{label:'In Progress',value:'in_progress'},{label:'Blocked',value:'blocked'}]} /></Form.Item></Col>
          </Row>
          <Form.Item name="dates" label="Schedules"><DatePicker.RangePicker style={{width:'100%'}} /></Form.Item>
          <Form.Item name="tags" label="Tags"><Select mode="tags" style={{width:'100%'}} /></Form.Item>
        </Form>
      </Modal>

      <style>{`
        .ProfessionalGantt .ant-table-thead > tr > th { background: #f8fafc !important; color: #64748b !important; font-size: 10px !important; text-transform: uppercase !important; letter-spacing: 0.05em !important; font-weight: 700 !important; border-bottom: 1px solid #e2e8f0 !important; }
        .dark .ProfessionalGantt .ant-table-thead > tr > th { background: #111827 !important; color: #94a3b8 !important; border-bottom: 1px solid #1f2937 !important; }
        .professional-timeline .vis-group { background-color: #f8fafc !important; border-bottom: 1px solid #e2e8f0 !important; font-weight: 700 !important; font-size: 10px !important; color: #475569 !important; text-transform: uppercase !important; }
        .dark .professional-timeline .vis-group { background-color: #111827 !important; border-bottom: 1px solid #1f2937 !important; color: #94a3b8 !important; }
        .professional-timeline .vis-item { border-radius: 4px !important; border-width: 1px !important; font-size: 10px !important; font-weight: 600 !important; }
        .professional-timeline .vis-item { visibility: visible !important; }
        .professional-timeline .vis-time-axis .vis-text { visibility: visible !important; }
        .professional-timeline .vis-item.timeline-project { background-color: #eff6ff !important; border-color: #bfdbfe !important; color: #1d4ed8 !important; }
        .professional-timeline .vis-item.status-done { background-color: #ecfdf5 !important; border-color: #a7f3d0 !important; color: #065f46 !important; }
      `}</style>
    </div>
  );
}
