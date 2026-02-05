import React, { useState, useMemo } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useWorkItemStore } from '@/stores/useWorkItemStore';
import { usePortfolioStore } from '@/stores/usePortfolioStore';
import { useUIStore } from '@/stores/useUIStore';
import {
  Card, Input, Button, Table, Tag, Typography, Empty, Space,
  Tabs, Progress, Statistic, Row, Col, Divider, Select,
} from 'antd';
import {
  CaretRightOutlined, CaretDownOutlined, SearchOutlined,
  UserOutlined, CalendarOutlined, FlagOutlined,
  ExclamationCircleOutlined, CheckCircleOutlined,
  ClockCircleOutlined, StopOutlined, PlusOutlined, MoreOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd';
import type { Project, WorkItem } from '@/shared/types';

const { Title, Text, Paragraph } = Typography;

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
// Deterministic per project so values are stable across renders.
// ============================================================================

function getBudget(project: Project) {
  const hash = project.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const planned = Math.round((hash % 80 + 20) * 10000); // $200 k – $1 M
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

const STATUS_DOT: Record<string, string> = {
  done: '#52c41a', in_progress: '#1677ff', blocked: '#ff4d4f', not_started: '#d9d9d9',
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
// ProjectsPage
// ============================================================================

export function ProjectsPage() {
  const { projects } = useProjectStore();
  const { workItemsByProject, loadWorkItemsByProject } = useWorkItemStore();
  const { getPortfolioById } = usePortfolioStore();
  const { selectedProjectId, setSelectedProjectId } = useUIStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');

  // --------------------------------------------------------
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const filteredProjects = useMemo(() =>
    projects.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchQ = p.name.toLowerCase().includes(q) ||
        (p.owner || '').toLowerCase().includes(q);
      const matchS = statusFilter === 'all' || p.status === statusFilter;
      return matchQ && matchS;
    }),
    [projects, searchQuery, statusFilter]
  );

  const handleSelect = async (project: Project) => {
    setSelectedProjectId(project.id);
    setActiveTab('overview');
    await loadWorkItemsByProject(project.id);
  };

  // --------------------------------------------------------
  // Flatten work-item tree for antd expandable Table
  // --------------------------------------------------------

  const workItems = selectedProjectId ? workItemsByProject.get(selectedProjectId) || [] : [];

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

  // --------------------------------------------------------
  // Derived metrics
  // --------------------------------------------------------

  const risks = useMemo(
    () => deriveRisks(workItems, selectedProject?.owner || null),
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

  const portfolioName = selectedProject?.portfolio_id
    ? getPortfolioById(selectedProject.portfolio_id)?.name || `Portfolio #${selectedProject.portfolio_id}`
    : null;

  // --------------------------------------------------------
  // Column definitions
  // --------------------------------------------------------

  const workItemColumns: ColumnsType<WorkItem> = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: WorkItem) => (
        <Space>
          <Tag color={TYPE_COLORS[record.type] || 'default'} style={{ margin: 0, fontSize: 11 }}>
            {record.type}
          </Tag>
          <span className={record.level === 2 ? 'text-sm text-gray-600 ml-2' : 'text-sm font-medium'}>
            {text}
          </span>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (s: string) => <StatusTag status={s} />,
    },
    {
      title: 'Start',
      dataIndex: 'start_date',
      key: 'start_date',
      width: 100,
      render: (d: string | null) => <span className="text-xs text-gray-500">{d || '—'}</span>,
    },
    {
      title: 'End',
      dataIndex: 'end_date',
      key: 'end_date',
      width: 100,
      render: (d: string | null) => <span className="text-xs text-gray-500">{d || '—'}</span>,
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (n: string | null) => <span className="text-xs text-gray-500">{n || '—'}</span>,
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
        return <Tag color={map[v]}>{v}</Tag>;
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
      render: (n: string) => <span className="text-xs text-gray-500">{n || '—'}</span>,
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

  // --------------------------------------------------------
  // Render
  // --------------------------------------------------------

  return (
    <div className="flex h-full">
      {/* ================================================== Left panel */}
      <div className="w-80 border-r border-gray-200 flex flex-col dark:border-gray-700" style={{ minWidth: 320 }}>
        {/* Search + filter */}
        <div className="p-4 space-y-2 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <Title level={4} className="mb-0">Projects</Title>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{filteredProjects.length} total</span>
          </div>
          <Input
            placeholder="Search…"
            prefix={<SearchOutlined className="text-gray-400" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            size="small"
          />
          <Select
            size="small"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: '100%' }}
            options={[
              { value: 'all',         label: 'All Statuses' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'blocked',     label: 'Blocked' },
              { value: 'not_started', label: 'Not Started' },
              { value: 'done',        label: 'Done' },
            ]}
          />
        </div>

        {/* Project cards */}
        <div className="flex-1 overflow-y-auto">
          {filteredProjects.length === 0 ? (
            <Empty description="No projects" className="my-12" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => handleSelect(project)}
                className={[
                  'px-4 py-3 border-b border-gray-100 cursor-pointer transition-colors',
                  selectedProjectId === project.id
                    ? 'bg-blue-50 border-l-[3px] border-l-blue-600'
                    : 'border-l-[3px] border-l-transparent hover:bg-gray-50',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_DOT[project.status] }} />
                    <span className="text-sm font-medium truncate">{project.name}</span>
                  </div>
                  <StatusTag status={project.status} />
                </div>
                {project.owner && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                    <UserOutlined /> {project.owner}
                  </div>
                )}
                {project.tags && project.tags.length > 0 && (
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {project.tags.slice(0, 3).map((t) => (
                      <Tag key={t} style={{ fontSize: 10, padding: '0 5px', margin: 0, lineHeight: '16px' }}>{t}</Tag>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ================================================== Right panel */}
      <div className="flex-1 overflow-y-auto">
        {!selectedProject ? (
          <div className="flex items-center justify-center h-full">
            <Empty description="Select a project to view details" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-gray-200 bg-white flex-shrink-0">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Title level={3} className="mb-0">{selectedProject.name}</Title>
                    <StatusTag status={selectedProject.status} />
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500 flex-wrap">
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
                  <Button size="small" icon={<PlusOutlined />}>Add Item</Button>
                  <Button size="small" icon={<MoreOutlined />} />
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
                  // ---------------------------------------- Overview
                  {
                    key: 'overview',
                    label: 'Overview',
                    children: (
                      <div className="space-y-4 pb-6">
                        {/* KPI row */}
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

                        {/* Progress bar */}
                        <Card title="Progress">
                          <Progress
                            percent={stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0}
                            strokeColor="#1677ff"
                            strokeWidth={14}
                            showInfo
                          />
                          <div className="flex justify-between mt-2 text-xs text-gray-500">
                            <span>{stats.done} of {stats.total} items completed</span>
                          </div>
                        </Card>

                        {/* Details grid */}
                        <Card title="Project Details">
                          <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                            <div>
                              <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Project Lead</div>
                              <div className="mt-0.5 flex items-center gap-1">
                                <UserOutlined className="text-gray-400" />
                                {selectedProject.owner || '—'}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Sponsor</div>
                              <div className="mt-0.5">{getSponsor(selectedProject.name)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Start Date</div>
                              <div className="mt-0.5">{selectedProject.start_date || '—'}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Target End</div>
                              <div className="mt-0.5">{selectedProject.end_date || '—'}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Portfolio</div>
                              <div className="mt-0.5">{portfolioName || '—'}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Open Risks</div>
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

                          {selectedProject.description && (
                            <>
                              <Divider />
                              <div>
                                <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Description</div>
                                <Paragraph className="text-sm text-gray-700 mb-0">{selectedProject.description}</Paragraph>
                              </div>
                            </>
                          )}

                          {selectedProject.tags && selectedProject.tags.length > 0 && (
                            <>
                              <Divider />
                              <div>
                                <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1.5">Tags</div>
                                <div className="flex gap-1.5 flex-wrap">
                                  {selectedProject.tags.map((t) => <Tag key={t}>{t}</Tag>)}
                                </div>
                              </div>
                            </>
                          )}
                        </Card>
                      </div>
                    ),
                  },

                  // ---------------------------------------- Work Items
                  {
                    key: 'workitems',
                    label: `Work Items (${flatWorkItems.length})`,
                    children: (
                      <div className="pb-6">
                        <Card extra={<Button size="small" icon={<PlusOutlined />}>Add</Button>}>
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

                  // ---------------------------------------- Risks
                  {
                    key: 'risks',
                    label: `Risks (${risks.length})`,
                    children: (
                      <div className="pb-6 space-y-4">
                        {/* Risk KPIs */}
                        <Row gutter={[16, 16]}>
                          <Col span={6}>
                            <Card styles={{ body: { padding: 16 }, header: { borderBottom: '2px solid #ff4d4f' } }}>
                              <Statistic
                                title="High Impact"
                                value={risks.filter((r) => r.impact === 'High').length}
                                valueStyle={{ color: '#ff4d4f' }}
                                prefix={<ExclamationCircleOutlined />}
                              />
                            </Card>
                          </Col>
                          <Col span={6}>
                            <Card styles={{ body: { padding: 16 }, header: { borderBottom: '2px solid #faad14' } }}>
                              <Statistic
                                title="Medium Impact"
                                value={risks.filter((r) => r.impact === 'Medium').length}
                                valueStyle={{ color: '#faad14' }}
                                prefix={<ExclamationCircleOutlined />}
                              />
                            </Card>
                          </Col>
                          <Col span={6}>
                            <Card styles={{ body: { padding: 16 }, header: { borderBottom: '2px solid #52c41a' } }}>
                              <Statistic
                                title="Low Impact"
                                value={risks.filter((r) => r.impact === 'Low').length}
                                valueStyle={{ color: '#52c41a' }}
                                prefix={<ExclamationCircleOutlined />}
                              />
                            </Card>
                          </Col>
                          <Col span={6}>
                            <Card styles={{ body: { padding: 16 }, header: { borderBottom: '2px solid #52c41a' } }}>
                              <Statistic
                                title="Resolved"
                                value={risks.filter((r) => r.status === 'Resolved').length}
                                valueStyle={{ color: '#52c41a' }}
                                prefix={<CheckCircleOutlined />}
                              />
                            </Card>
                          </Col>
                        </Row>

                        {/* Risk register table */}
                        <Card extra={<Button size="small" icon={<PlusOutlined />}>Log Risk</Button>}>
                          {risks.length === 0 ? (
                            <Empty description="No risks identified — issues, clashes or blocked items will appear here" />
                          ) : (
                            <Table
                              columns={riskColumns}
                              dataSource={risks}
                              rowKey="id"
                              pagination={false}
                              size="small"
                            />
                          )}
                        </Card>
                      </div>
                    ),
                  },

                  // ---------------------------------------- Budget
                  {
                    key: 'budget',
                    label: 'Budget',
                    children: (
                      <div className="pb-6 space-y-4">
                        {/* Budget KPIs */}
                        <Row gutter={[16, 16]}>
                          <Col span={8}>
                            <Card styles={{ body: { padding: 16 }, header: { borderBottom: '2px solid #1677ff' } }}>
                              <Statistic
                                title="Planned Budget"
                                value={`$${budget.planned.toLocaleString()}`}
                                valueStyle={{ color: '#1677ff' }}
                              />
                            </Card>
                          </Col>
                          <Col span={8}>
                            <Card styles={{ body: { padding: 16 }, header: { borderBottom: '2px solid #faad14' } }}>
                              <Statistic
                                title="Spent"
                                value={`$${budget.spent.toLocaleString()}`}
                                valueStyle={{ color: '#faad14' }}
                              />
                            </Card>
                          </Col>
                          <Col span={8}>
                            <Card styles={{ body: { padding: 16 }, header: { borderBottom: budget.remaining >= 0 ? '2px solid #52c41a' : '2px solid #ff4d4f' } }}>
                              <Statistic
                                title="Remaining"
                                value={`$${budget.remaining.toLocaleString()}`}
                                valueStyle={{ color: budget.remaining >= 0 ? '#52c41a' : '#ff4d4f' }}
                              />
                            </Card>
                          </Col>
                        </Row>

                        {/* Utilization bar + breakdown */}
                        <Card title="Budget Utilization">
                          <Progress
                            percent={budget.planned > 0 ? Math.round((budget.spent / budget.planned) * 100) : 0}
                            strokeColor={
                              budget.planned > 0 && budget.spent / budget.planned > 0.9 ? '#ff4d4f' :
                              budget.planned > 0 && budget.spent / budget.planned > 0.75 ? '#faad14' : '#52c41a'
                            }
                            strokeWidth={16}
                            showInfo
                          />
                          <div className="flex justify-between mt-2 text-xs text-gray-500">
                            <span>${budget.spent.toLocaleString()} spent of ${budget.planned.toLocaleString()} planned</span>
                          </div>

                          <Divider />
                          <div className="text-sm font-semibold text-gray-700 mb-3">Breakdown by Category</div>
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
          </div>
        )}
      </div>
    </div>
  );
}
