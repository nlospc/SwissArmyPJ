import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { loadConfig } from '../core/config';
import { collectStats, getRiskMatrix, insertProject, missingTables, openDatabase } from '../core/db';
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
            },
            required: ['code', 'name'],
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
            SELECT id, code, owner, status, priority, health, progress_pct, budget_baseline, created_at
            FROM projects
            ORDER BY created_at DESC
          `;
          let params: any[] = [];

          if (args?.status) {
            sql = `
              SELECT id, code, owner, status, priority, health, progress_pct, budget_baseline, created_at
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
                    start_date, target_date, end_date, progress_pct, budget_baseline, cost_actual, created_at, updated_at
             FROM projects WHERE code = ?`
          ).get(args.code);

          if (!row) {
            throw new McpError(ErrorCode.InvalidRequest, `Project with code '${args.code}' not found`);
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(row, null, 2),
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

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  });

  // Start server with stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('PMBrain MCP server running on stdio');
}
