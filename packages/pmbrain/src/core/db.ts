import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { Database } from 'bun:sqlite'
import type {
  PMBrainConfig,
  ProjectInitInput,
  ProjectRecord,
  RiskStatus,
  RiskInitInput,
  RiskMatrixCell,
  RiskRecord,
  RiskUpdateInput,
  SearchResult,
  SearchResultItem,
  StakeholderInitInput,
  StakeholderRecord,
  StatsReport,
  WorkItemInitInput,
  WorkItemRecord,
  WorkItemUpdateInput,
  WorkPackageInitInput,
  WorkPackageRecord,
  ProcessInitInput,
  ProcessRecord,
  OrganizationInitInput,
  OrganizationRecord,
  EvidenceInitInput,
  EvidenceRecord,
} from './types'

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
    'project_stakeholders',
    'work_items',
    'work_packages',
    'evidence',
    'processes',
    'organizations',
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
      stakeholders: countFrom(db, 'SELECT COUNT(*) AS count FROM stakeholders'),
      workItems: countFrom(db, 'SELECT COUNT(*) AS count FROM work_items'),
      workPackages: countFrom(db, 'SELECT COUNT(*) AS count FROM work_packages'),
      processes: countFrom(db, 'SELECT COUNT(*) AS count FROM processes'),
      organizations: countFrom(db, 'SELECT COUNT(*) AS count FROM organizations'),
      evidence: countFrom(db, 'SELECT COUNT(*) AS count FROM evidence'),
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
        `# ${title}

## Objective

## Status

- Status: ${input.status ?? 'planning'}
- Owner: ${input.owner ?? 'TBD'}
`,
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
        });
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

/**
 * Update an existing project.
 * Updates project metadata in projects table and optionally page title in pages table.
 */
export interface UpdateProjectOptions {
  code?: string
  name?: string
  owner?: string
  status?: string
  budget_baseline?: number
  program_id?: string | null
  program_role?: 'program' | 'component' | 'standalone'
  progress_pct?: number
  description?: string
}

export function updateProjectById(
  config: PMBrainConfig,
  projectId: string,
  updates: UpdateProjectOptions
): {
  updated: boolean
  projectId: string
  projectCode: string | null
  message: string
} {
  const db = openDatabase(config)
  try {
    db.exec(readSchemaSql())

    // Find the project first to verify it exists
    const existing = db.query<any, [string]>(
      `SELECT code, id FROM projects WHERE id = ?`
    ).get(projectId)

    if (!existing) {
      return {
        updated: false,
        projectId,
        projectCode: null,
        message: 'Project not found',
      }
    }

    // Begin transaction
    const updateTransaction = db.transaction(() => {
      // Build dynamic UPDATE for projects table based on provided fields
      const projectFields: string[] = []
      const projectValues: any[] = []

      if (updates.code !== undefined) {
        projectFields.push('code = ?')
        projectValues.push(updates.code)
      }
      if (updates.owner !== undefined) {
        projectFields.push('owner = ?')
        projectValues.push(updates.owner)
      }
      if (updates.status !== undefined) {
        projectFields.push('status = ?')
        projectValues.push(updates.status)
      }
      if (updates.budget_baseline !== undefined) {
        projectFields.push('budget_baseline = ?')
        projectValues.push(updates.budget_baseline)
      }
      if (updates.program_id !== undefined) {
        projectFields.push('program_id = ?')
        projectValues.push(updates.program_id)
      }
      if (updates.program_role !== undefined) {
        projectFields.push('program_role = ?')
        projectValues.push(updates.program_role)
      }
      if (updates.progress_pct !== undefined) {
        projectFields.push('progress_pct = ?')
        projectValues.push(updates.progress_pct)
      }
      if (updates.description !== undefined) {
        projectFields.push('description = ?')
        projectValues.push(updates.description)
      }

      // Update projects table if there are any changes
      if (projectFields.length > 0) {
        projectValues.push(projectId)
        const updateProjectSql = `UPDATE projects SET ${projectFields.join(', ')} WHERE id = ?`
        db.query(updateProjectSql).run(...projectValues)
      }

      // Update pages table if name changed
      if (updates.name !== undefined) {
        db.query(`UPDATE pages SET title = ? WHERE id = ?`).run(`${updates.code ?? existing.code} ${updates.name}`, projectId)
      }
    })

    updateTransaction()

    return {
      updated: true,
      projectId,
      projectCode: String(existing.code),
      message: 'Project updated successfully',
    }
  } finally {
    db.close()
  }
}

// --- Stakeholder Functions ---

export function insertStakeholder(config: PMBrainConfig, input: StakeholderInitInput): StakeholderRecord {
  const db = openDatabase(config)
  const now = nowIso()
  const id = generateId('stakeholder')
  const slug = slugify(input.name)

  try {
    db.exec(readSchemaSql())

    const insert = db.transaction(() => {
      // Insert page
      db.query(`INSERT INTO pages (id, page_type, title, slug, status, summary, canonical_path, source_kind, checksum, created_at, updated_at, archived_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        id,
        'stakeholder',
        input.name,
        slug,
        'active',
        null,
        `Stakeholders/${slug}.md`,
        'cli',
        null,
        now,
        now,
        null,
      )

      // Insert stakeholder
      db.query(`INSERT INTO stakeholders (id, page_id, name, email, phone, title, organization, influence, interest, engagement_level, engagement_strategy, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        id,
        id,
        input.name,
        input.email ?? null,
        input.phone ?? null,
        input.title ?? null,
        input.organization ?? null,
        input.influence ?? null,
        input.interest ?? null,
        input.engagementLevel ?? null,
        null,
        input.notes ?? null,
        now,
        now,
      )

      return db.query(`SELECT * FROM stakeholders WHERE id = ?`).get(id)
    })

    const row = insert()
    return mapStakeholderRow(row)
  } finally {
    db.close()
  }
}

export function addStakeholderToProject(config: PMBrainConfig, projectId: string, stakeholderId: string, role: string, responsibility?: string): { added: boolean; message: string } {
  const db = openDatabase(config)
  const now = nowIso()
  const id = generateId('ps')

  try {
    db.exec(readSchemaSql())

    // Check if already exists
    const existing = db.query(`SELECT id FROM project_stakeholders WHERE project_id = ? AND stakeholder_id = ?`).get(projectId, stakeholderId)
    if (existing) {
      return { added: false, message: 'Stakeholder already in project' }
    }

    db.query(`INSERT INTO project_stakeholders (id, project_id, stakeholder_id, role, responsibility, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      id,
      projectId,
      stakeholderId,
      role,
      responsibility ?? null,
      now,
      now,
    )

    return { added: true, message: 'Stakeholder added to project successfully' }
  } finally {
    db.close()
  }
}

export function listStakeholders(config: PMBrainConfig, projectId?: string): StakeholderRecord[] {
  const db = openDatabase(config)

  try {
    db.exec(readSchemaSql())

    let sql = `SELECT s.* FROM stakeholders s`
    const params: string[] = []

    if (projectId) {
      sql += ` JOIN project_stakeholders ps ON s.id = ps.stakeholder_id WHERE ps.project_id = ?`
      params.push(projectId)
    }

    sql += ` ORDER BY s.name`

    const rows = db.query(sql).all(...params)
    return rows.map(mapStakeholderRow)
  } finally {
    db.close()
  }
}

function mapStakeholderRow(row: any): StakeholderRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    email: row.email ? String(row.email) : null,
    phone: row.phone ? String(row.phone) : null,
    title: row.title ? String(row.title) : null,
    organization: row.organization ? String(row.organization) : null,
    influence: row.influence ? String(row.influence) : null,
    interest: row.interest ? String(row.interest) : null,
    engagementLevel: row.engagement_level ? String(row.engagement_level) : null,
    engagementStrategy: row.engagement_strategy ? String(row.engagement_strategy) : null,
    notes: row.notes ? String(row.notes) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

// --- WorkItem Functions ---

export function insertWorkItem(config: PMBrainConfig, input: WorkItemInitInput): WorkItemRecord {
  const db = openDatabase(config)
  const now = nowIso()
  const id = generateId('work_item')
  const slug = slugify(`${input.itemType}-${input.title}`)
  const title = `[${input.itemType.toUpperCase()}] ${input.title}`

  // Generate work item code (e.g., ISSUE-001)
  const typePrefix = input.itemType.substring(0, 5).toUpperCase()
  const countRow = db.query<CountRow, [string]>(`SELECT COUNT(*) AS count FROM work_items WHERE item_type = ?`).get(input.itemType)
  const count = countRow ? countRow.count + 1 : 1
  const code = `${typePrefix}-${count.toString().padStart(3, '0')}`

  try {
    db.exec(readSchemaSql())

    const insert = db.transaction(() => {
      // Insert page
      db.query(`INSERT INTO pages (id, page_type, title, slug, status, summary, canonical_path, source_kind, checksum, created_at, updated_at, archived_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        id,
        'work_item',
        title,
        slug,
        input.status ?? 'new',
        input.description?.substring(0, 200) ?? null,
        `WorkItems/${code}.md`,
        'cli',
        null,
        now,
        now,
        null,
      )

      // Insert work_item
      db.query(`INSERT INTO work_items (id, project_id, page_id, code, title, description, item_type, status, priority, severity, owner, reporter, due_date, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        id,
        input.projectId,
        id,
        code,
        input.title,
        input.description ?? null,
        input.itemType,
        input.status ?? 'new',
        input.priority ?? 'medium',
        input.severity ?? null,
        input.owner ?? null,
        input.reporter ?? null,
        input.dueDate ?? null,
        input.tags ?? null,
        now,
        now,
      )

      return db.query(`SELECT * FROM work_items WHERE id = ?`).get(id)
    })

    const row = insert()
    return mapWorkItemRow(row)
  } finally {
    db.close()
  }
}

export function updateWorkItemById(config: PMBrainConfig, workItemId: string, updates: WorkItemUpdateInput): { updated: boolean; workItemId: string; message: string } {
  const db = openDatabase(config)
  const now = nowIso()

  try {
    db.exec(readSchemaSql())

    const existing = db.query<any, [string]>(`SELECT id FROM work_items WHERE id = ?`).get(workItemId)
    if (!existing) {
      return { updated: false, workItemId, message: 'Work item not found' }
    }

    const updateTransaction = db.transaction(() => {
      const fields: string[] = []
      const values: any[] = []

      if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title) }
      if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description) }
      if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status) }
      if (updates.priority !== undefined) { fields.push('priority = ?'); values.push(updates.priority) }
      if (updates.severity !== undefined) { fields.push('severity = ?'); values.push(updates.severity) }
      if (updates.owner !== undefined) { fields.push('owner = ?'); values.push(updates.owner) }
      if (updates.dueDate !== undefined) { fields.push('due_date = ?'); values.push(updates.dueDate) }
      if (updates.resolution !== undefined) {
        fields.push('resolution = ?')
        values.push(updates.resolution)
        if (updates.status === 'done') {
          fields.push('resolved_at = ?')
          values.push(now)
        }
      }
      if (updates.tags !== undefined) { fields.push('tags = ?'); values.push(updates.tags) }

      if (fields.length > 0) {
        fields.push('updated_at = ?')
        values.push(now)
        values.push(workItemId)
        const sql = `UPDATE work_items SET ${fields.join(', ')} WHERE id = ?`
        db.query(sql).run(...values)
      }
    })

    updateTransaction()
    return { updated: true, workItemId, message: 'Work item updated successfully' }
  } finally {
    db.close()
  }
}

export function listWorkItems(config: PMBrainConfig, projectId?: string, itemType?: string, status?: string): WorkItemRecord[] {
  const db = openDatabase(config)

  try {
    db.exec(readSchemaSql())

    let sql = `SELECT * FROM work_items`
    const params: string[] = []
    const conditions: string[] = []

    if (projectId) { conditions.push('project_id = ?'); params.push(projectId) }
    if (itemType) { conditions.push('item_type = ?'); params.push(itemType) }
    if (status) { conditions.push('status = ?'); params.push(status) }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`
    }

    sql += ` ORDER BY priority = 'critical' DESC, priority = 'high' DESC, created_at DESC`

    const rows = db.query(sql).all(...params)
    return rows.map(mapWorkItemRow)
  } finally {
    db.close()
  }
}

  function mapWorkItemRow(row: any): WorkItemRecord {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    code: row.code ? String(row.code) : null,
    title: String(row.title),
    description: row.description ? String(row.description) : null,
    itemType: String(row.item_type),
    status: String(row.status),
    priority: row.priority ? String(row.priority) : null,
    severity: row.severity ? String(row.severity) : null,
    owner: row.owner ? String(row.owner) : null,
    reporter: row.reporter ? String(row.reporter) : null,
    parentId: row.parent_id ? String(row.parent_id) : null,
    dueDate: row.due_date ? String(row.due_date) : null,
    resolvedAt: row.resolved_at ? String(row.resolved_at) : null,
    resolution: row.resolution ? String(row.resolution) : null,
    tags: row.tags ? String(row.tags) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

// --- Risk Functions ---

export function insertRisk(config: PMBrainConfig, input: RiskInitInput): RiskRecord {
  const db = openDatabase(config)
  const now = nowIso()
  const id = generateId('risk')
  const slug = slugify(`risk-${input.title}`)

  try {
    db.exec(readSchemaSql())

    const insert = db.transaction(() => {
      // Insert page
      db.query(`INSERT INTO pages (id, page_type, title, slug, status, summary, canonical_path, source_kind, checksum, created_at, updated_at, archived_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        id,
        'risk',
        input.title,
        slug,
        input.status ?? 'open',
        input.mitigation?.substring(0, 200) ?? null,
        `Risks/${id}.md`,
        'cli',
        null,
        now,
        now,
        null,
      )

      // Insert risk
      db.query(`INSERT INTO risks (id, project_id, page_id, title, category, status, probability, impact, mitigation, contingency, owner, identified_at, due_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        id,
        input.projectId ?? null,
        id,
        input.title,
        input.category ?? null,
        input.status ?? 'open',
        input.probability,
        input.impact,
        input.mitigation ?? null,
        input.contingency ?? null,
        input.owner ?? null,
        now,
        input.dueDate ?? null,
        now,
        now,
      )

      return db.query(`SELECT * FROM risks WHERE id = ?`).get(id)
    })

    const row = insert()
    return mapRiskRow(row)
  } finally {
    db.close()
  }
}

export function updateRiskById(config: PMBrainConfig, riskId: string, updates: RiskUpdateInput): { updated: boolean; riskId: string; message: string } {
  const db = openDatabase(config)
  const now = nowIso()

  try {
    db.exec(readSchemaSql())

    const existing = db.query<any, [string]>(`SELECT id FROM risks WHERE id = ?`).get(riskId)
    if (!existing) {
      return { updated: false, riskId, message: 'Risk not found' }
    }

    const updateTransaction = db.transaction(() => {
      const fields: string[] = []
      const values: any[] = []

      if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title) }
      if (updates.category !== undefined) { fields.push('category = ?'); values.push(updates.category) }
      if (updates.status !== undefined) {
        fields.push('status = ?')
        values.push(updates.status)
        if (updates.status === 'closed') {
          fields.push('closed_at = ?')
          values.push(now)
        }
      }
      if (updates.probability !== undefined) { fields.push('probability = ?'); values.push(updates.probability) }
      if (updates.impact !== undefined) { fields.push('impact = ?'); values.push(updates.impact) }
      if (updates.mitigation !== undefined) { fields.push('mitigation = ?'); values.push(updates.mitigation) }
      if (updates.contingency !== undefined) { fields.push('contingency = ?'); values.push(updates.contingency) }
      if (updates.owner !== undefined) { fields.push('owner = ?'); values.push(updates.owner) }
      if (updates.dueDate !== undefined) { fields.push('due_date = ?'); values.push(updates.dueDate) }

      if (fields.length > 0) {
        fields.push('updated_at = ?')
        values.push(now)
        values.push(riskId)
        const sql = `UPDATE risks SET ${fields.join(', ')} WHERE id = ?`
        db.query(sql).run(...values)

        // Also update page title
        if (updates.title !== undefined) {
          db.query(`UPDATE pages SET title = ?, status = ? WHERE id = ?`).run(
            updates.title,
            updates.status ?? 'open',
            riskId
          )
        }
      }
    })

    updateTransaction()
    return { updated: true, riskId, message: 'Risk updated successfully' }
  } finally {
    db.close()
  }
}

export function listRisks(config: PMBrainConfig, projectId?: string, status?: string): RiskRecord[] {
  const db = openDatabase(config)

  try {
    db.exec(readSchemaSql())

    let sql = `SELECT * FROM risks`
    const params: string[] = []
    const conditions: string[] = []

    if (projectId) { conditions.push('project_id = ?'); params.push(projectId) }
    if (status) { conditions.push('status = ?'); params.push(status) }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`
    }

    sql += ` ORDER BY (probability * impact) DESC, created_at DESC`

    const rows = db.query(sql).all(...params)
    return rows.map(mapRiskRow)
  } finally {
    db.close()
  }
}

export function closeRisk(config: PMBrainConfig, riskId: string, closureNotes?: string): { closed: boolean; riskId: string; message: string } {
  const result = updateRiskById(config, riskId, { status: 'closed', mitigation: closureNotes })
  return { closed: result.updated, riskId: result.riskId, message: result.message }
}

function mapRiskRow(row: any): RiskRecord {
  return {
    id: String(row.id),
    projectId: row.project_id ? String(row.project_id) : null,
    title: String(row.title),
    category: row.category ? String(row.category) : null,
    status: String(row.status) as RiskStatus,
    probability: Number(row.probability),
    impact: Number(row.impact),
    score: Number(row.probability) * Number(row.impact),
    mitigation: row.mitigation ? String(row.mitigation) : null,
    contingency: row.contingency ? String(row.contingency) : null,
    owner: row.owner ? String(row.owner) : null,
    identifiedAt: row.identified_at ? String(row.identified_at) : null,
    dueDate: row.due_date ? String(row.due_date) : null,
    closedAt: row.closed_at ? String(row.closed_at) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

// --- Full Text Search Functions ---

export function searchAll(config: PMBrainConfig, query: string, limit: number = 20): SearchResult {
  const db = openDatabase(config)

  try {
    db.exec(readSchemaSql())

    // Use FTS5 with BM25 ranking
    const sql = `
      SELECT
        entity_id,
        entity_type,
        title,
        snippet(pmbrain_fts, 3, '<<<', '>>>', '...', 64) AS snippet,
        rank
      FROM pmbrain_fts
      WHERE pmbrain_fts MATCH ?
      ORDER BY rank
      LIMIT ?
    `

    const rows = db.query(sql).all(query, limit)

    const results: SearchResultItem[] = rows.map((row: any) => ({
      entityId: String(row.entity_id),
      entityType: String(row.entity_type),
      title: String(row.title),
      snippet: String(row.snippet),
      rank: Number(row.rank),
    }))

    return {
      query,
      total: results.length,
      results,
    }
  } finally {
    db.close()
  }
}

export function searchByType(config: PMBrainConfig, query: string, entityType: string, limit: number = 20): SearchResult {
  const db = openDatabase(config)

  try {
    db.exec(readSchemaSql())

    const sql = `
      SELECT
        entity_id,
        entity_type,
        title,
        snippet(pmbrain_fts, 3, '<<<', '>>>', '...', 64) AS snippet,
        rank
      FROM pmbrain_fts
      WHERE pmbrain_fts MATCH ? AND entity_type = ?
      ORDER BY rank
      LIMIT ?
    `

    const rows = db.query(sql).all(query, entityType, limit)

    const results: SearchResultItem[] = rows.map((row: any) => ({
      entityId: String(row.entity_id),
      entityType: String(row.entity_type),
      title: String(row.title),
      snippet: String(row.snippet),
      rank: Number(row.rank),
    }))

    return {
      query,
      total: results.length,
      results,
    }
  } finally {
    db.close()
  }
}

// ============================================
// Work Package Functions
// ============================================

export function insertWorkPackage(config: PMBrainConfig, input: WorkPackageInitInput): WorkPackageRecord {
  const db = openDatabase(config)

  try {
    db.exec(readSchemaSql())

    const now = new Date().toISOString()
    const id = generateId('wp')
    const slug = `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${id.slice(-6)}`

    const row = db.transaction(() => {
      // Insert into pages
      db.query(`
        INSERT INTO pages (id, page_type, title, slug, status, summary, canonical_path, source_kind, checksum, created_at, updated_at, archived_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        'work_package',
        input.name,
        slug,
        input.status ?? 'pending',
        input.description ?? null,
        `WorkPackages/${slug}.md`,
        'cli',
        null,
        now,
        now,
        null,
      )

      // Insert into work_packages
      db.query(`
        INSERT INTO work_packages (id, project_id, page_id, name, description, responsible, start_date, end_date, status, progress_pct, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        input.projectId,
        id,
        input.name,
        input.description ?? null,
        input.responsible ?? null,
        input.startDate ?? null,
        input.endDate ?? null,
        input.status ?? 'pending',
        input.progressPct ?? 0,
        now,
        now,
      )

      return db.query(`SELECT * FROM work_packages WHERE id = ?`).get(id)
    })()

    return mapWorkPackageRow(row)
  } finally {
    db.close()
  }
}

export function listWorkPackages(config: PMBrainConfig, projectId?: string, status?: string): WorkPackageRecord[] {
  const db = openDatabase(config)

  try {
    db.exec(readSchemaSql())

    let sql = `SELECT * FROM work_packages`
    const params: string[] = []
    const conditions: string[] = []

    if (projectId) { conditions.push('project_id = ?'); params.push(projectId) }
    if (status) { conditions.push('status = ?'); params.push(status) }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`
    }

    sql += ` ORDER BY created_at DESC`

    const rows = db.query(sql).all(...params)
    return rows.map(mapWorkPackageRow)
  } finally {
    db.close()
  }
}

function mapWorkPackageRow(row: any): WorkPackageRecord {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    name: String(row.name),
    description: row.description ? String(row.description) : null,
    responsible: row.responsible ? String(row.responsible) : null,
    startDate: row.start_date ? String(row.start_date) : null,
    endDate: row.end_date ? String(row.end_date) : null,
    status: String(row.status),
    progressPct: Number(row.progress_pct),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

// ============================================
// Process Functions
// ============================================

export function insertProcess(config: PMBrainConfig, input: ProcessInitInput): ProcessRecord {
  const db = openDatabase(config)

  try {
    db.exec(readSchemaSql())

    const now = new Date().toISOString()
    const id = generateId('proc')
    const slug = `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${id.slice(-6)}`

    const row = db.transaction(() => {
      // Insert into pages
      db.query(`
        INSERT INTO pages (id, page_type, title, slug, status, summary, canonical_path, source_kind, checksum, created_at, updated_at, archived_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        'process',
        input.name,
        slug,
        input.status ?? 'draft',
        input.description ?? null,
        `Processes/${slug}.md`,
        'cli',
        null,
        now,
        now,
        null,
      )

      // Insert into processes
      db.query(`
        INSERT INTO processes (id, project_id, page_id, name, description, scope, owner, status, version, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        input.projectId,
        id,
        input.name,
        input.description ?? null,
        input.scope ?? null,
        input.owner ?? null,
        input.status ?? 'draft',
        input.version ?? 1,
        now,
        now,
      )

      return db.query(`SELECT * FROM processes WHERE id = ?`).get(id)
    })()

    return mapProcessRow(row)
  } finally {
    db.close()
  }
}

export function listProcesses(config: PMBrainConfig, projectId?: string, status?: string): ProcessRecord[] {
  const db = openDatabase(config)

  try {
    db.exec(readSchemaSql())

    let sql = `SELECT * FROM processes`
    const params: string[] = []
    const conditions: string[] = []

    if (projectId) { conditions.push('project_id = ?'); params.push(projectId) }
    if (status) { conditions.push('status = ?'); params.push(status) }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`
    }

    sql += ` ORDER BY created_at DESC`

    const rows = db.query(sql).all(...params)
    return rows.map(mapProcessRow)
  } finally {
    db.close()
  }
}

function mapProcessRow(row: any): ProcessRecord {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    name: String(row.name),
    description: row.description ? String(row.description) : null,
    scope: row.scope ? String(row.scope) : null,
    owner: row.owner ? String(row.owner) : null,
    status: String(row.status),
    version: Number(row.version),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

// ============================================
// Organization Functions
// ============================================

export function insertOrganization(config: PMBrainConfig, input: OrganizationInitInput): OrganizationRecord {
  const db = openDatabase(config)

  try {
    db.exec(readSchemaSql())

    const now = new Date().toISOString()
    const id = generateId('org')

    const row = db.transaction(() => {
      db.query(`
        INSERT INTO organizations (id, parent_id, name, code, description, level, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        input.parentId ?? null,
        input.name,
        input.code ?? null,
        input.description ?? null,
        input.level ?? 1,
        now,
        now,
      )

      return db.query(`SELECT * FROM organizations WHERE id = ?`).get(id)
    })()

    return mapOrganizationRow(row)
  } finally {
    db.close()
  }
}

export function listOrganizations(config: PMBrainConfig, parentId?: string): OrganizationRecord[] {
  const db = openDatabase(config)

  try {
    db.exec(readSchemaSql())

    let sql = `SELECT * FROM organizations`
    const params: string[] = []
    const conditions: string[] = []

    if (parentId) { conditions.push('parent_id = ?'); params.push(parentId) }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`
    }

    sql += ` ORDER BY level ASC, name ASC`

    const rows = db.query(sql).all(...params)
    return rows.map(mapOrganizationRow)
  } finally {
    db.close()
  }
}

function mapOrganizationRow(row: any): OrganizationRecord {
  return {
    id: String(row.id),
    parentId: row.parent_id ? String(row.parent_id) : null,
    name: String(row.name),
    code: row.code ? String(row.code) : null,
    description: row.description ? String(row.description) : null,
    level: Number(row.level),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

// ============================================
// Evidence Functions
// ============================================

export function addEvidence(config: PMBrainConfig, input: EvidenceInitInput): EvidenceRecord {
  const db = openDatabase(config)

  try {
    db.exec(readSchemaSql())

    const now = new Date().toISOString()
    const id = generateId('evd')

    const row = db.transaction(() => {
      db.query(`
        INSERT INTO evidence (id, project_id, entity_type, entity_id, title, source_type, source_uri, captured_at, content_text, file_path, metadata_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        input.projectId,
        input.entityType ?? null,
        input.entityId ?? null,
        input.title,
        input.sourceType,
        input.sourceUri ?? null,
        input.capturedAt ?? now,
        input.contentText ?? null,
        input.filePath ?? null,
        input.metadataJson ? JSON.stringify(input.metadataJson) : null,
        now,
      )

      return db.query(`SELECT * FROM evidence WHERE id = ?`).get(id)
    })()

    return mapEvidenceRow(row)
  } finally {
    db.close()
  }
}

export function listEvidence(config: PMBrainConfig, projectId?: string, entityType?: string, entityId?: string): EvidenceRecord[] {
  const db = openDatabase(config)

  try {
    db.exec(readSchemaSql())

    let sql = `SELECT * FROM evidence`
    const params: string[] = []
    const conditions: string[] = []

    if (projectId) { conditions.push('project_id = ?'); params.push(projectId) }
    if (entityType) { conditions.push('entity_type = ?'); params.push(entityType) }
    if (entityId) { conditions.push('entity_id = ?'); params.push(entityId) }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`
    }

    sql += ` ORDER BY captured_at DESC`

    const rows = db.query(sql).all(...params)
    return rows.map(mapEvidenceRow)
  } finally {
    db.close()
  }
}

function mapEvidenceRow(row: any): EvidenceRecord {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    entityType: row.entity_type ? String(row.entity_type) : null,
    entityId: row.entity_id ? String(row.entity_id) : null,
    title: String(row.title),
    sourceType: String(row.source_type),
    sourceUri: row.source_uri ? String(row.source_uri) : null,
    capturedAt: String(row.captured_at),
    contentText: row.content_text ? String(row.content_text) : null,
    filePath: row.file_path ? String(row.file_path) : null,
    metadataJson: row.metadata_json ? String(row.metadata_json) : null,
    createdAt: String(row.created_at),
  }
}
