import { afterEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Database } from 'bun:sqlite'
import type { PMBrainConfig } from '../src/core/types'
import { readSchemaSql } from '../src/core/db'
import { runVaultSyncEngine } from '../src/core/vault-sync-engine'

const roots: string[] = []

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

describe('vault sync', () => {
  test('export produces deterministic Markdown projection', () => {
    const config = fixture()
    seed(config)

    const report = runVaultSyncEngine(config, 'export')
    expect(report.ok).toBe(true)
    expect(report.exported.sort()).toEqual([
      '10_Projects/OPS-01.md',
      '30_WorkItems/work_item_1.md',
      '40_Risks/risk_1.md',
    ])

    const markdown = normalizeExport(readFileSync(join(config.vaultPath, '10_Projects/OPS-01.md'), 'utf8'))
    expect(markdown).toBe(`---
pmbrain_type: project
pmbrain_id: project_1
sync_status: synced
last_synced_at: <ts>
sqlite_version_id: 2026-01-02T00:00:00.000Z
content_hash: <hash>
code: OPS-01
created_at: 2026-01-01T00:00:00.000Z
updated_at: 2026-01-02T00:00:00.000Z
title: OPS-01 Operations
owner: Alice
status: planning
priority: medium
health: green
objective: Launch operations
start_date: 
target_date: 
end_date: 
progress_pct: 10
budget_baseline: 
cost_actual: 
program_id: 
program_role: standalone
---

# OPS-01 Operations

## SQLite Projection

- id: project_1
- code: OPS-01
- title: OPS-01 Operations
- owner: Alice
- status: planning
- priority: medium
- health: green
- objective: Launch operations
- progress_pct: 10
- program_role: standalone
- created_at: 2026-01-01T00:00:00.000Z
- updated_at: 2026-01-02T00:00:00.000Z

## Editable Notes

<!-- PMBRAIN:EDITABLE:START -->
Add project notes here. Editable fields live in frontmatter.
<!-- PMBRAIN:EDITABLE:END -->
`)
  })

  test('import updates only the edited SQLite row and records ingest log', () => {
    const config = fixture()
    seed(config)
    runVaultSyncEngine(config, 'export')

    const path = join(config.vaultPath, '10_Projects/OPS-01.md')
    const original = readFileSync(path, 'utf8')
    writeFileSync(path, original.replace('status: planning', 'status: active'), 'utf8')

    const check = runVaultSyncEngine(config, 'check')
    expect(check.changedVaultNotes).toEqual(['10_Projects/OPS-01.md'])

    const imported = runVaultSyncEngine(config, 'import')
    expect(imported.ok).toBe(true)
    expect(imported.imported).toEqual(['10_Projects/OPS-01.md'])
    expect(runVaultSyncEngine(config, 'check').changedVaultNotes).toEqual([])

    const db = new Database(config.dbPath)
    try {
      expect(db.query<{ status: string }, []>('SELECT status FROM projects WHERE id = "project_1"').get()?.status).toBe('active')
      expect(db.query<{ status: string }, []>('SELECT status FROM risks WHERE id = "risk_1"').get()?.status).toBe('open')
      expect(db.query<{ count: number }, []>('SELECT COUNT(*) AS count FROM ingest_log WHERE job_type = "vault-sync import"').get()?.count).toBe(1)
    } finally {
      db.close()
    }
  })

  test('check detects missing, duplicate, malformed, and conflicting records', () => {
    const config = fixture()
    seed(config)
    runVaultSyncEngine(config, 'export')

    rmSync(join(config.vaultPath, '40_Risks/risk_1.md'))

    const projectPath = join(config.vaultPath, '10_Projects/OPS-01.md')
    const project = readFileSync(projectPath, 'utf8')
    writeFileSync(join(config.vaultPath, '10_Projects/OPS-01-copy.md'), project, 'utf8')
    writeFileSync(join(config.vaultPath, '30_WorkItems/bad.md'), 'not frontmatter', 'utf8')

    const workItemPath = join(config.vaultPath, '30_WorkItems/work_item_1.md')
    const workItem = readFileSync(workItemPath, 'utf8')
    writeFileSync(workItemPath, workItem.replace('status: new', 'status: in_progress'), 'utf8')
    const db = new Database(config.dbPath)
    try {
      db.exec(`
        UPDATE work_items SET updated_at = '2026-01-03T00:00:00.000Z' WHERE id = 'work_item_1';
      `)
    } finally {
      db.close()
    }

    const report = runVaultSyncEngine(config, 'check')
    expect(report.ok).toBe(false)
    expect(report.sqliteMissingFromVault).toContain('40_Risks/risk_1.md')
    expect(report.duplicateIds.length).toBe(1)
    expect(report.malformedNotes.some((item) => item.includes('missing required frontmatter'))).toBe(true)
    expect(report.conflicts).toContain('30_WorkItems/work_item_1.md')
  })

  test('check mode never modifies database sync state or vault files', () => {
    const config = fixture()
    seed(config)
    runVaultSyncEngine(config, 'export')

    const path = join(config.vaultPath, '10_Projects/OPS-01.md')
    const beforeMtime = statSync(path).mtimeMs
    const beforeState = syncStateCount(config)

    const report = runVaultSyncEngine(config, 'check')
    expect(report.ok).toBe(true)
    expect(syncStateCount(config)).toBe(beforeState)
    expect(statSync(path).mtimeMs).toBe(beforeMtime)
  })
})

function fixture(): PMBrainConfig {
  const root = mkdtempSync(join(tmpdir(), 'pmbrain-vault-sync-'))
  roots.push(root)
  return {
    homeDir: root,
    dbPath: join(root, 'pmbrain.db'),
    vaultPath: join(root, 'vault'),
    embeddingProvider: 'test',
    embeddingModel: 'test',
  }
}

function seed(config: PMBrainConfig): void {
  const db = new Database(config.dbPath)
  try {
    db.exec(readSchemaSql())
    db.exec(`
      INSERT INTO pages (id, page_type, title, slug, status, summary, canonical_path, source_kind, checksum, created_at, updated_at, archived_at)
      VALUES
        ('project_1', 'project', 'OPS-01 Operations', 'ops-01', 'planning', null, null, 'test', null, '2026-01-01T00:00:00.000Z', '2026-01-02T00:00:00.000Z', null),
        ('work_item_1', 'work_item', 'Fix login', 'fix-login', 'new', null, null, 'test', null, '2026-01-01T00:00:00.000Z', '2026-01-02T00:00:00.000Z', null),
        ('risk_1', 'risk', 'Supplier delay', 'supplier-delay', 'open', null, null, 'test', null, '2026-01-01T00:00:00.000Z', '2026-01-02T00:00:00.000Z', null);

      INSERT INTO projects (id, code, owner, sponsor, status, priority, health, objective, start_date, target_date, end_date, progress_pct, budget_baseline, cost_actual, program_id, program_role, created_at, updated_at)
      VALUES ('project_1', 'OPS-01', 'Alice', null, 'planning', 'medium', 'green', 'Launch operations', null, null, null, 10, null, null, null, 'standalone', '2026-01-01T00:00:00.000Z', '2026-01-02T00:00:00.000Z');

      INSERT INTO page_versions (id, page_id, version_num, title, body_md, frontmatter_json, change_source, change_summary, author, created_at)
      VALUES ('project_version_1', 'project_1', 1, 'OPS-01 Operations', '', '{}', 'test', 'seed', 'test', '2026-01-02T00:00:00.000Z');

      INSERT INTO work_items (id, project_id, page_id, code, title, description, item_type, status, priority, severity, owner, reporter, due_date, tags, created_at, updated_at)
      VALUES ('work_item_1', 'project_1', 'work_item_1', 'ISSUE-001', 'Fix login', 'Login fails', 'issue', 'new', 'high', 'major', 'Bob', null, null, 'auth', '2026-01-01T00:00:00.000Z', '2026-01-02T00:00:00.000Z');

      INSERT INTO risks (id, project_id, page_id, title, category, status, probability, impact, mitigation, contingency, owner, identified_at, due_date, closed_at, created_at, updated_at)
      VALUES ('risk_1', 'project_1', 'risk_1', 'Supplier delay', 'schedule', 'open', 3, 4, 'Track weekly', null, 'Carol', '2026-01-01T00:00:00.000Z', null, null, '2026-01-01T00:00:00.000Z', '2026-01-02T00:00:00.000Z');
    `)
  } finally {
    db.close()
  }
}

function syncStateCount(config: PMBrainConfig): number {
  const db = new Database(config.dbPath)
  try {
    return db.query<{ count: number }, []>('SELECT COUNT(*) AS count FROM vault_sync_state').get()?.count ?? 0
  } finally {
    db.close()
  }
}

function normalizeExport(markdown: string): string {
  return markdown
    .replace(/last_synced_at: .+/g, 'last_synced_at: <ts>')
    .replace(/content_hash: [a-f0-9]{64}/g, 'content_hash: <hash>')
}
