import { mkdirSync } from 'node:fs'
import { ensureConfigDirs, loadConfig } from '../core/config'
import { bootstrapDatabase, readSchemaSql } from '../core/db'

export async function runSetup(): Promise<void> {
  const config = loadConfig()
  ensureConfigDirs(config)
  mkdirSync(config.vaultPath, { recursive: true })

  const boot = bootstrapDatabase(config)
  const schemaPreview = readSchemaSql().split('\n').slice(0, 6).join('\n')

  console.log(JSON.stringify({
    ok: true,
    command: 'setup',
    dbPath: boot.dbPath,
    schemaPath: boot.schemaPath,
    vaultPath: config.vaultPath,
    schemaApplied: boot.schemaApplied,
    note: 'SQLite bootstrap completed and required tables are initialized.',
    schemaPreview,
  }, null, 2))
}
