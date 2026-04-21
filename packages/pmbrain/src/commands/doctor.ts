import { existsSync } from 'node:fs'
import { loadConfig } from '../core/config'
import { missingTables, schemaPath } from '../core/db'
import type { DoctorReport } from '../core/types'

export async function runDoctor(): Promise<void> {
  const config = loadConfig()
  const report: DoctorReport = {
    ok: true,
    dbPath: config.dbPath,
    schemaPath: schemaPath(),
    vaultPath: config.vaultPath,
    notes: [],
  }

  if (!existsSync(config.dbPath)) {
    report.ok = false
    report.notes.push('Database file does not exist yet. Run `pmbrain setup`.')
  }

  if (!existsSync(report.schemaPath)) {
    report.ok = false
    report.notes.push('Schema file is missing.')
  }

  if (existsSync(config.dbPath) && existsSync(report.schemaPath)) {
    const missing = missingTables(config)
    if (missing.length > 0) {
      report.ok = false
      report.notes.push(`Missing tables: ${missing.join(', ')}`)
    }
  }

  if (!existsSync(config.vaultPath)) {
    report.notes.push('Vault path does not exist yet. Run `pmbrain setup` to create it.')
  }

  if (report.notes.length === 0) {
    report.notes.push('Database, schema, and required tables look healthy.')
  }

  console.log(JSON.stringify(report, null, 2))
}
