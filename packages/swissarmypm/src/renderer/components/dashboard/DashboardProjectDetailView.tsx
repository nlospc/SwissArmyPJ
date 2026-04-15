import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Card, Input, Button, Table, Tag, Typography, Empty, Space,
  Tabs, Progress, Statistic, Row, Col, Divider, Select,
  Modal, Form, Dropdown,
} from 'antd';
import {
  CaretRightOutlined, CaretDownOutlined,
  UserOutlined, CalendarOutlined, FlagOutlined,
  ExclamationCircleOutlined, CheckCircleOutlined,
  ClockCircleOutlined, StopOutlined, PlusOutlined, MoreOutlined,
  EditOutlined, DeleteOutlined, CloseOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd';
import type { Project, WorkItem } from '@/shared/types';
import { useProjectStore } from '@/stores/useProjectStore';
import { useWorkItemStore } from '@/stores/useWorkItemStore';
import { usePortfolioStore } from '@/stores/usePortfolioStore';

const { Title } = Typography;

// ============================================================================
// Shared option sets
// ============================================================================

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'blocked',     label: 'Blocked' },
  { value: 'done',        label: 'Done' },
];

const TYPE_OPTIONS = [
  { value: 'task',      label: 'Task' },
  { value: 'issue',     label: 'Issue' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'phase',     label: 'Phase' },
  { value: 'remark',    label: 'Remark' },
  { value: 'clash',     label: 'Clash' },
];

const PRIORITY_OPTIONS = [
  { value: 'low',      label: 'Low' },
  { value: 'medium',   label: 'Medium' },
  { value: 'high',     label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const PRIORITY_COLORS: Record<string, string> = {
  low: 'default', medium: 'blue', high: 'orange', critical: 'red',
};

// ============================================================================
// Sponsor mapping (placeholder until sponsor field is added to DB)
// ============================================================================

const SPONSORS: Record<string, string> = {
  'ERP Migration': 'Lisa Park – VP Engineering',
  'Mobile App Development': 'James Wright – CTO',
  'Cloud Infrastructure Upgrade': 'Nina Patel – VP Infrastructure',
  'Security Compliance Initiative': 'Mark Torres – CISO',
};

function getSponsor(name: string): string {
  return SPONSORS[name] || 'TBD';
}

// ============================================================================
// Budget helpers (placeholder until budget fields are added to DB)
// ============================================================================

function getBudget(project: Project) {
  const hash = project.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const planned = Math.round((hash % 80 + 20) * 10000);
  const progressPct =
    project.status === 'done' ? 88 : project.status === 'blocked' ? 32 : 56;
  const spent = Math.round((planned * (progressPct + (hash % 12))) / 100);
  return { planned, spent, remaining: planned - spent };
}

// ============================================================================
// Risk derivation – pulls real data from work items
// ============================================================================

type RiskCategory = 'Technical' | 'Resource' | 'Schedule' | 'Budget' | 'External';
type Severity = 'High' | 'Medium' | 'Low';
type RiskStatus = 'Open' | 'Mitigating' | 'Resolved';

interface DerivedRisk {
  id: number;
  title: string;
  category: RiskCategory;
  impact: Severity;
  likelihood: Severity;
  status: RiskStatus;
  owner: string;
  notes: string;
}

function classifyCategory(item: WorkItem): RiskCategory {
  const blob = `${item.title} ${item.notes || ''}`.toLowerCase();
  if (blob.includes('budget') || blob.includes('cost') || blob.includes('pricing')) return 'Budget';
  if (blob.includes('vendor') || blob.includes('sla') || blob.includes('external')) return 'External';
  if (blob.includes('resource') || blob.includes('team') || blob.includes('consultant')) return 'Resource';
  if (blob.includes('schedule') || blob.includes('timeline') || blob.includes('deadline')) return 'Schedule';
  return 'Technical';
}

function classifyImpact(item: WorkItem): Severity {
  if (item.status === 'blocked' || item.type === 'clash') return 'High';
  const notes = (item.notes || '').toLowerCase();
  if (notes.includes('critical') || notes.includes('immediate')) return 'High';
  if (notes.includes('low') || notes.includes('minor')) return 'Low';
  return 'Medium';
}

function deriveRisks(workItems: WorkItem[], owner: string | null): DerivedRisk[] {
  const risks: DerivedRisk[] = [];
  const seen = new Set<number>();

  const push = (item: WorkItem) => {
    if (seen.has(item.id)) return;
    seen.add(item.id);
    risks.push({
      id: item.id,
      title: item.title,
      category: classifyCategory(item),
      impact: classifyImpact(item),
      likelihood: item.status === 'blocked' ? 'High' : 'Medium',
      status: item.status === 'done' ? 'Resolved' : item.status === 'blocked' ? 'Open' : 'Mitigating',
      owner: owner || 'Unassigned',
      notes: item.notes || '',
    });
  };

  const walk = (items: WorkItem[]) => {
    items.forEach((item) => {
      if (item.type === 'issue' || item.type === 'clash' || item.status === 'blocked') {
        push(item);
      }
      if (item.children) walk(item.children);
    });
  };

  walk(workItems);
  return risks;
}

// ============================================================================
// Shared UI helpers
// ============================================================================

const STATUS_CFG: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  done:        { color: 'success',    label: 'Done',        icon: <CheckCircleOutlined /> },
  in_progress: { color: 'processing', label: 'In Progress', icon: <ClockCircleOutlined /> },
  blocked:     { color: 'error',      label: 'Blocked',     icon: <StopOutlined /> },
  not_started: { color: 'default',    label: 'Not Started', icon: <FlagOutlined /> },
};

function StatusTag({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.not_started;
  return <Tag color={cfg.color}>{cfg.icon} {cfg.label}</Tag>;
}

const TYPE_COLORS: Record<string, string> = {
  task: 'blue', issue: 'red', milestone: 'purple',
  phase: 'green', remark: 'orange', clash: '#d9534f',
};

// ============================================================================
// Budget breakdown rows (deterministic from totals)
// ============================================================================

function budgetBreakdown(planned: number, spent: number) {
  const cats = [
    { key: 'dev',   category: 'Development',      pAll: 0.45, pSpent: 0.48 },
    { key: 'infra', category: 'Infrastructure',   pAll: 0.25, pSpent: 0.22 },
    { key: 'pm',    category: 'Management',       pAll: 0.15, pSpent: 0.18 },
    { key: 'other', category: 'Other / Reserve',  pAll: 0.15, pSpent: 0.12 },
  ];
  return cats.map((c) => {
    const allocated = Math.round(planned * c.pAll);
    const catSpent = Math.round(spent * c.pSpent);
    return {
      key: c.key,
      category: c.category,
      allocated,
      spent: catSpent,
      pct: allocated > 0 ? Math.min(Math.round((catSpent / allocated) * 100), 100) : 0,
    };
  });
}

// ============================================================================
// InlineEdit – click text to edit in place
// ============================================================================

function InlineEdit({
  value,
  onSave,
  type = 'text',
  placeholder = '—',
  options,
  multiline = false,
  renderDisplay,
}: {
  value: string | number | null | undefined;
  onSave: (v: any) => void;
  type?: 'text' | 'date' | 'select';
  placeholder?: string;
  options?: { value: any; label: string }[];
  multiline?: boolean;
  renderDisplay?: () => React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState<any>('');
  const cancelled = useRef(false);

  if (!editing) {
    let display: React.ReactNode;
    if (renderDisplay) {
      display = renderDisplay();
    } else if (type === 'select' && options) {
      display = options.find((o) => o.value === value)?.label || placeholder;
    } else {
      display = value != null && value !== '' ? String(value) : placeholder;
    }
    return (
      <span
        className="cursor-pointer hover:text-blue-500 transition-colors"
        onClick={() => { setVal(value ?? ''); cancelled.current = false; setEditing(true); }}
      >
        {display}
      </span>
    );
  }

  const done = (v?: any) => { onSave(v ?? val); setEditing(false); };
  const cancel = () => { cancelled.current = true; setEditing(false); };

  if (type === 'select' && options) {
    return (
      <Select
        value={val === '' || val == null ? undefined : val}
        size="small"
        options={options}
        allowClear
        defaultOpen
        onChange={(v) => done(v)}
        onDropdownVisibleChange={(visible) => { if (!visible) cancel(); }}
        style={{ width: '100%' }}
        getPopupContainer={(trigger) => trigger.parentElement!}
      />
    );
  }

  if (multiline) {
    return (
      <Input.TextArea
        value={val}
        autoFocus
        rows={2}
        size="small"
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => { if (!cancelled.current) done(); }}
        onKeyDown={(e) => { if (e.key === 'Escape') cancel(); }}
      />
    );
  }

  return (
    <Input
      value={val}
      autoFocus
      size="small"
      type={type}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => { if (!cancelled.current) done(); }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') cancel();
      }}
    />
  );
}

// ============================================================================
// DashboardProjectDetailView
// ============================================================================

interface DashboardProjectDetailViewProps {
  projectId: number | null;
  onClose: () => void;
}

export function DashboardProjectDetailView({ projectId, onClose }: DashboardProjectDetailViewProps) {
  const { projects, updateProject, deleteProject } = useProjectStore();
  const { workItemsByProject, loadWorkItemsByProject, createWorkItem, updateWorkItem, deleteWorkItem } = useWorkItemStore();
  const { portfolios, getPortfolioById } = usePortfolioStore();

  const [activeTab, setActiveTab] = useState('overview');

  // Work item modal
  const [addWorkItemOpen, setAddWorkItemOpen] = useState(false);
  const [workItemForm] = Form.useForm();

  // Inline row editing (work items table)
  const [editingRowKey, setEditingRowKey] = useState<string | null>(null);
  const [rowValues, setRowValues] = useState<Record<string, any>>({});

  const selectedProject = projectId ? projects.find((p) => p.id === projectId) : null;

  useEffect(() => {
    if (projectId) {
      loadWorkItemsByProject(projectId);
    }
  }, [projectId, loadWorkItemsByProject]);

  if (!selectedProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <Empty description="Select a project to view details" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }

  const workItems = workItemsByProject.get(selectedProject.id) || [];

  const flatWorkItems = useMemo(() => {
    const flatten = (items: WorkItem[], parentKey: string | null = null) => {
      const out: (WorkItem & { key: string })[] = [];
      items.forEach((item) => {
        const key = parentKey ? `${parentKey}-${item.id}` : `${item.id}`;
        out.push({ ...item, key });
        if (item.children?.length) out.push(...flatten(item.children, key));
      });
      return out;
    };
    return flatten(workItems);
  }, [workItems]);

  const saveProjectField = (updates: Record<string, any>) => {
    updateProject(selectedProject.id, updates);
  };

  const handleDeleteProject = () => {
    Modal.confirm({
      title: 'Delete Project',
      content: `Are you sure you want to delete "${selectedProject.name}"? All associated work items will also be removed.`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteProject(selectedProject.id);
        onClose();
      },
    });
  };

  const openAddWorkItem = (presetType: string = 'task') => {
    workItemForm.resetFields();
    workItemForm.setFieldsValue({ type: presetType, status: 'not_started' });
    setAddWorkItemOpen(true);
  };

  const handleAddWorkItem = async () => {
    try {
      await workItemForm.validateFields();
      const values = workItemForm.getFieldsValue();
      await createWorkItem({
        project_id: selectedProject.id,
        parent_id: values.parent_id || undefined,
        type: values.type,
        title: values.title,
        status: values.status || 'not_started',
        start_date: values.start_date || undefined,
        end_date: values.end_date || undefined,
        notes: values.notes || undefined,
        owner: values.owner || undefined,
        priority: values.priority || undefined,
      });
      workItemForm.resetFields();
      setAddWorkItemOpen(false);
      await loadWorkItemsByProject(selectedProject.id);
    } catch (_e) {
      // validation
    }
  };

  const handleDeleteWorkItem = (id: number) => {
    const item = flatWorkItems.find((wi) => wi.id === id);
    Modal.confirm({
      title: 'Delete Work Item',
      content: `Are you sure you want to delete "${item?.title || 'this item'}"?`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteWorkItem(id);
        await loadWorkItemsByProject(selectedProject.id);
      },
    });
  };

  const startEditRow = (record: WorkItem & { key: string }) => {
    setEditingRowKey(record.key);
    setRowValues({
      title: record.title,
      type: record.type,
      status: record.status,
      start_date: record.start_date || '',
      end_date: record.end_date || '',
      notes: record.notes || '',
      owner: record.owner || '',
      priority: record.priority || 'medium',
    });
  };

  const saveEditRow = async (record: WorkItem) => {
    if (!rowValues.title) return;
    await updateWorkItem(record.id, {
      title: rowValues.title,
      type: rowValues.type,
      status: rowValues.status,
      start_date: rowValues.start_date || undefined,
      end_date: rowValues.end_date || undefined,
      notes: rowValues.notes || undefined,
      owner: rowValues.owner || undefined,
      priority: rowValues.priority || undefined,
    });
    setEditingRowKey(null);
  };

  const cancelEditRow = () => setEditingRowKey(null);

  const risks = useMemo(
    () => deriveRisks(workItems, selectedProject.owner || null),
    [workItems, selectedProject]
  );

  const budget = useMemo(
    () => (selectedProject ? getBudget(selectedProject) : { planned: 0, spent: 0, remaining: 0 }),
    [selectedProject]
  );

  const stats = useMemo(() => {
    const total = flatWorkItems.length;
    const done = flatWorkItems.filter((i) => i.status === 'done').length;
    const blocked = flatWorkItems.filter((i) => i.status === 'blocked').length;
    const inProgress = flatWorkItems.filter((i) => i.status === 'in_progress').length;
    return { total, done, blocked, inProgress };
  }, [flatWorkItems]);

  const portfolioName = selectedProject.portfolio_id
    ? getPortfolioById(selectedProject.portfolio_id)?.name || `Portfolio #${selectedProject.portfolio_id}`
    : null;

  const workItemColumns: ColumnsType<WorkItem> = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: any) => {
        if (record.key === editingRowKey) {
          return (
            <Space style={{ width: '100%' }}>
              <Select
                value={rowValues.type}
                size="small"
                options={TYPE_OPTIONS}
                onChange={(v) => setRowValues((prev) => ({ ...prev, type: v }))}
                style={{ width: 100 }}
              />
              <Input
                value={rowValues.title}
                size="small"
                onChange={(e) => setRowValues((prev) => ({ ...prev, title: e.target.value }))}
                style={{ flex: 1 }}
              />
            </Space>
          );
        }
        return (
          <Space>
            <Tag color={TYPE_COLORS[record.type] || 'default'} style={{ margin: 0, fontSize: 11 }}>
              {record.type}
            </Tag>
            <span className={record.level === 2 ? 'text-sm text-theme-primary ml-2' : 'text-sm font-medium'}>
              {text}
            </span>
          </Space>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (s: string, record: any) => {
        if (record.key === editingRowKey) {
          return (
            <Select
              value={rowValues.status}
              size="small"
              options={STATUS_OPTIONS}
              onChange={(v) => setRowValues((prev) => ({ ...prev, status: v }))}
            />
          );
        }
        return <StatusTag status={s} />;
      },
    },
    {
      title: 'Start',
      dataIndex: 'start_date',
      key: 'start_date',
      width: 110,
      render: (d: string | null, record: any) => {
        if (record.key === editingRowKey) {
          return <Input type="date" value={rowValues.start_date} size="small" onChange={(e) => setRowValues((prev) => ({ ...prev, start_date: e.target.value }))} />;
        }
        return <span className="text-xs text-gray-500 dark:text-gray-400">{d || '—'}</span>;
      },
    },
    {
      title: 'End',
      dataIndex: 'end_date',
      key: 'end_date',
      width: 110,
      render: (d: string | null, record: any) => {
        if (record.key === editingRowKey) {
          return <Input type="date" value={rowValues.end_date} size="small" onChange={(e) => setRowValues((prev) => ({ ...prev, end_date: e.target.value }))} />;
        }
        return <span className="text-xs text-gray-500 dark:text-gray-400">{d || '—'}</span>;
      },
    },
    {
      title: 'Owner',
      dataIndex: 'owner',
      key: 'owner',
      width: 110,
      render: (o: string | null, record: any) => {
        if (record.key === editingRowKey) {
          return <Input value={rowValues.owner} size="small" placeholder="Assignee" onChange={(e) => setRowValues((prev) => ({ ...prev, owner: e.target.value }))} />;
        }
        return <span className="text-xs text-gray-500 dark:text-gray-400">{o || '—'}</span>;
      },
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 95,
      render: (p: string | null, record: any) => {
        if (record.key === editingRowKey) {
          return (
            <Select
              value={rowValues.priority}
              size="small"
              options={PRIORITY_OPTIONS}
              onChange={(v) => setRowValues((prev) => ({ ...prev, priority: v }))}
            />
          );
        }
        return p ? <Tag color={PRIORITY_COLORS[p] || 'default'} style={{ margin: 0, fontSize: 11 }}>{p}</Tag> : <span className="text-xs text-gray-400">—</span>;
      },
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (n: string | null, record: any) => {
        if (record.key === editingRowKey) {
          return <Input value={rowValues.notes} size="small" onChange={(e) => setRowValues((prev) => ({ ...prev, notes: e.target.value }))} />;
        }
        return <span className="text-xs text-gray-500 dark:text-gray-400">{n || '—'}</span>;
      },
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_: any, record: any) => {
        if (record.key === editingRowKey) {
          return (
            <Space size="small">
              <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => saveEditRow(record)} style={{ padding: 0, color: '#52c41a' }} />
              <Button type="link" size="small" icon={<CloseOutlined />} onClick={cancelEditRow} style={{ padding: 0, color: '#ff4d4f' }} />
            </Space>
          );
        }
        return (
          <Space size="small">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => startEditRow(record)} style={{ padding: 0 }} />
            <Button type="link" size="small" icon={<DeleteOutlined />} danger onClick={() => handleDeleteWorkItem(record.id)} style={{ padding: 0 }} />
          </Space>
        );
      },
    },
  ];

  const riskColumns: ColumnsType<DerivedRisk> = [
    {
      title: 'Risk',
      dataIndex: 'title',
      key: 'title',
      render: (t: string) => <span className="text-sm font-medium">{t}</span>,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (v: string) => {
        const map: Record<string, string> = { Technical: 'blue', Resource: 'orange', Schedule: 'purple', Budget: 'green', External: 'red' };
        return <Tag color={map[v] || 'default'}>{v}</Tag>;
      },
    },
    {
      title: 'Impact',
      dataIndex: 'impact',
      key: 'impact',
      width: 75,
      render: (v: string) => {
        const map: Record<string, string> = { High: 'red', Medium: 'orange', Low: 'green' };
        return <Tag color={map[v]}>{v}</Tag>;
      },
    },
    {
      title: 'Likelihood',
      dataIndex: 'likelihood',
      key: 'likelihood',
      width: 90,
      render: (v: string) => {
        const map: Record<string, string> = { High: 'red', Medium: 'orange', Low: 'green' };
        return <Tag color={map[v] || 'default'}>{v}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => {
        const map: Record<string, string> = { Open: 'error', Mitigating: 'warning', Resolved: 'success' };
        return <Tag color={map[v] || 'default'}>{v}</Tag>;
      },
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (n: string) => <span className="text-xs text-gray-500 dark:text-gray-400">{n || '—'}</span>,
    },
  ];

  const budgetBreakdownColumns: ColumnsType<ReturnType<typeof budgetBreakdown>[0]> = [
    { title: 'Category', dataIndex: 'category', key: 'category', render: (t: string) => <span className="text-sm font-medium">{t}</span> },
    { title: 'Allocated', dataIndex: 'allocated', key: 'allocated', width: 110, render: (v: number) => <span className="text-sm">${v.toLocaleString()}</span> },
    { title: 'Spent', dataIndex: 'spent', key: 'spent', width: 110, render: (v: number) => <span className="text-sm">${v.toLocaleString()}</span> },
    {
      title: '% Used',
      dataIndex: 'pct',
      key: 'pct',
      width: 110,
      render: (v: number) => <Progress percent={v} size="small" strokeColor={v > 90 ? '#ff4d4f' : v > 75 ? '#faad14' : '#52c41a'} showInfo />,
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <Title level={3} className="mb-0">{selectedProject.name}</Title>
              <InlineEdit
                value={selectedProject.status}
                type="select"
                options={STATUS_OPTIONS}
                onSave={(v) => saveProjectField({ status: v })}
                renderDisplay={() => <StatusTag status={selectedProject.status} />}
              />
            </div>
            <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
              {selectedProject.owner && (
                <span className="flex items-center gap-1"><UserOutlined /> {selectedProject.owner}</span>
              )}
              {selectedProject.start_date && (
                <span className="flex items-center gap-1">
                  <CalendarOutlined /> {selectedProject.start_date} → {selectedProject.end_date || '—'}
                </span>
              )}
              {portfolioName && (
                <span className="flex items-center gap-1"><FlagOutlined /> {portfolioName}</span>
              )}
            </div>
          </div>
          <Space>
            <Button size="small" icon={<PlusOutlined />} onClick={() => openAddWorkItem()}>Add Item</Button>
            <Dropdown
              menu={{
                items: [
                  { key: 'delete', icon: <DeleteOutlined />, label: 'Delete Project', danger: true, onClick: handleDeleteProject },
                ],
              }}
              trigger={['click']}
            >
              <Button size="small" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        </div>
      </div>

      {/* Tabbed content */}
      <div className="flex-1 overflow-y-auto">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="px-6"
          tabBarStyle={{ marginBottom: 12 }}
          items={[
            {
              key: 'overview',
              label: 'Overview',
              children: (
                <div className="space-y-4 pb-6">
                  <Row gutter={[16, 16]}>
                    <Col span={6}>
                      <Card styles={{ body: { padding: 16 } }}>
                        <Statistic title="Total Items" value={stats.total} prefix={<FlagOutlined style={{ color: '#1677ff' }} />} />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card styles={{ body: { padding: 16 } }}>
                        <Statistic title="Done" value={stats.done} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card styles={{ body: { padding: 16 } }}>
                        <Statistic title="In Progress" value={stats.inProgress} valueStyle={{ color: '#1677ff' }} prefix={<ClockCircleOutlined />} />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card styles={{ body: { padding: 16 } }}>
                        <Statistic title="Blocked" value={stats.blocked} valueStyle={{ color: '#ff4d4f' }} prefix={<StopOutlined />} />
                      </Card>
                    </Col>
                  </Row>

                  <Card title="Progress">
                    <Progress
                      percent={stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0}
                      strokeColor="#1677ff"
                      size={14}
                      showInfo
                    />
                    <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{stats.done} of {stats.total} items completed</span>
                    </div>
                  </Card>

                  <Card title="Project Details">
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold">Project Lead</div>
                        <div className="mt-0.5 flex items-center gap-1">
                          <UserOutlined className="text-gray-500 dark:text-gray-400" />
                          <InlineEdit
                            value={selectedProject.owner}
                            onSave={(v) => saveProjectField({ owner: v || undefined })}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold">Sponsor</div>
                        <div className="mt-0.5">{getSponsor(selectedProject.name)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold">Start Date</div>
                        <div className="mt-0.5">
                          <InlineEdit
                            value={selectedProject.start_date}
                            type="date"
                            onSave={(v) => saveProjectField({ start_date: v || undefined })}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold">Target End</div>
                        <div className="mt-0.5">
                          <InlineEdit
                            value={selectedProject.end_date}
                            type="date"
                            onSave={(v) => saveProjectField({ end_date: v || undefined })}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold">Portfolio</div>
                        <div className="mt-0.5">
                          <InlineEdit
                            value={selectedProject.portfolio_id}
                            type="select"
                            options={portfolios.map((p) => ({ value: p.id, label: p.name }))}
                            onSave={(v) => saveProjectField({ portfolio_id: v || undefined })}
                            renderDisplay={() => <>{portfolioName || '—'}</>}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold">Open Risks</div>
                        <div className="mt-0.5 flex items-center gap-2">
                          {(() => {
                            const open = risks.filter((r) => r.status !== 'Resolved').length;
                            const hasHigh = risks.some((r) => r.impact === 'High' && r.status === 'Open');
                            return (
                              <span className={[
                                'text-sm font-semibold',
                                open === 0 ? 'text-green-600' : hasHigh ? 'text-red-600' : 'text-amber-600',
                              ].join(' ')}>
                                {open} {open === 1 ? 'risk' : 'risks'}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    <Divider />
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold mb-1">Description</div>
                      <InlineEdit
                        value={selectedProject.description}
                        multiline
                        onSave={(v) => saveProjectField({ description: v || undefined })}
                      />
                    </div>

                    <Divider />
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold mb-1">Tags</div>
                      <InlineEdit
                        value={selectedProject.tags?.join(', ') || ''}
                        placeholder="tag1, tag2"
                        onSave={(v) => saveProjectField({ tags: v ? v.split(',').map((t: string) => t.trim()).filter(Boolean) : [] })}
                        renderDisplay={() => (
                          selectedProject.tags?.length ? (
                            <div className="flex gap-1.5 flex-wrap">
                              {selectedProject.tags.map((t) => <Tag key={t} style={{ margin: 0 }}>{t}</Tag>)}
                            </div>
                          ) : <span className="text-gray-500 dark:text-gray-400">tag1, tag2</span>
                        )}
                      />
                    </div>
                  </Card>
                </div>
              ),
            },
            {
              key: 'workitems',
              label: `Work Items (${flatWorkItems.length})`,
              children: (
                <div className="pb-6">
                  <Card extra={<Button size="small" icon={<PlusOutlined />} onClick={() => openAddWorkItem()}>Add</Button>}>
                    {flatWorkItems.length === 0 ? (
                      <Empty description="No work items for this project" />
                    ) : (
                      <Table
                        columns={workItemColumns}
                        dataSource={flatWorkItems}
                        pagination={false}
                        size="small"
                        expandable={{
                          defaultExpandAllRows: false,
                          expandIcon: ({ expanded, onExpand, record }) =>
                            record.children && record.children.length > 0 ? (
                              expanded
                                ? <CaretDownOutlined onClick={(e) => onExpand(record, e)} style={{ cursor: 'pointer' }} />
                                : <CaretRightOutlined onClick={(e) => onExpand(record, e)} style={{ cursor: 'pointer' }} />
                            ) : null,
                        }}
                      />
                    )}
                  </Card>
                </div>
              ),
            },
            {
              key: 'risks',
              label: `Risks (${risks.length})`,
              children: (
                <div className="pb-6 space-y-4">
                  <Row gutter={[16, 16]}>
                    <Col span={6}>
                      <Card styles={{ body: { padding: 16 }, header: { borderBottom: '2px solid #ff4d4f' } }}>
                        <Statistic title="High Impact" value={risks.filter((r) => r.impact === 'High').length} valueStyle={{ color: '#ff4d4f' }} prefix={<ExclamationCircleOutlined />} />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card styles={{ body: { padding: 16 }, header: { borderBottom: '2px solid #faad14' } }}>
                        <Statistic title="Medium Impact" value={risks.filter((r) => r.impact === 'Medium').length} valueStyle={{ color: '#faad14' }} prefix={<ExclamationCircleOutlined />} />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card styles={{ body: { padding: 16 }, header: { borderBottom: '2px solid #52c41a' } }}>
                        <Statistic title="Low Impact" value={risks.filter((r) => r.impact === 'Low').length} valueStyle={{ color: '#52c41a' }} prefix={<ExclamationCircleOutlined />} />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card styles={{ body: { padding: 16 }, header: { borderBottom: '2px solid #52c41a' } }}>
                        <Statistic title="Resolved" value={risks.filter((r) => r.status === 'Resolved').length} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} />
                      </Card>
                    </Col>
                  </Row>

                  <Card extra={<Button size="small" icon={<PlusOutlined />} onClick={() => openAddWorkItem('issue')}>Log Risk</Button>}>
                    {risks.length === 0 ? (
                      <Empty description="No risks identified — issues, clashes or blocked items will appear here" />
                    ) : (
                      <Table columns={riskColumns} dataSource={risks} rowKey="id" pagination={false} size="small" />
                    )}
                  </Card>
                </div>
              ),
            },
            {
              key: 'budget',
              label: 'Budget',
              children: (
                <div className="pb-6 space-y-4">
                  <Row gutter={[16, 16]}>
                    <Col span={8}>
                      <Card styles={{ body: { padding: 16 }, header: { borderBottom: '2px solid #1677ff' } }}>
                        <Statistic title="Planned Budget" value={`$${budget.planned.toLocaleString()}`} valueStyle={{ color: '#1677ff' }} />
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card styles={{ body: { padding: 16 }, header: { borderBottom: '2px solid #faad14' } }}>
                        <Statistic title="Spent" value={`$${budget.spent.toLocaleString()}`} valueStyle={{ color: '#faad14' }} />
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card styles={{ body: { padding: 16 }, header: { borderBottom: budget.remaining >= 0 ? '2px solid #52c41a' : '2px solid #ff4d4f' } }}>
                        <Statistic title="Remaining" value={`$${budget.remaining.toLocaleString()}`} valueStyle={{ color: budget.remaining >= 0 ? '#52c41a' : '#ff4d4f' }} />
                      </Card>
                    </Col>
                  </Row>

                  <Card title="Budget Utilization">
                    <Progress
                      percent={budget.planned > 0 ? Math.round((budget.spent / budget.planned) * 100) : 0}
                      strokeColor={
                        budget.planned > 0 && budget.spent / budget.planned > 0.9 ? '#ff4d4f' :
                        budget.planned > 0 && budget.spent / budget.planned > 0.75 ? '#faad14' : '#52c41a'
                      }
                      size={16}
                      showInfo
                    />
                    <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>${budget.spent.toLocaleString()} spent of ${budget.planned.toLocaleString()} planned</span>
                    </div>

                    <Divider />
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Breakdown by Category</div>
                    <Table
                      columns={budgetBreakdownColumns}
                      dataSource={budgetBreakdown(budget.planned, budget.spent)}
                      pagination={false}
                      size="small"
                    />
                  </Card>
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* ================================================== Add Work Item Modal */}
      <Modal
        open={addWorkItemOpen}
        onCancel={() => { workItemForm.resetFields(); setAddWorkItemOpen(false); }}
        title="Add Work Item"
        footer={[
          <Button key="cancel" onClick={() => { workItemForm.resetFields(); setAddWorkItemOpen(false); }}>Cancel</Button>,
          <Button key="submit" type="primary" onClick={handleAddWorkItem}>Add</Button>,
        ]}
        forceRender
      >
        <Form form={workItemForm} layout="vertical" size="small">
          <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Title is required' }]}>
            <Input placeholder="Work item title" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item name="type" label="Type" style={{ flex: 1 }} rules={[{ required: true }]}>
              <Select options={TYPE_OPTIONS} />
            </Form.Item>
            <Form.Item name="status" label="Status" style={{ flex: 1 }}>
              <Select options={STATUS_OPTIONS} />
            </Form.Item>
          </div>
          <Form.Item name="parent_id" label="Parent Item">
            <Select placeholder="Top-level parent (optional)" allowClear options={workItems.map((wi) => ({ value: wi.id, label: `${wi.type}: ${wi.title}` }))} />
          </Form.Item>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item name="owner" label="Owner" style={{ flex: 1 }}>
              <Input placeholder="Assignee name" />
            </Form.Item>
            <Form.Item name="priority" label="Priority" style={{ flex: 1 }}>
              <Select options={PRIORITY_OPTIONS} defaultValue="medium" />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item name="start_date" label="Start" style={{ flex: 1 }}>
              <Input type="date" />
            </Form.Item>
            <Form.Item name="end_date" label="End" style={{ flex: 1 }}>
              <Input type="date" />
            </Form.Item>
          </div>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Additional notes" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
