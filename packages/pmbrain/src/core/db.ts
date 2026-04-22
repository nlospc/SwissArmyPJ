import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { Database } from 'bun:sqlite'
import type { PMBrainConfig, ProjectInitInput, ProjectRecord, RiskMatrixCell, StatsReport } from './types'

interface CountRow {
  count: number
}

interface RiskMatrixRow {
  probability: number
  impact: number
  count: number
}

interface TableCheckRow {
  name: string
}

export function schemaPath(): string {
  return resolve(import.meta.dir, 'schema.sql')
}

export function readSchemaSql(): string {
  return readFileSync(schemaPath(), 'utf-8')
}

export function ensureDatabaseFile(config: PMBrainConfig): void {
  mkdirSync(dirname(config.dbPath), { recursive: true })
}

export function openDatabase(config: PMBrainConfig): Database {
  ensureDatabaseFile(config)
  const db = new Database(config.dbPath, { create: true })
  db.exec('PRAGMA foreign_keys = ON;')
  db.exec('PRAGMA journal_mode = WAL;')
  return db
}

export function bootstrapDatabase(config: PMBrainConfig): { dbPath: string; schemaPath: string; schemaApplied: boolean } {
  const db = openDatabase(config)

  try {
    db.exec(readSchemaSql())
  } finally {
    db.close()
  }

  return {
    dbPath: config.dbPath,
    schemaPath: schemaPath(),
    schemaApplied: true,
  }
}

export function requiredTables(): string[] {
  return [
    'pages',
    'content_chunks',
    'links',
    'tags',
    'page_tags',
    'timeline_entries',
    'page_versions',
    'raw_data',
    'ingest_log',
    'config',
    'files',
    'vault_sync_state',
    'projects',
    'risks',
    'stakeholders',
    'work_packages',
    'evidence',
  ]
}

export function missingTables(config: PMBrainConfig): string[] {
  const db = openDatabase(config)

  try {
    const query = db.query<TableCheckRow, [string]>(
      'SELECT name FROM sqlite_master WHERE type = \'table\' AND name = ?'
    )

    return requiredTables().filter((tableName) => !query.get(tableName))
  } finally {
    db.close()
  }
}

export function collectStats(config: PMBrainConfig): StatsReport {
  const db = openDatabase(config)

  try {
    return {
      pages: countFrom(db, 'SELECT COUNT(*) AS count FROM pages'),
      projects: countFrom(db, 'SELECT COUNT(*) AS count FROM projects'),
      risks: countFrom(db, 'SELECT COUNT(*) AS count FROM risks'),
      chunks: countFrom(db, 'SELECT COUNT(*) AS count FROM content_chunks'),
    }
  } finally {
    db.close()
  }
}

export function insertProject(config: PMBrainConfig, input: ProjectInitInput): ProjectRecord {
  const db = openDatabase(config)
  const now = nowIso()
  const id = generateId('project')
  const slug = slugify(`${input.code}-${input.name}`)
  const title = `${input.code} ${input.name}`
  const canonicalPath = `Projects/${input.code}/Project Overview.md`

  try {
    db.exec(readSchemaSql())

    const insert = db.transaction(() => {
      db.query(
        `INSERT INTO pages (
          id, page_type, title, slug, status, summary, canonical_path, source_kind, checksum, created_at, updated_at, archived_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id,
        'project',
        title,
        slug,
        input.status ?? 'planning',
        null,
        canonicalPath,
        'cli',
        null,
        now,
        now,
        null,
      )

      db.query(
        `INSERT INTO projects (
          id, code, owner, sponsor, status, priority, health, objective, start_date, target_date, end_date, progress_pct, budget_baseline, cost_actual, program_id, program_role, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id,
        input.code,
        input.owner ?? null,
        null,
        input.status ?? 'planning',
        'medium',
        'gray',
        null,
        null,
        null,
        null,
        0,
        input.budgetBaseline ?? null,
        null,
        input.programId ?? null,
        input.programRole ?? 'standalone',
        now,
        now,
      )

      db.query(
        `INSERT INTO page_versions (
          id, page_id, version_num, title, body_md, frontmatter_json, change_source, change_summary, author, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        generateId('version'),
        id,
        1,
        title,
        `# ${title}\n\n## Objective\n\n## Status\n\n- Status: ${input.status ?? 'planning'}\n- Owner: ${input.owner ?? 'TBD'}\n`,
        JSON.stringify({
          pmbrain_id: id,
          page_type: 'project',
          project_code: input.code,
          status: input.status ?? 'planning',
          owner: input.owner ?? null,
        }),
        'cli',
        'Initial project scaffold',
        'pmbrain',
        now,
      )

      db.query(
        `INSERT INTO vault_sync_state (
          page_id, vault_path, last_sqlite_version_id, last_vault_hash, last_synced_at, sync_status, conflict_note
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(id, canonicalPath, null, null, null, 'pending_export', null)
    })

    insert()

    const row = db.query<any, [string]>(
      `SELECT id, code, owner, sponsor, status, priority, health, objective,
              start_date, target_date, end_date, progress_pct, budget_baseline, cost_actual, program_id, program_role, created_at, updated_at
       FROM projects WHERE id = ?`
    ).get(id)

    if (!row) {
      throw new Error('Project insert failed unexpectedly.')
    }

    return mapProjectRecord(row)
  } finally {
    db.close()
  }
}

export function getRiskMatrix(config: PMBrainConfig, projectCode?: string | null): RiskMatrixCell[] {
  const db = openDatabase(config)

  try {
    db.exec(readSchemaSql())

    const rows = projectCode
      ? db.query<RiskMatrixRow, [string]>(
          `SELECT r.probability AS probability, r.impact AS impact, COUNT(*) AS count
           FROM risks r
           JOIN projects p ON p.id = r.project_id
           WHERE p.code = ?
           GROUP BY r.probability, r.impact`
        ).all(projectCode)
      : db.query<RiskMatrixRow, []>(
          `SELECT probability, impact, COUNT(*) AS count
           FROM risks
           GROUP BY probability, impact`
        ).all()

    const index = new Map(rows.map((row) => [matrixKey(row.probability, row.impact), Number(row.count)]))
    const cells: RiskMatrixCell[] = []

    for (let probability = 5; probability >= 1; probability -= 1) {
      for (let impact = 1; impact <= 5; impact += 1) {
        cells.push({
          probability,
          impact,
          count: index.get(matrixKey(probability, impact)) ?? 0,
        })
      }
    }

    return cells
  } finally {
    db.close()
  }
}

function countFrom(db: Database, sql: string): number {
  const row = db.query<CountRow, []>(sql).get()
  return Number(row?.count ?? 0)
}

function nowIso(): string {
  return new Date().toISOString()
}

function generateId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10)
  return `${prefix}_${Date.now()}_${random}`
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function matrixKey(probability: number, impact: number): string {
  return `${probability}:${impact}`
}

function mapProjectRecord(row: any): ProjectRecord {
  return {
    id: String(row.id),
    code: String(row.code),
    owner: row.owner ? String(row.owner) : null,
    sponsor: row.sponsor ? String(row.sponsor) : null,
    status: String(row.status),
    priority: row.priority ? String(row.priority) : null,
    health: row.health ? String(row.health) : null,
    objective: row.objective ? String(row.objective) : null,
    startDate: row.start_date ? String(row.start_date) : null,
    targetDate: row.target_date ? String(row.target_date) : null,
    endDate: row.end_date ? String(row.end_date) : null,
    progressPct: Number(row.progress_pct ?? 0),
    budgetBaseline: row.budget_baseline ? Number(row.budget_baseline) : null,
    costActual: row.cost_actual ? Number(row.cost_actual) : null,
    programId: row.program_id ? String(row.program_id) : null,
    programRole: (row.program_role as 'program' | 'component' | 'standalone') ?? 'standalone',
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

export interface ProjectDeleteResult {
  deleted: boolean
  projectId: string | null
  projectCode: string | null
  message: string
}

/**
 * Find project by code or ID
 */
export function findProjectByCodeOrId(config: PMBrainConfig, codeOrId: string): ProjectRecord | null {
  const db = openDatabase(config)
  try {
    // Try exact match on code first, then on id
    let row = db.query<any, [string]>(
      `SELECT id, code, owner, sponsor, status, priority, health, objective,
              start_date, target_date, end_date, progress_pct, budget_baseline, cost_actual, program_id, program_role, created_at, updated_at
       FROM projects WHERE code = ?`
    ).get(codeOrId)

    if (!row) {
      row = db.query<any, [string]>(
        `SELECT id, code, owner, sponsor, status, priority, health, objective,
                start_date, target_date, end_date, progress_pct, budget_baseline, cost_actual, program_id, program_role, created_at, updated_at
         FROM projects WHERE id = ?`
      ).get(codeOrId)
    }

    if (!row) {
      return null
    }

    return mapProjectRecord(row)
  } finally {
    db.close()
  }
}

/**
 * Delete a project by ID.
 * Relies on SQLite ON DELETE CASCADE foreign key constraints to handle cascading deletion
 * of all dependent records: stakeholders, work_packages, evidence, pages, etc.
 */
export function deleteProjectById(config: PMBrainConfig, projectId: string): ProjectDeleteResult {
  const db = openDatabase(config)
  try {
    db.exec(readSchemaSql())

    // Find the project first to get code for the response
    const project = db.query<any, [string]>(
      `SELECT code FROM projects WHERE id = ?`
    ).get(projectId)

    if (!project) {
      return {
        deleted: false,
        projectId,
        projectCode: null,
        message: 'Project not found',
      }
    }

    // Begin transaction: projects references pages(id) ON DELETE CASCADE,
    // and all child entities reference projects(id) ON DELETE CASCADE
    // So deleting the page will cascade to project, which cascades to children
    const deleteTransaction = db.transaction(() => {
      // Get the page id (same as project id) from projects table
      // Delete the page - cascades to projects via FK ON DELETE CASCADE,
      // which cascades to stakeholders, work_packages, evidence via their FKs
      db.query(`DELETE FROM pages WHERE id = ?`).run(projectId)
    })

    deleteTransaction()

    return {
      deleted: true,
      projectId,
      projectCode: String(project.code),
      message: 'Project and all associated records deleted successfully (cascade via foreign keys)',
    }
  } finally {
    db.close()
  }
}
