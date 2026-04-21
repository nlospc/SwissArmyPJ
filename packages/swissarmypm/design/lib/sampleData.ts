import { storage, Workspace, Portfolio, Project, WorkItem, InboxItem } from './storage';

export async function loadSampleData(): Promise<void> {
  // Check if data already exists
  const existingWorkspaces = await storage.getAll('workspaces');
  if (existingWorkspaces.length > 0) {
    return; // Data already loaded
  }

  // Workspace
  const workspace: Workspace = {
    id: 'ws-001',
    name: 'Enterprise IT'
  };

  // Portfolios
  const portfolios: Portfolio[] = [
    {
      id: 'pf-001',
      name: 'Digital Transformation',
      description: 'Enterprise-wide digital transformation initiatives',
      projectIds: ['proj-001', 'proj-002']
    },
    {
      id: 'pf-002',
      name: 'Infrastructure Modernization',
      description: 'Cloud and infrastructure upgrade programs',
      projectIds: ['proj-003', 'proj-004']
    }
  ];

  // Projects
  const projects: Project[] = [
    {
      id: 'proj-001',
      name: 'ERP Migration',
      owner: 'Alex Chen',
      status: 'in_progress',
      startDate: '2026-01-15',
      endDate: '2026-06-30',
      portfolioId: 'pf-001',
      tags: ['critical', 'sap', 'migration']
    },
    {
      id: 'proj-002',
      name: 'Mobile App Development',
      owner: 'Sam Taylor',
      status: 'in_progress',
      startDate: '2025-11-01',
      endDate: '2026-03-31',
      portfolioId: 'pf-001',
      tags: ['mobile', 'customer-facing']
    },
    {
      id: 'proj-003',
      name: 'Cloud Infrastructure Upgrade',
      owner: 'Jordan Lee',
      status: 'blocked',
      startDate: '2025-12-01',
      endDate: '2026-05-15',
      portfolioId: 'pf-002',
      tags: ['cloud', 'infrastructure']
    },
    {
      id: 'proj-004',
      name: 'Security Compliance Initiative',
      owner: 'Riley Morgan',
      status: 'blocked',
      startDate: '2026-01-10',
      endDate: '2026-04-15',
      portfolioId: 'pf-002',
      tags: ['security', 'compliance']
    }
  ];

  // Work Items
  const workItems: WorkItem[] = [
    // ERP Migration work items
    {
      id: 'wi-001',
      projectId: 'proj-001',
      type: 'phase',
      title: 'Requirements Phase',
      status: 'done',
      startDate: '2026-01-15',
      endDate: '2026-02-01',
      level: 1,
      createdAt: '2026-01-15T00:00:00Z'
    },
    {
      id: 'wi-002',
      projectId: 'proj-001',
      type: 'task',
      title: 'Stakeholder interviews',
      status: 'done',
      startDate: '2026-01-15',
      endDate: '2026-01-22',
      parentId: 'wi-001',
      level: 2,
      createdAt: '2026-01-15T00:00:00Z'
    },
    {
      id: 'wi-003',
      projectId: 'proj-001',
      type: 'milestone',
      title: 'Requirements sign-off',
      status: 'done',
      startDate: '2026-02-01',
      endDate: '2026-02-01',
      level: 1,
      createdAt: '2026-01-15T00:00:00Z'
    },
    {
      id: 'wi-004',
      projectId: 'proj-001',
      type: 'phase',
      title: 'Design Phase',
      status: 'in_progress',
      startDate: '2026-02-03',
      endDate: '2026-03-15',
      level: 1,
      createdAt: '2026-02-03T00:00:00Z'
    },
    {
      id: 'wi-005',
      projectId: 'proj-001',
      type: 'task',
      title: 'Database schema design',
      status: 'in_progress',
      startDate: '2026-02-10',
      endDate: '2026-02-28',
      parentId: 'wi-004',
      level: 2,
      notes: 'Currently reviewing with DBA team',
      createdAt: '2026-02-10T00:00:00Z'
    },
    {
      id: 'wi-006',
      projectId: 'proj-001',
      type: 'issue',
      title: 'Data migration complexity higher than estimated',
      status: 'in_progress',
      level: 1,
      notes: 'Need additional resources for data mapping',
      createdAt: '2026-02-12T00:00:00Z'
    },

    // Mobile App Development
    {
      id: 'wi-007',
      projectId: 'proj-002',
      type: 'phase',
      title: 'Discovery & Design',
      status: 'done',
      startDate: '2025-11-01',
      endDate: '2025-12-15',
      level: 1,
      createdAt: '2025-11-01T00:00:00Z'
    },
    {
      id: 'wi-008',
      projectId: 'proj-002',
      type: 'task',
      title: 'User research and personas',
      status: 'done',
      startDate: '2025-11-01',
      endDate: '2025-11-20',
      parentId: 'wi-007',
      level: 2,
      createdAt: '2025-11-01T00:00:00Z'
    },
    {
      id: 'wi-009',
      projectId: 'proj-002',
      type: 'phase',
      title: 'Development',
      status: 'in_progress',
      startDate: '2025-12-16',
      endDate: '2026-03-10',
      level: 1,
      createdAt: '2025-12-16T00:00:00Z'
    },
    {
      id: 'wi-010',
      projectId: 'proj-002',
      type: 'task',
      title: 'Frontend components',
      status: 'in_progress',
      startDate: '2025-12-16',
      endDate: '2026-02-28',
      parentId: 'wi-009',
      level: 2,
      createdAt: '2025-12-16T00:00:00Z'
    },
    {
      id: 'wi-011',
      projectId: 'proj-002',
      type: 'milestone',
      title: 'Beta release',
      status: 'not_started',
      startDate: '2026-03-15',
      endDate: '2026-03-15',
      level: 1,
      createdAt: '2025-11-01T00:00:00Z'
    },

    // Cloud Infrastructure
    {
      id: 'wi-012',
      projectId: 'proj-003',
      type: 'task',
      title: 'Architecture review',
      status: 'done',
      startDate: '2025-12-01',
      endDate: '2025-12-15',
      level: 1,
      createdAt: '2025-12-01T00:00:00Z'
    },
    {
      id: 'wi-013',
      projectId: 'proj-003',
      type: 'task',
      title: 'Region 1 migration',
      status: 'blocked',
      startDate: '2026-01-15',
      endDate: '2026-02-15',
      level: 1,
      notes: 'Blocked by vendor SLA concerns',
      createdAt: '2026-01-10T00:00:00Z'
    },
    {
      id: 'wi-014',
      projectId: 'proj-003',
      type: 'issue',
      title: 'Vendor SLA concerns for uptime guarantee',
      status: 'blocked',
      level: 1,
      notes: 'Escalated to procurement',
      createdAt: '2026-01-20T00:00:00Z'
    },
    {
      id: 'wi-015',
      projectId: 'proj-003',
      type: 'clash',
      title: 'Budget overrun - additional storage costs',
      status: 'in_progress',
      level: 1,
      createdAt: '2026-01-25T00:00:00Z'
    },

    // Security Compliance
    {
      id: 'wi-016',
      projectId: 'proj-004',
      type: 'task',
      title: 'Vulnerability assessment',
      status: 'in_progress',
      startDate: '2026-01-10',
      endDate: '2026-02-10',
      level: 1,
      createdAt: '2026-01-10T00:00:00Z'
    },
    {
      id: 'wi-017',
      projectId: 'proj-004',
      type: 'task',
      title: 'Policy documentation',
      status: 'not_started',
      startDate: '2026-02-15',
      endDate: '2026-03-15',
      level: 1,
      createdAt: '2026-01-10T00:00:00Z'
    },
    {
      id: 'wi-018',
      projectId: 'proj-004',
      type: 'issue',
      title: 'Authentication module vulnerabilities identified',
      status: 'blocked',
      level: 1,
      notes: 'Critical security issues require immediate attention',
      createdAt: '2026-01-28T00:00:00Z'
    },
    {
      id: 'wi-019',
      projectId: 'proj-004',
      type: 'milestone',
      title: 'Security audit complete',
      status: 'not_started',
      startDate: '2026-04-01',
      endDate: '2026-04-01',
      level: 1,
      createdAt: '2026-01-10T00:00:00Z'
    },
    {
      id: 'wi-020',
      projectId: 'proj-004',
      type: 'remark',
      title: 'Need additional security consultant',
      status: 'not_started',
      level: 1,
      notes: 'Budget approval pending',
      createdAt: '2026-01-29T00:00:00Z'
    }
  ];

  // Inbox Items
  const inboxItems: InboxItem[] = [
    {
      id: 'inbox-001',
      sourceType: 'text',
      rawText: 'Discussed with vendor about ERP training schedule. Need to schedule 3-day training session for March 2026. Contact: vendor@example.com',
      createdAt: '2026-01-29T10:00:00Z',
      processed: false
    },
    {
      id: 'inbox-002',
      sourceType: 'text',
      rawText: 'BLOCKER: Authentication module has critical vulnerability CVE-2026-1234. Must patch before production. Status: blocked. Assigned to security team.',
      createdAt: '2026-01-29T14:30:00Z',
      processed: false
    },
    {
      id: 'inbox-003',
      sourceType: 'link',
      rawText: 'Cloud vendor pricing update: https://vendor.com/pricing - 15% increase starting Q2 2026. Need to review budget impact on Infrastructure project.',
      createdAt: '2026-01-28T16:00:00Z',
      processed: false
    },
    {
      id: 'inbox-004',
      sourceType: 'text',
      rawText: 'Mobile app beta testing feedback session scheduled for March 1, 2026. Milestone: collect user feedback before final release.',
      createdAt: '2026-01-27T09:00:00Z',
      processed: false
    },
    {
      id: 'inbox-005',
      sourceType: 'text',
      rawText: 'Database migration script completed. Testing in progress. Expected completion: Feb 28.',
      createdAt: '2026-01-26T11:00:00Z',
      processed: true
    },
    {
      id: 'inbox-006',
      sourceType: 'file',
      rawText: 'Meeting notes from stakeholder sync - 2026-01-25.docx: Discussed project timeline adjustments due to resource constraints. Action items: review Q2 milestones.',
      createdAt: '2026-01-25T15:00:00Z',
      processed: true
    }
  ];

  // Load all data
  await storage.add('workspaces', workspace);
  
  for (const portfolio of portfolios) {
    await storage.add('portfolios', portfolio);
  }
  
  for (const project of projects) {
    await storage.add('projects', project);
  }
  
  for (const workItem of workItems) {
    await storage.add('workItems', workItem);
  }
  
  for (const inboxItem of inboxItems) {
    await storage.add('inboxItems', inboxItem);
  }
}
