import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import type { Database } from 'bun:sqlite'
import type { PMBrainConfig } from './types'
import { openDatabase, readSchemaSql } from './db'

type SyncType = 'project' | 'work_item' | 'risk'
type SyncMode = 'check' | 'export' | 'import' | 'reconcile'

interface ContractEntry {
  type: SyncType
  table: string
  folder: string
  idColumn: string
  pathField: string
  editable: string[]
  readonly: string[]
  selectSql: string
}

interface SyncRecord {
  type: SyncType
  id: string
  title: string
  path: string
  sqliteVersionId: string
  updatedAt: string
  data: Record<string, unknown>
}

interface VaultNote {
  path: string
  frontmatter: Record<string, string>
  body: string
  editableBody: string
}

export interface VaultSyncReport {
  ok: boolean
  mode: SyncMode
  vaultPath: string
  exported: string[]
  imported: string[]
  sqliteMissingFromVault: string[]
  vaultMissingFromSQLite: string[]
  changedVaultNotes: string[]
  changedSqliteRecords: string[]
  conflicts: string[]
  duplicateIds: string[]
  malformedNotes: string[]
  unsupportedFlags: string[]
  message?: string
}

export const REQUIRED_FRONTMATTER = [
  'pmbrain_type',
  'pmbrain_id',
  'sync_status',
  'last_synced_at',
  'sqlite_version_id',
  'content_hash',
]

export const SYNC_CONTRACT: Record<SyncType, ContractEntry> = {
  project: {
    type: 'project',
    table: 'projects',
    folder: '10_Projects',
    idColumn: 'id',
    pathField: 'code',
    editable: [
      'title',
      'owner',
      'status',
      'priority',
      'health',
      'objective',
      'start_date',
      'target_date',
      'end_date',
      'progress_pct',
      'budget_baseline',
      'cost_actual',
      'program_id',
      'program_role',
      'editable_body',
    ],
    readonly: ['pmbrain_type', 'pmbrain_id', 'code', 'created_at', 'updated_at', 'sqlite_version_id', 'content_hash'],
    selectSql: `
      SELECT
        p.id,
        p.code,
        COALESCE(pg.title, p.code) AS title,
        p.owner,
        p.sponsor,
        p.status,
        p.priority,
        p.health,
        p.objective,
        p.start_date,
        p.target_date,
        p.end_date,
        p.progress_pct,
        p.budget_baseline,
        p.cost_actual,
        p.program_id,
        p.program_role,
        p.created_at,
        p.updated_at,
        p.updated_at AS sqlite_version_id
      FROM projects p
      LEFT JOIN pages pg ON pg.id = p.id
      ORDER BY p.code
    `,
  },
  work_item: {
    type: 'work_item',
    table: 'work_items',
    folder: '30_WorkItems',
    idColumn: 'id',
    pathField: 'id',
    editable: ['title', 'description', 'status', 'priority', 'severity', 'owner', 'due_date', 'resolution', 'tags', 'editable_body'],
    readonly: ['pmbrain_type', 'pmbrain_id', 'project_id', 'code', 'item_type', 'reporter', 'created_at', 'updated_at', 'sqlite_version_id', 'content_hash'],
    selectSql: `
      SELECT
        wi.id,
        wi.project_id,
        wi.code,
        wi.title,
        wi.description,
        wi.item_type,
        wi.status,
        wi.priority,
        wi.severity,
        wi.owner,
        wi.reporter,
        wi.due_date,
        wi.resolved_at,
        wi.resolution,
        wi.tags,
        wi.created_at,
        wi.updated_at,
        wi.updated_at AS sqlite_version_id
      FROM work_items wi
      ORDER BY wi.id
    `,
  },
  risk: {
    type: 'risk',
    table: 'risks',
    folder: '40_Risks',
    idColumn: 'id',
    pathField: 'id',
    editable: ['title', 'category', 'status', 'probability', 'impact', 'mitigation', 'contingency', 'owner', 'due_date', 'editable_body'],
    readonly: ['pmbrain_type', 'pmbrain_id', 'project_id', 'identified_at', 'closed_at', 'created_at', 'updated_at', 'sqlite_version_id', 'content_hash'],
    selectSql: `
      SELECT
        r.id,
        r.project_id,
        r.title,
        r.category,
        r.status,
        r.probability,
        r.impact,
        r.mitigation,
        r.contingency,
        r.owner,
        r.identified_at,
        r.due_date,
        r.closed_at,
        r.created_at,
        r.updated_at,
        r.updated_at AS sqlite_version_id
      FROM risks r
      ORDER BY r.id
    `,
  },
}

export function runVaultSyncEngine(config: PMBrainConfig, mode: SyncMode, args: string[] = []): VaultSyncReport {
  const unsupportedFlags = args.filter((arg) => arg.startsWith('--'))
  const report = emptyReport(mode, config.vaultPath, unsupportedFlags)
  ensureContractFolders(config.vaultPath)

  if (mode === 'export') {
    return exportVault(config, report)
  }

  const db = openDatabase(config)
  try {
    db.exec(readSchemaSql())
    const records = loadSqliteRecords(db)
    const notes = scanVault(config.vaultPath)
    analyze(records, notes, report)

    if (mode === 'check') {
      report.ok = report.conflicts.length === 0 && report.duplicateIds.length === 0 && report.malformedNotes.length === 0
      return report
    }

    if (mode === 'reconcile') {
      report.message = 'Reconcile currently runs read-only check. Repair flags are reserved: --sqlite-wins, --vault-wins, --dry-run, --only, --allow-create.'
      report.ok = report.conflicts.length === 0 && report.duplicateIds.length === 0 && report.malformedNotes.length === 0
      return report
    }

    if (report.conflicts.length || report.duplicateIds.length || report.malformedNotes.length || report.vaultMissingFromSQLite.length) {
      report.ok = false
      report.message = 'Import refused because the vault is not clean.'
      return report
    }

    importVaultChanges(db, config.vaultPath, records, notes, report)
    report.ok = true
    return report
  } finally {
    db.close()
  }
}

function exportVault(config: PMBrainConfig, report: VaultSyncReport): VaultSyncReport {
  const db = openDatabase(config)
  try {
    db.exec(readSchemaSql())
    const records = loadSqliteRecords(db)
    const now = new Date().toISOString()
    const tx = db.transaction(() => {
      for (const record of records.values()) {
        const fullPath = join(config.vaultPath, record.path)
        const existing = existsSync(fullPath) ? parseMarkdownNote(config.vaultPath, fullPath) : null
        const editableBody = existing?.editableBody.trim() || defaultEditableBody(record)
        const markdown = renderRecord(record, now, editableBody)
        mkdirSync(dirname(fullPath), { recursive: true })
        writeFileSync(fullPath, markdown, 'utf8')
        upsertSyncState(db, record, now, recordContentHash(record, editableBody), 'synced')
        report.exported.push(record.path)
      }
    })
    tx()
    report.ok = true
    return report
  } finally {
    db.close()
  }
}

function importVaultChanges(
  db: Database,
  vaultPath: string,
  records: Map<string, SyncRecord>,
  notes: Map<string, VaultNote>,
  report: VaultSyncReport,
): void {
  const now = new Date().toISOString()
  const tx = db.transaction(() => {
    for (const [key, note] of notes.entries()) {
      const record = records.get(key)
      if (!record || !report.changedVaultNotes.includes(note.path)) {
        continue
      }

      const type = note.frontmatter.pmbrain_type as SyncType
      applyNoteToSqlite(db, type, note, now)
      const updatedRecord = loadSqliteRecords(db).get(key) ?? record
      const importedHash = recordContentHash(updatedRecord, note.editableBody)
      writeFileSync(join(vaultPath, note.path), renderRecord(updatedRecord, now, note.editableBody), 'utf8')
      db.query(`
        INSERT OR REPLACE INTO vault_sync_state (
          page_id, vault_path, last_sqlite_version_id, last_vault_hash, last_synced_at, sync_status, conflict_note
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(note.frontmatter.pmbrain_id, note.path, updatedRecord.sqliteVersionId, importedHash, now, 'imported', null)
      db.query(`
        INSERT INTO ingest_log (
          id, job_type, source_type, source_ref, status, started_at, finished_at,
          items_seen, items_created, items_updated, items_skipped, error_text, details_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        makeId('ingest'),
        'vault-sync import',
        'obsidian_vault',
        note.path,
        'accepted',
        now,
        now,
        1,
        0,
        1,
        0,
        null,
        JSON.stringify({ pmbrain_type: type, pmbrain_id: note.frontmatter.pmbrain_id }),
      )
      report.imported.push(note.path)
    }
  })
  tx()
}

function applyNoteToSqlite(db: Database, type: SyncType, note: VaultNote, now: string): void {
  const fm = note.frontmatter
  const id = fm.pmbrain_id
  if (type === 'project') {
    db.query(`
      UPDATE projects SET
        owner = ?, status = ?, priority = ?, health = ?, objective = ?, start_date = ?,
        target_date = ?, end_date = ?, progress_pct = ?, budget_baseline = ?,
        cost_actual = ?, program_id = ?, program_role = ?, updated_at = ?
      WHERE id = ?
    `).run(
      nullable(fm.owner),
      required(fm.status, 'status'),
      nullable(fm.priority),
      nullable(fm.health),
      nullable(fm.objective),
      nullable(fm.start_date),
      nullable(fm.target_date),
      nullable(fm.end_date),
      numberOrZero(fm.progress_pct),
      numberOrNull(fm.budget_baseline),
      numberOrNull(fm.cost_actual),
      nullable(fm.program_id),
      fm.program_role || 'standalone',
      now,
      id,
    )
    if (fm.title) {
      db.query('UPDATE pages SET title = ?, updated_at = ? WHERE id = ?').run(fm.title, now, id)
    }
    return
  }

  if (type === 'work_item') {
    db.query(`
      UPDATE work_items SET
        title = ?, description = ?, status = ?, priority = ?, severity = ?, owner = ?,
        due_date = ?, resolution = ?, tags = ?, updated_at = ?
      WHERE id = ?
    `).run(
      required(fm.title, 'title'),
      nullable(fm.description),
      required(fm.status, 'status'),
      nullable(fm.priority),
      nullable(fm.severity),
      nullable(fm.owner),
      nullable(fm.due_date),
      nullable(fm.resolution),
      nullable(fm.tags),
      now,
      id,
    )
    return
  }

  db.query(`
    UPDATE risks SET
      title = ?, category = ?, status = ?, probability = ?, impact = ?, mitigation = ?,
      contingency = ?, owner = ?, due_date = ?, updated_at = ?
    WHERE id = ?
  `).run(
    required(fm.title, 'title'),
    nullable(fm.category),
    required(fm.status, 'status'),
    Number(required(fm.probability, 'probability')),
    Number(required(fm.impact, 'impact')),
    nullable(fm.mitigation),
    nullable(fm.contingency),
    nullable(fm.owner),
    nullable(fm.due_date),
    now,
    id,
  )
}

function analyze(records: Map<string, SyncRecord>, notes: Map<string, VaultNote>, report: VaultSyncReport): void {
  const seen = new Map<string, string>()

  for (const note of notes.values()) {
    const validation = validateNote(note)
    if (validation) {
      report.malformedNotes.push(`${note.path}: ${validation}`)
      continue
    }

    const key = recordKey(note.frontmatter.pmbrain_type as SyncType, note.frontmatter.pmbrain_id)
    const previous = seen.get(key)
    if (previous) {
      report.duplicateIds.push(`${key}: ${previous}, ${note.path}`)
      continue
    }
    seen.set(key, note.path)

    const record = records.get(key)
    if (!record) {
      report.vaultMissingFromSQLite.push(note.path)
      continue
    }

    if (note.path !== record.path) {
      report.malformedNotes.push(`${note.path}: expected ${record.path}`)
      continue
    }

    const vaultChanged = note.frontmatter.content_hash !== noteContentHash(note)
    const sqliteChanged = note.frontmatter.sqlite_version_id !== record.sqliteVersionId
    if (vaultChanged && sqliteChanged) {
      report.conflicts.push(note.path)
    } else if (vaultChanged) {
      report.changedVaultNotes.push(note.path)
    } else if (sqliteChanged) {
      report.changedSqliteRecords.push(record.path)
    }
  }

  for (const record of records.values()) {
    if (!seen.has(recordKey(record.type, record.id))) {
      report.sqliteMissingFromVault.push(record.path)
    }
  }
}

function validateNote(note: VaultNote): string | null {
  for (const field of REQUIRED_FRONTMATTER) {
    if (!note.frontmatter[field]) {
      return `missing required frontmatter field ${field}`
    }
  }

  const type = note.frontmatter.pmbrain_type
  if (!isSyncType(type)) {
    return `unknown pmbrain_type ${type}`
  }

  const expectedFolder = `${SYNC_CONTRACT[type].folder}/`
  if (!note.path.startsWith(expectedFolder)) {
    return `invalid folder placement for ${type}; expected ${expectedFolder}`
  }

  if (!isValidIsoDate(note.frontmatter.last_synced_at)) {
    return 'malformed last_synced_at'
  }

  if (!/^[a-f0-9]{64}$/.test(note.frontmatter.content_hash)) {
    return 'malformed content_hash'
  }

  return null
}

function loadSqliteRecords(db: Database): Map<string, SyncRecord> {
  const records = new Map<string, SyncRecord>()
  for (const entry of Object.values(SYNC_CONTRACT)) {
    const rows = db.query(entry.selectSql).all() as Array<Record<string, unknown>>
    for (const row of rows) {
      const id = String(row.id)
      const path = `${entry.folder}/${safeFileName(String(row[entry.pathField]))}.md`
      const record: SyncRecord = {
        type: entry.type,
        id,
        title: String(row.title ?? id),
        path,
        sqliteVersionId: String(row.sqlite_version_id ?? row.updated_at ?? ''),
        updatedAt: String(row.updated_at ?? ''),
        data: row,
      }
      records.set(recordKey(record.type, record.id), record)
    }
  }
  return records
}

function scanVault(vaultPath: string): Map<string, VaultNote> {
  const notes = new Map<string, VaultNote>()
  for (const folder of Object.values(SYNC_CONTRACT).map((entry) => entry.folder)) {
    const root = join(vaultPath, folder)
    if (!existsSync(root)) {
      continue
    }
    for (const path of walkMarkdown(root)) {
      const note = parseMarkdownNote(vaultPath, path)
      const type = note.frontmatter.pmbrain_type
      const id = note.frontmatter.pmbrain_id
      const key = type && id && isSyncType(type) ? recordKey(type, id) : `malformed:${note.path}`
      notes.set(`${key}:${note.path}`, note)
    }
  }

  const byIdentity = new Map<string, VaultNote>()
  for (const note of notes.values()) {
    const type = note.frontmatter.pmbrain_type
    const id = note.frontmatter.pmbrain_id
    const key = type && id && isSyncType(type) ? recordKey(type, id) : `malformed:${note.path}`
    byIdentity.set(byIdentity.has(key) ? `${key}:${note.path}` : key, note)
  }
  return byIdentity
}

function parseMarkdownNote(vaultPath: string, path: string): VaultNote {
  const raw = readFileSync(path, 'utf8')
  const relPath = relative(vaultPath, path).split(sep).join('/')
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) {
    return { path: relPath, frontmatter: {}, body: raw, editableBody: '' }
  }
  const body = match[2] ?? ''
  return {
    path: relPath,
    frontmatter: parseFrontmatter(match[1] ?? ''),
    body,
    editableBody: extractEditableBody(body),
  }
}

function renderRecord(record: SyncRecord, syncedAt: string, editableBody: string): string {
  const entry = SYNC_CONTRACT[record.type]
  const frontmatter: Record<string, unknown> = {
    pmbrain_type: record.type,
    pmbrain_id: record.id,
    sync_status: 'synced',
    last_synced_at: syncedAt,
    sqlite_version_id: record.sqliteVersionId,
    content_hash: recordContentHash(record, editableBody),
  }

  for (const field of [...entry.readonly, ...entry.editable]) {
    if (field === 'pmbrain_type' || field === 'pmbrain_id' || field === 'sqlite_version_id' || field === 'content_hash' || field === 'editable_body') {
      continue
    }
    if (record.data[field] !== undefined) {
      frontmatter[field] = record.data[field]
    }
  }

  return `---\n${formatFrontmatter(frontmatter)}---\n\n# ${record.title}\n\n## SQLite Projection\n\n${renderProjection(record)}\n\n## Editable Notes\n\n<!-- PMBRAIN:EDITABLE:START -->\n${editableBody.trim()}\n<!-- PMBRAIN:EDITABLE:END -->\n`
}

function renderProjection(record: SyncRecord): string {
  const lines: string[] = []
  for (const [key, value] of Object.entries(record.data)) {
    if (value === null || value === undefined || key === 'sqlite_version_id') {
      continue
    }
    lines.push(`- ${key}: ${String(value)}`)
  }
  return lines.join('\n')
}

function parseFrontmatter(yaml: string): Record<string, string> {
  const data: Record<string, string> = {}
  for (const line of yaml.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/)
    if (!match) {
      continue
    }
    data[match[1]] = unquoteYaml(match[2].trim())
  }
  return data
}

function formatFrontmatter(data: Record<string, unknown>): string {
  return Object.entries(data)
    .map(([key, value]) => `${key}: ${formatYamlValue(value)}\n`)
    .join('')
}

function formatYamlValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return ''
  }
  const text = String(value)
  if (/^[A-Za-z0-9_.:/@ -]+$/.test(text) && !text.startsWith(' ') && !text.endsWith(' ')) {
    return text
  }
  return JSON.stringify(text)
}

function unquoteYaml(value: string): string {
  if (!value) {
    return ''
  }
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    try {
      return JSON.parse(value)
    } catch {
      return value.slice(1, -1)
    }
  }
  return value
}

function extractEditableBody(body: string): string {
  const match = body.match(/<!-- PMBRAIN:EDITABLE:START -->([\s\S]*?)<!-- PMBRAIN:EDITABLE:END -->/)
  return match ? match[1].trim() : ''
}

function recordContentHash(record: SyncRecord, editableBody: string): string {
  const editable: Record<string, unknown> = {}
  for (const field of SYNC_CONTRACT[record.type].editable) {
    editable[field] = field === 'editable_body' ? editableBody.trim() : String(record.data[field] ?? '')
  }
  return sha256(stableJson(editable))
}

function noteContentHash(note: VaultNote): string {
  const type = note.frontmatter.pmbrain_type as SyncType
  const editable: Record<string, string> = {}
  for (const field of SYNC_CONTRACT[type].editable) {
    editable[field] = field === 'editable_body' ? note.editableBody.trim() : note.frontmatter[field] ?? ''
  }
  return sha256(stableJson(editable))
}

function upsertSyncState(db: Database, record: SyncRecord, syncedAt: string, hash: string, status: string): void {
  db.query(`
    INSERT INTO vault_sync_state (
      page_id, vault_path, last_sqlite_version_id, last_vault_hash, last_synced_at, sync_status, conflict_note
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(page_id) DO UPDATE SET
      vault_path = excluded.vault_path,
      last_sqlite_version_id = excluded.last_sqlite_version_id,
      last_vault_hash = excluded.last_vault_hash,
      last_synced_at = excluded.last_synced_at,
      sync_status = excluded.sync_status,
      conflict_note = excluded.conflict_note
  `).run(record.id, record.path, record.sqliteVersionId, hash, syncedAt, status, null)
}

function ensureContractFolders(vaultPath: string): void {
  for (const entry of Object.values(SYNC_CONTRACT)) {
    mkdirSync(join(vaultPath, entry.folder), { recursive: true })
  }
}

function walkMarkdown(root: string): string[] {
  const output: string[] = []
  for (const item of readdirSync(root)) {
    const path = join(root, item)
    const stat = statSync(path)
    if (stat.isDirectory()) {
      output.push(...walkMarkdown(path))
    } else if (item.toLowerCase().endsWith('.md')) {
      output.push(path)
    }
  }
  return output
}

function emptyReport(mode: SyncMode, vaultPath: string, unsupportedFlags: string[]): VaultSyncReport {
  return {
    ok: false,
    mode,
    vaultPath,
    exported: [],
    imported: [],
    sqliteMissingFromVault: [],
    vaultMissingFromSQLite: [],
    changedVaultNotes: [],
    changedSqliteRecords: [],
    conflicts: [],
    duplicateIds: [],
    malformedNotes: [],
    unsupportedFlags,
  }
}

function recordKey(type: SyncType, id: string): string {
  return `${type}:${id}`
}

function isSyncType(value: string): value is SyncType {
  return value === 'project' || value === 'work_item' || value === 'risk'
}

function isValidIsoDate(value: string): boolean {
  return !Number.isNaN(Date.parse(value)) && value.includes('T')
}

function safeFileName(value: string): string {
  return value.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function stableJson(value: Record<string, unknown>): string {
  return JSON.stringify(Object.keys(value).sort().reduce<Record<string, unknown>>((acc, key) => {
    acc[key] = value[key]
    return acc
  }, {}))
}

function defaultEditableBody(record: SyncRecord): string {
  if (record.type === 'project') {
    return 'Add project notes here. Editable fields live in frontmatter.'
  }
  if (record.type === 'work_item') {
    return 'Add work item context, acceptance notes, and evidence links here.'
  }
  return 'Add risk observations, mitigation notes, and evidence links here.'
}

function nullable(value: string | undefined): string | null {
  return value === undefined || value === '' ? null : value
}

function required(value: string | undefined, field: string): string {
  if (value === undefined || value === '') {
    throw new Error(`Missing required field ${field}`)
  }
  return value
}

function numberOrNull(value: string | undefined): number | null {
  return value === undefined || value === '' ? null : Number(value)
}

function numberOrZero(value: string | undefined): number {
  return value === undefined || value === '' ? 0 : Number(value)
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}
