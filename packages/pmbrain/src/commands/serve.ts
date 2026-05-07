import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { loadConfig } from '../core/config';
import { collectStats, deleteProjectById, findProjectByCodeOrId, getRiskMatrix, insertProject, insertRisk, insertStakeholder, addStakeholderToProject, listStakeholders, insertWorkItem, listRisks, listWorkItems, missingTables, openDatabase, searchAll, searchByType, closeRisk, updateRiskById, updateProjectById, updateWorkItemById } from '../core/db';
import type { ProjectInitInput, RiskInitInput, RiskUpdateInput, StakeholderInitInput, WorkItemInitInput, WorkItemUpdateInput } from '../core/types';

export async function runServe(): Promise<void> {
  const config = loadConfig();
  
  // Check database health before serving
  const missing = missingTables(config);
  if (missing.length > 0) {
    console.error(`Missing tables: ${missing.join(', ')}. Run 'pmbrain setup' first.`);
    process.exit(1);
  }

  const server = new Server(
    {
      name: 'pmbrain',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'list_projects_stats',
          description: 'Get statistics of all projects (count by status, total projects)',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'list_projects',
          description: 'List all projects in the database',
          inputSchema: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                description: 'Filter by status (optional, e.g. planning, active, completed)',
              },
            },
          },
        },
        {
          name: 'get_project',
          description: 'Get detailed information about a specific project',
          inputSchema: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description: 'Project code',
              },
            },
            required: ['code'],
          },
        },
        {
          name: 'create_project',
          description: 'Create a new project',
          inputSchema: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description: 'Project code (unique identifier)',
              },
              name: {
                type: 'string',
                description: 'Project name',
              },
              owner: {
                type: 'string',
                description: 'Project owner (optional)',
              },
              budget_baseline: {
                type: 'number',
                description: 'Project budget baseline (optional)',
              },
              status: {
                type: 'string',
                description: 'Initial status (default: planning)',
              },
              program_id: {
                type: 'string',
                description: 'Parent program ID (optional, for component projects)',
              },
              program_role: {
                type: 'string',
                description: 'Program role: "program" (project set), "component" (child project), or "standalone" (independent project, default)',
                enum: ['program', 'component', 'standalone'],
              },
            },
            required: ['code', 'name'],
          },
        },
        {
          name: 'update_project',
          description: 'Update an existing project (partial update - only provided fields will be changed)',
          inputSchema: {
            type: 'object',
            properties: {
              code_or_id: {
                type: 'string',
                description: 'Project code or project ID',
              },
              code: {
                type: 'string',
                description: 'New project code (optional)',
              },
              name: {
                type: 'string',
                description: 'New project name (also updates page title, optional)',
              },
              owner: {
                type: 'string',
                description: 'New project owner (optional)',
              },
              status: {
                type: 'string',
                description: 'New project status (optional)',
              },
              budget_baseline: {
                type: 'number',
                description: 'New project budget baseline (optional)',
              },
              program_id: {
                type: 'string',
                description: 'New parent program ID (use null to remove, optional)',
              },
              program_role: {
                type: 'string',
                description: 'New program role: "program" (project set), "component" (child project), or "standalone" (independent project, optional)',
                enum: ['program', 'component', 'standalone'],
              },
              progress_pct: {
                type: 'number',
                description: 'Progress percentage (0-100, optional)',
              },
              description: {
                type: 'string',
                description: 'Project description/objective (optional)',
              },
            },
            required: ['code_or_id'],
          },
        },
        {
          name: 'get_risk_matrix',
          description: 'Get aggregated risk matrix (probability vs impact)',
          inputSchema: {
            type: 'object',
            properties: {
              project_code: {
                type: 'string',
                description: 'Filter by project code (optional)',
              },
            },
          },
        },
        {
          name: 'delete_project',
          description: 'Delete a project by code or id (permanently deletes all associated records)',
          inputSchema: {
            type: 'object',
            properties: {
              code_or_id: {
                type: 'string',
                description: 'Project code or project ID',
              },
            },
            required: ['code_or_id'],
          },
        },
        {
          name: 'create_stakeholder',
          description: 'Create a new stakeholder (can optionally assign to a project)',
          inputSchema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Stakeholder name (required)',
              },
              email: {
                type: 'string',
                description: 'Email address (optional)',
              },
              phone: {
                type: 'string',
                description: 'Phone number (optional)',
              },
              title: {
                type: 'string',
                description: 'Job title (optional)',
              },
              organization: {
                type: 'string',
                description: 'Organization name (optional)',
              },
              influence: {
                type: 'string',
                description: 'Influence level (high, medium, low) (optional)',
              },
              interest: {
                type: 'string',
                description: 'Interest level (high, medium, low) (optional)',
              },
              engagement_level: {
                type: 'string',
                description: 'Engagement level (optional)',
              },
              notes: {
                type: 'string',
                description: 'Additional notes (optional)',
              },
              project_id: {
                type: 'string',
                description: 'Project ID to assign this stakeholder (optional)',
              },
              project_role: {
                type: 'string',
                description: 'Role within the project (optional)',
              },
            },
            required: ['name'],
          },
        },
        {
          name: 'list_stakeholders',
          description: 'List all stakeholders, optionally filtered by project',
          inputSchema: {
            type: 'object',
            properties: {
              project_id: {
                type: 'string',
                description: 'Filter by project ID (optional)',
              },
            },
          },
        },
        {
          name: 'create_work_item',
          description: 'Create a new work item (issue, defect, feature, action item)',
          inputSchema: {
            type: 'object',
            properties: {
              project_id: {
                type: 'string',
                description: 'Project ID (required)',
              },
              title: {
                type: 'string',
                description: 'Work item title (required)',
              },
              description: {
                type: 'string',
                description: 'Detailed description (optional)',
              },
              item_type: {
                type: 'string',
                description: 'Work item type: issue, defect, feature, action (default: issue)',
                enum: ['issue', 'defect', 'feature', 'action'],
              },
              status: {
                type: 'string',
                description: 'Status: new, in_progress, done, blocked (default: new)',
                enum: ['new', 'in_progress', 'done', 'blocked'],
              },
              priority: {
                type: 'string',
                description: 'Priority: critical, high, medium, low (default: medium)',
                enum: ['critical', 'high', 'medium', 'low'],
              },
              severity: {
                type: 'string',
                description: 'Severity level (optional)',
              },
              owner: {
                type: 'string',
                description: 'Owner/assignee (optional)',
              },
              reporter: {
                type: 'string',
                description: 'Reporter (optional)',
              },
              due_date: {
                type: 'string',
                description: 'Due date (ISO format, optional)',
              },
              tags: {
                type: 'string',
                description: 'Comma-separated tags (optional)',
              },
            },
            required: ['project_id', 'title'],
          },
        },
        {
          name: 'update_work_item',
          description: 'Update an existing work item (partial update)',
          inputSchema: {
            type: 'object',
            properties: {
              work_item_id: {
                type: 'string',
                description: 'Work item ID (required)',
              },
              title: {
                type: 'string',
                description: 'New title (optional)',
              },
              description: {
                type: 'string',
                description: 'New description (optional)',
              },
              status: {
                type: 'string',
                description: 'New status (optional)',
                enum: ['new', 'in_progress', 'done', 'blocked'],
              },
              priority: {
                type: 'string',
                description: 'New priority (optional)',
                enum: ['critical', 'high', 'medium', 'low'],
              },
              severity: {
                type: 'string',
                description: 'New severity (optional)',
              },
              owner: {
                type: 'string',
                description: 'New owner (optional)',
              },
              due_date: {
                type: 'string',
                description: 'New due date (optional)',
              },
              resolution: {
                type: 'string',
                description: 'Resolution notes (optional)',
              },
              tags: {
                type: 'string',
                description: 'New tags (optional)',
              },
            },
            required: ['work_item_id'],
          },
        },
        {
          name: 'list_work_items',
          description: 'List work items, optionally filtered by project, type, or status',
          inputSchema: {
            type: 'object',
            properties: {
              project_id: {
                type: 'string',
                description: 'Filter by project ID (optional)',
              },
              item_type: {
                type: 'string',
                description: 'Filter by work item type (issue, defect, feature, action) (optional)',
                enum: ['issue', 'defect', 'feature', 'action'],
              },
              status: {
                type: 'string',
                description: 'Filter by status (new, in_progress, done, blocked) (optional)',
                enum: ['new', 'in_progress', 'done', 'blocked'],
              },
            },
          },
        },
        {
          name: 'create_risk',
          description: 'Create a new risk with probability/impact assessment',
          inputSchema: {
            type: 'object',
            properties: {
              project_id: {
                type: 'string',
                description: 'Project ID (optional)',
              },
              title: {
                type: 'string',
                description: 'Risk title (required)',
              },
              category: {
                type: 'string',
                description: 'Risk category (e.g., technical, schedule, resource) (optional)',
              },
              status: {
                type: 'string',
                description: 'Risk status (open, mitigated, transferred, accepted, closed) (default: open)',
                enum: ['open', 'mitigated', 'transferred', 'accepted', 'closed'],
              },
              probability: {
                type: 'number',
                description: 'Probability score (1-5, 5 = highest likelihood) (required)',
              },
              impact: {
                type: 'number',
                description: 'Impact score (1-5, 5 = highest consequence) (required)',
              },
              mitigation: {
                type: 'string',
                description: 'Mitigation strategy (optional)',
              },
              contingency: {
                type: 'string',
                description: 'Contingency plan (optional)',
              },
              owner: {
                type: 'string',
                description: 'Risk owner (optional)',
              },
              due_date: {
                type: 'string',
                description: 'Target resolution date (ISO format, optional)',
              },
            },
            required: ['title', 'probability', 'impact'],
          },
        },
        {
          name: 'update_risk',
          description: 'Update an existing risk (partial update)',
          inputSchema: {
            type: 'object',
            properties: {
              risk_id: {
                type: 'string',
                description: 'Risk ID (required)',
              },
              title: {
                type: 'string',
                description: 'New title (optional)',
              },
              category: {
                type: 'string',
                description: 'New category (optional)',
              },
              status: {
                type: 'string',
                description: 'New status (optional)',
                enum: ['open', 'mitigated', 'transferred', 'accepted', 'closed'],
              },
              probability: {
                type: 'number',
                description: 'New probability score (optional)',
              },
              impact: {
                type: 'number',
                description: 'New impact score (optional)',
              },
              mitigation: {
                type: 'string',
                description: 'New mitigation strategy (optional)',
              },
              contingency: {
                type: 'string',
                description: 'New contingency plan (optional)',
              },
              owner: {
                type: 'string',
                description: 'New risk owner (optional)',
              },
              due_date: {
                type: 'string',
                description: 'New due date (optional)',
              },
            },
            required: ['risk_id'],
          },
        },
        {
          name: 'list_risks',
          description: 'List risks sorted by risk score (probability × impact), optionally filtered by project or status',
          inputSchema: {
            type: 'object',
            properties: {
              project_id: {
                type: 'string',
                description: 'Filter by project ID (optional)',
              },
              status: {
                type: 'string',
                description: 'Filter by status (open, mitigated, transferred, accepted, closed) (optional)',
                enum: ['open', 'mitigated', 'transferred', 'accepted', 'closed'],
              },
            },
          },
        },
        {
          name: 'close_risk',
          description: 'Close a risk with optional closure notes',
          inputSchema: {
            type: 'object',
            properties: {
              risk_id: {
                type: 'string',
                description: 'Risk ID (required)',
              },
              closure_notes: {
                type: 'string',
                description: 'Closure notes or resolution summary (optional)',
              },
            },
            required: ['risk_id'],
          },
        },
        {
          name: 'search_all',
          description: 'Full-text search across all projects, risks, work items, and stakeholders using SQLite FTS5',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query (supports FTS5 MATCH syntax: AND, OR, NEAR, prefix*) (required)',
              },
              limit: {
                type: 'number',
                description: 'Maximum results to return (default: 20)',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'search_by_type',
          description: 'Full-text search filtered by entity type',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query (required)',
              },
              entity_type: {
                type: 'string',
                description: 'Filter by entity type (project, risk, work_item, stakeholder, organization, process) (required)',
                enum: ['project', 'risk', 'work_item', 'stakeholder', 'organization', 'process'],
              },
              limit: {
                type: 'number',
                description: 'Maximum results to return (default: 20)',
              },
            },
            required: ['query', 'entity_type'],
          },
        },
      ],
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'list_projects_stats': {
        const stats = collectStats(config);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(stats, null, 2),
            },
          ],
        };
      }

      case 'list_projects': {
        const db = openDatabase(config);
        try {
          let sql = `
            SELECT id, code, owner, status, priority, health, progress_pct, budget_baseline, program_id, program_role, created_at
            FROM projects
            ORDER BY created_at DESC
          `;
          let params: any[] = [];

          if (args?.status) {
            sql = `
              SELECT id, code, owner, status, priority, health, progress_pct, budget_baseline, program_id, program_role, created_at
              FROM projects
              WHERE status = ?
              ORDER BY created_at DESC
            `;
            params = [args.status];
          }

          const rows = db.query(sql).all(...params);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(rows, null, 2),
              },
            ],
          };
        } finally {
          db.close();
        }
      }

      case 'get_project': {
        if (!args?.code || typeof args.code !== 'string') {
          throw new McpError(ErrorCode.InvalidParams, 'Project code is required');
        }

        const db = openDatabase(config);
        try {
          const row = db.query(
            `SELECT id, code, owner, sponsor, status, priority, health, objective,
                    start_date, target_date, end_date, progress_pct, budget_baseline, cost_actual, program_id, program_role, created_at, updated_at
             FROM projects WHERE code = ?`
          ).get(args.code);

          if (!row) {
            throw new McpError(ErrorCode.InvalidRequest, `Project with code '${args.code}' not found`);
          }

          // If this is a program, get all component projects
          let components: any[] | undefined;
          if ((row as any).program_role === 'program') {
            components = db.query(
              `SELECT id, code, owner, status, progress_pct, start_date, target_date
               FROM projects WHERE program_id = ?
               ORDER BY created_at DESC`
            ).all((row as any).id);
          }

          const result = {
            ...row,
            components,
          };

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } finally {
          db.close();
        }
      }

      case 'create_project': {
        if (!args?.code || typeof args.code !== 'string') {
          throw new McpError(ErrorCode.InvalidParams, 'Project code is required');
        }
        if (!args?.name || typeof args.name !== 'string') {
          throw new McpError(ErrorCode.InvalidParams, 'Project name is required');
        }

        const input: ProjectInitInput = {
          code: args.code,
          name: args.name,
          owner: typeof args.owner === 'string' ? args.owner : undefined,
          budgetBaseline: typeof args.budget_baseline === 'number' ? args.budget_baseline : undefined,
          status: typeof args.status === 'string' ? args.status : 'planning',
          programId: typeof args.program_id === 'string' ? args.program_id : undefined,
          programRole: (typeof args.program_role === 'string' ? args.program_role : undefined) as 'program' | 'component' | 'standalone' | undefined,
        };

        const project = insertProject(config, input);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ ok: true, project }, null, 2),
            },
          ],
        };
      }

      case 'update_project': {
        if (!args?.code_or_id || typeof args.code_or_id !== 'string') {
          throw new McpError(ErrorCode.InvalidParams, 'Project code or ID is required');
        }

        const db = openDatabase(config);
        try {
          const project = findProjectByCodeOrId(config, args.code_or_id);
          if (!project) {
            throw new McpError(ErrorCode.InvalidRequest, `Project '${args.code_or_id}' not found`);
          }

          // Collect update options
          const updates: any = {};
          if (args.code !== undefined) updates.code = args.code;
          if (args.name !== undefined) updates.name = args.name;
          if (args.owner !== undefined) updates.owner = args.owner;
          if (args.status !== undefined) updates.status = args.status;
          if (args.budget_baseline !== undefined) updates.budget_baseline = args.budget_baseline;
          if (args.program_id !== undefined) updates.program_id = args.program_id;
          if (args.program_role !== undefined) updates.program_role = args.program_role;
          if (args.progress_pct !== undefined) updates.progress_pct = args.progress_pct;
          if (args.description !== undefined) updates.description = args.description;

          const result = updateProjectById(config, project.id, updates);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  ok: true,
                  updated: result.updated,
                  message: result.message,
                }, null, 2),
              },
            ],
          };
        } finally {
          db.close();
        }
      }

      case 'get_risk_matrix': {
        const projectCode = args?.project_code && typeof args.project_code === 'string'
          ? args.project_code
          : null;
        const matrix = getRiskMatrix(config, projectCode);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(matrix, null, 2),
            },
          ],
        };
      }

      case 'delete_project': {
        if (!args?.code_or_id || typeof args.code_or_id !== 'string') {
          throw new McpError(ErrorCode.InvalidParams, 'Project code or ID is required');
        }

        const db = openDatabase(config);
        try {
          const project = findProjectByCodeOrId(config, args.code_or_id);
          if (!project) {
            throw new McpError(ErrorCode.InvalidRequest, `Project '${args.code_or_id}' not found`);
          }

          const result = deleteProjectById(config, project.id);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ 
                  ok: true, 
                  deleted: result.deleted, 
                  message: `Project '${project.code}' deleted successfully` 
                }, null, 2),
              },
            ],
          };
        } finally {
          db.close();
        }
      }

      case 'create_stakeholder': {
        if (!args?.name || typeof args.name !== 'string') {
          throw new McpError(ErrorCode.InvalidParams, 'Stakeholder name is required');
        }

        const input: StakeholderInitInput = {
          name: args.name,
          email: args.email && typeof args.email === 'string' ? args.email : undefined,
          phone: args.phone && typeof args.phone === 'string' ? args.phone : undefined,
          title: args.title && typeof args.title === 'string' ? args.title : undefined,
          organization: args.organization && typeof args.organization === 'string' ? args.organization : undefined,
          influence: args.influence && typeof args.influence === 'string' ? args.influence as StakeholderInitInput['influence'] : undefined,
          interest: args.interest && typeof args.interest === 'string' ? args.interest as StakeholderInitInput['interest'] : undefined,
          engagementLevel: args.engagement_level && typeof args.engagement_level === 'string' ? args.engagement_level as StakeholderInitInput['engagementLevel'] : undefined,
          notes: args.notes && typeof args.notes === 'string' ? args.notes : undefined,
        };

        const stakeholder = insertStakeholder(config, input);

        let projectAssignment = undefined;
        if (args.project_id && typeof args.project_id === 'string') {
          projectAssignment = addStakeholderToProject(
            config,
            args.project_id,
            stakeholder.id,
            args.project_role && typeof args.project_role === 'string' ? args.project_role : 'stakeholder'
          );
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                ok: true,
                stakeholder,
                projectAssignment,
              }, null, 2),
            },
          ],
        };
      }

      case 'list_stakeholders': {
        const projectId = args?.project_id && typeof args.project_id === 'string'
          ? args.project_id
          : undefined;

        const stakeholders = listStakeholders(config, projectId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                ok: true,
                count: stakeholders.length,
                stakeholders,
              }, null, 2),
            },
          ],
        };
      }

      case 'create_work_item': {
        if (!args?.project_id || typeof args.project_id !== 'string') {
          throw new McpError(ErrorCode.InvalidParams, 'Project ID is required');
        }
        if (!args?.title || typeof args.title !== 'string') {
          throw new McpError(ErrorCode.InvalidParams, 'Work item title is required');
        }

        const input: WorkItemInitInput = {
          projectId: args.project_id,
          title: args.title,
          description: args.description && typeof args.description === 'string' ? args.description : undefined,
          itemType: args.item_type && typeof args.item_type === 'string' ? args.item_type as any : 'issue',
          status: args.status && typeof args.status === 'string' ? args.status as WorkItemInitInput['status'] : undefined,
          priority: args.priority && typeof args.priority === 'string' ? args.priority as WorkItemInitInput['priority'] : undefined,
          severity: args.severity && typeof args.severity === 'string' ? args.severity as WorkItemInitInput['severity'] : undefined,
          owner: args.owner && typeof args.owner === 'string' ? args.owner : undefined,
          reporter: args.reporter && typeof args.reporter === 'string' ? args.reporter : undefined,
          dueDate: args.due_date && typeof args.due_date === 'string' ? args.due_date : undefined,
          tags: args.tags && typeof args.tags === 'string' ? args.tags : undefined,
        };

        const workItem = insertWorkItem(config, input);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                ok: true,
                workItem,
              }, null, 2),
            },
          ],
        };
      }

      case 'update_work_item': {
        if (!args?.work_item_id || typeof args.work_item_id !== 'string') {
          throw new McpError(ErrorCode.InvalidParams, 'Work item ID is required');
        }

        const updates: WorkItemUpdateInput = {
          id: args.work_item_id,
          title: args.title && typeof args.title === 'string' ? args.title : undefined,
          description: args.description && typeof args.description === 'string' ? args.description : undefined,
          status: args.status && typeof args.status === 'string' ? args.status as RiskInitInput['status'] : undefined,
          priority: args.priority && typeof args.priority === 'string' ? args.priority : undefined,
          severity: args.severity && typeof args.severity === 'string' ? args.severity : undefined,
          owner: args.owner && typeof args.owner === 'string' ? args.owner : undefined,
          dueDate: args.due_date && typeof args.due_date === 'string' ? args.due_date : undefined,
          resolution: args.resolution && typeof args.resolution === 'string' ? args.resolution : undefined,
          tags: args.tags && typeof args.tags === 'string' ? args.tags : undefined,
        };

        const result = updateWorkItemById(config, args.work_item_id, updates);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                ok: true,
                updated: result.updated,
                message: result.message,
              }, null, 2),
            },
          ],
        };
      }

      case 'list_work_items': {
        const projectId = args?.project_id && typeof args.project_id === 'string'
          ? args.project_id
          : undefined;
        const itemType = args?.item_type && typeof args.item_type === 'string'
          ? args.item_type
          : undefined;
        const status = args?.status && typeof args.status === 'string'
          ? args.status
          : undefined;

        const workItems = listWorkItems(config, projectId, itemType, status);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                ok: true,
                count: workItems.length,
                workItems,
              }, null, 2),
            },
          ],
        };
      }

      case 'create_risk': {
        if (!args?.title || typeof args.title !== 'string') {
          throw new McpError(ErrorCode.InvalidParams, 'Risk title is required');
        }
        if (!args?.probability || typeof args.probability !== 'number') {
          throw new McpError(ErrorCode.InvalidParams, 'Probability score is required (1-5)');
        }
        if (!args?.impact || typeof args.impact !== 'number') {
          throw new McpError(ErrorCode.InvalidParams, 'Impact score is required (1-5)');
        }

        const input: RiskInitInput = {
          projectId: args.project_id && typeof args.project_id === 'string' ? args.project_id : undefined,
          title: args.title,
          category: args.category && typeof args.category === 'string' ? args.category : undefined,
          status: args.status && typeof args.status === 'string' ? args.status as RiskInitInput['status'] : undefined,
          probability: args.probability,
          impact: args.impact,
          mitigation: args.mitigation && typeof args.mitigation === 'string' ? args.mitigation : undefined,
          contingency: args.contingency && typeof args.contingency === 'string' ? args.contingency : undefined,
          owner: args.owner && typeof args.owner === 'string' ? args.owner : undefined,
          dueDate: args.due_date && typeof args.due_date === 'string' ? args.due_date : undefined,
        };

        const risk = insertRisk(config, input);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                ok: true,
                risk,
                riskScore: risk.score,
              }, null, 2),
            },
          ],
        };
      }

      case 'update_risk': {
        if (!args?.risk_id || typeof args.risk_id !== 'string') {
          throw new McpError(ErrorCode.InvalidParams, 'Risk ID is required');
        }

        const updates: RiskUpdateInput = {};
        if (args.title !== undefined && typeof args.title === 'string') updates.title = args.title;
        if (args.category !== undefined && typeof args.category === 'string') updates.category = args.category;
        if (args.status !== undefined && typeof args.status === 'string') updates.status = args.status as RiskUpdateInput['status'];
        if (args.probability !== undefined && typeof args.probability === 'number') updates.probability = args.probability;
        if (args.impact !== undefined && typeof args.impact === 'number') updates.impact = args.impact;
        if (args.mitigation !== undefined && typeof args.mitigation === 'string') updates.mitigation = args.mitigation;
        if (args.contingency !== undefined && typeof args.contingency === 'string') updates.contingency = args.contingency;
        if (args.owner !== undefined && typeof args.owner === 'string') updates.owner = args.owner;
        if (args.due_date !== undefined && typeof args.due_date === 'string') updates.dueDate = args.due_date;

        const result = updateRiskById(config, args.risk_id, updates);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'list_risks': {
        const projectId = args?.project_id && typeof args.project_id === 'string'
          ? args.project_id
          : undefined;
        const status = args?.status && typeof args.status === 'string'
          ? args.status
          : undefined;

        const risks = listRisks(config, projectId, status);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                ok: true,
                count: risks.length,
                risks,
              }, null, 2),
            },
          ],
        };
      }

      case 'close_risk': {
        if (!args?.risk_id || typeof args.risk_id !== 'string') {
          throw new McpError(ErrorCode.InvalidParams, 'Risk ID is required');
        }

        const closureNotes = args.closure_notes && typeof args.closure_notes === 'string'
          ? args.closure_notes
          : undefined;

        const result = closeRisk(config, args.risk_id, closureNotes);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'search_all': {
        if (!args?.query || typeof args.query !== 'string') {
          throw new McpError(ErrorCode.InvalidParams, 'Search query is required');
        }

        const limit = args.limit && typeof args.limit === 'number' ? args.limit : 20;
        const result = searchAll(config, args.query, limit);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'search_by_type': {
        if (!args?.query || typeof args.query !== 'string') {
          throw new McpError(ErrorCode.InvalidParams, 'Search query is required');
        }
        if (!args?.entity_type || typeof args.entity_type !== 'string') {
          throw new McpError(ErrorCode.InvalidParams, 'Entity type is required for filtered search');
        }

        const limit = args.limit && typeof args.limit === 'number' ? args.limit : 20;
        const result = searchByType(config, args.query, args.entity_type, limit);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  });

  // Start server with stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('PMBrain MCP server running on stdio');
}
