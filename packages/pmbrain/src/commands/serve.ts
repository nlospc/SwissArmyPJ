import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { loadConfig } from '../core/config';
import { collectStats, deleteProjectById, findProjectByCodeOrId, getRiskMatrix, insertProject, missingTables, openDatabase, updateProjectById } from '../core/db';
import type { ProjectInitInput } from '../core/types';

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

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  });

  // Start server with stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('PMBrain MCP server running on stdio');
}