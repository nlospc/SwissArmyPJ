import { ipc } from './ipc';
export async function loadSampleData() {
    // Check if data already exists
    const workspaceResult = await ipc.workspace.get();
    const projectsResult = await ipc.projects.getAll();
    if (projectsResult.success && projectsResult.data && projectsResult.data.length > 0) {
        return; // Data already loaded
    }
    // Portfolios
    const portfolio1 = await ipc.portfolios.create({
        name: 'Digital Transformation',
        description: 'Enterprise-wide digital transformation initiatives',
    });
    const portfolio2 = await ipc.portfolios.create({
        name: 'Infrastructure Modernization',
        description: 'Cloud and infrastructure upgrade programs',
    });
    if (!portfolio1.success || !portfolio2.success || !portfolio1.data || !portfolio2.data) {
        throw new Error('Failed to create portfolios');
    }
    // Projects
    const project1 = await ipc.projects.create({
        name: 'ERP Migration',
        owner: 'Alex Chen',
        status: 'in_progress',
        start_date: '2026-01-15',
        end_date: '2026-06-30',
        portfolio_id: portfolio1.data.id,
        tags: ['critical', 'sap', 'migration'],
    });
    const project2 = await ipc.projects.create({
        name: 'Mobile App Development',
        owner: 'Sam Taylor',
        status: 'in_progress',
        start_date: '2025-11-01',
        end_date: '2026-03-31',
        portfolio_id: portfolio1.data.id,
        tags: ['mobile', 'customer-facing'],
    });
    const project3 = await ipc.projects.create({
        name: 'Cloud Infrastructure Upgrade',
        owner: 'Jordan Lee',
        status: 'blocked',
        start_date: '2025-12-01',
        end_date: '2026-05-15',
        portfolio_id: portfolio2.data.id,
        tags: ['cloud', 'infrastructure'],
    });
    const project4 = await ipc.projects.create({
        name: 'Security Compliance Initiative',
        owner: 'Riley Morgan',
        status: 'blocked',
        start_date: '2026-01-10',
        end_date: '2026-04-15',
        portfolio_id: portfolio2.data.id,
        tags: ['security', 'compliance'],
    });
    if (!project1.success || !project2.success || !project3.success || !project4.success ||
        !project1.data || !project2.data || !project3.data || !project4.data) {
        throw new Error('Failed to create projects');
    }
    // Work Items for ERP Migration
    const wi1 = await ipc.workItems.create({
        project_id: project1.data.id,
        type: 'phase',
        title: 'Requirements Phase',
        status: 'done',
        start_date: '2026-01-15',
        end_date: '2026-02-01',
    });
    if (wi1.success && wi1.data) {
        await ipc.workItems.create({
            project_id: project1.data.id,
            parent_id: wi1.data.id,
            type: 'task',
            title: 'Stakeholder interviews',
            status: 'done',
            start_date: '2026-01-15',
            end_date: '2026-01-22',
        });
    }
    await ipc.workItems.create({
        project_id: project1.data.id,
        type: 'milestone',
        title: 'Requirements sign-off',
        status: 'done',
        start_date: '2026-02-01',
        end_date: '2026-02-01',
    });
    const wi4 = await ipc.workItems.create({
        project_id: project1.data.id,
        type: 'phase',
        title: 'Design Phase',
        status: 'in_progress',
        start_date: '2026-02-03',
        end_date: '2026-03-15',
    });
    if (wi4.success && wi4.data) {
        await ipc.workItems.create({
            project_id: project1.data.id,
            parent_id: wi4.data.id,
            type: 'task',
            title: 'Database schema design',
            status: 'in_progress',
            start_date: '2026-02-10',
            end_date: '2026-02-28',
            notes: 'Currently reviewing with DBA team',
        });
    }
    await ipc.workItems.create({
        project_id: project1.data.id,
        type: 'issue',
        title: 'Data migration complexity higher than estimated',
        status: 'in_progress',
        notes: 'Need additional resources for data mapping',
    });
    // Work Items for Mobile App
    const wi7 = await ipc.workItems.create({
        project_id: project2.data.id,
        type: 'phase',
        title: 'Discovery & Design',
        status: 'done',
        start_date: '2025-11-01',
        end_date: '2025-12-15',
    });
    if (wi7.success && wi7.data) {
        await ipc.workItems.create({
            project_id: project2.data.id,
            parent_id: wi7.data.id,
            type: 'task',
            title: 'User research and personas',
            status: 'done',
            start_date: '2025-11-01',
            end_date: '2025-11-20',
        });
    }
    const wi9 = await ipc.workItems.create({
        project_id: project2.data.id,
        type: 'phase',
        title: 'Development',
        status: 'in_progress',
        start_date: '2025-12-16',
        end_date: '2026-03-10',
    });
    if (wi9.success && wi9.data) {
        await ipc.workItems.create({
            project_id: project2.data.id,
            parent_id: wi9.data.id,
            type: 'task',
            title: 'Frontend components',
            status: 'in_progress',
            start_date: '2025-12-16',
            end_date: '2026-02-28',
        });
    }
    await ipc.workItems.create({
        project_id: project2.data.id,
        type: 'milestone',
        title: 'Beta release',
        status: 'not_started',
        start_date: '2026-03-15',
        end_date: '2026-03-15',
    });
    // Work Items for Cloud Infrastructure
    await ipc.workItems.create({
        project_id: project3.data.id,
        type: 'task',
        title: 'Architecture review',
        status: 'done',
        start_date: '2025-12-01',
        end_date: '2025-12-15',
    });
    await ipc.workItems.create({
        project_id: project3.data.id,
        type: 'task',
        title: 'Region 1 migration',
        status: 'blocked',
        start_date: '2026-01-15',
        end_date: '2026-02-15',
        notes: 'Blocked by vendor SLA concerns',
    });
    await ipc.workItems.create({
        project_id: project3.data.id,
        type: 'issue',
        title: 'Vendor SLA concerns for uptime guarantee',
        status: 'blocked',
        notes: 'Escalated to procurement',
    });
    await ipc.workItems.create({
        project_id: project3.data.id,
        type: 'clash',
        title: 'Budget overrun - additional storage costs',
        status: 'in_progress',
    });
    // Work Items for Security Compliance
    await ipc.workItems.create({
        project_id: project4.data.id,
        type: 'task',
        title: 'Vulnerability assessment',
        status: 'in_progress',
        start_date: '2026-01-10',
        end_date: '2026-02-10',
    });
    await ipc.workItems.create({
        project_id: project4.data.id,
        type: 'task',
        title: 'Policy documentation',
        status: 'not_started',
        start_date: '2026-02-15',
        end_date: '2026-03-15',
    });
    await ipc.workItems.create({
        project_id: project4.data.id,
        type: 'issue',
        title: 'Authentication module vulnerabilities identified',
        status: 'blocked',
        notes: 'Critical security issues require immediate attention',
    });
    await ipc.workItems.create({
        project_id: project4.data.id,
        type: 'milestone',
        title: 'Security audit complete',
        status: 'not_started',
        start_date: '2026-04-01',
        end_date: '2026-04-01',
    });
    await ipc.workItems.create({
        project_id: project4.data.id,
        type: 'remark',
        title: 'Need additional security consultant',
        status: 'not_started',
        notes: 'Budget approval pending',
    });
    // Inbox Items
    await ipc.inbox.create({
        source_type: 'text',
        raw_text: 'Discussed with vendor about ERP training schedule. Need to schedule 3-day training session for March 2026. Contact: vendor@example.com',
    });
    await ipc.inbox.create({
        source_type: 'text',
        raw_text: 'BLOCKER: Authentication module has critical vulnerability CVE-2026-1234. Must patch before production. Status: blocked. Assigned to security team.',
    });
    await ipc.inbox.create({
        source_type: 'link',
        raw_text: 'Cloud vendor pricing update: https://vendor.com/pricing - 15% increase starting Q2 2026. Need to review budget impact on Infrastructure project.',
    });
    await ipc.inbox.create({
        source_type: 'text',
        raw_text: 'Mobile app beta testing feedback session scheduled for March 1, 2026. Milestone: collect user feedback before final release.',
    });
    const inbox5 = await ipc.inbox.create({
        source_type: 'text',
        raw_text: 'Database migration script completed. Testing in progress. Expected completion: Feb 28.',
    });
    if (inbox5.success && inbox5.data) {
        await ipc.inbox.markProcessed(inbox5.data.id);
    }
    const inbox6 = await ipc.inbox.create({
        source_type: 'file',
        raw_text: 'Meeting notes from stakeholder sync - 2026-01-25.docx: Discussed project timeline adjustments due to resource constraints. Action items: review Q2 milestones.',
    });
    if (inbox6.success && inbox6.data) {
        await ipc.inbox.markProcessed(inbox6.data.id);
    }
    // Create some todos
    await ipc.todos.create({
        text: 'Review ERP migration timeline',
        due_date: '2026-02-05',
        priority: 'high',
    });
    await ipc.todos.create({
        text: 'Prepare stakeholder update presentation',
        due_date: '2026-02-07',
        priority: 'medium',
    });
    await ipc.todos.create({
        text: 'Follow up with security team on vulnerabilities',
        due_date: '2026-02-03',
        priority: 'high',
    });
}
