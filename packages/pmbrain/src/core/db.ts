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
          id, code, owner, sponsor, status, priority, health, objective, start_date, target_date, end_date, progress_pct, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
              start_date, target_date, end_date, progress_pct, created_at, updated_at
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
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}
