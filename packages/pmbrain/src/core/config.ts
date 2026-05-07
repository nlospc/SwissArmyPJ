import { existsSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { PMBrainConfig } from './types'

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const PACKAGES_ROOT = resolve(PACKAGE_ROOT, '..')
const DEFAULT_HOME = join(PACKAGE_ROOT, '.pmbrain')
const DEFAULT_DB = join(DEFAULT_HOME, 'pmbrain.db')
const DEFAULT_VAULT = join(PACKAGES_ROOT, 'vault')

export function loadConfig(): PMBrainConfig {
  return {
    homeDir: resolve(process.env.PMBRAIN_HOME ?? DEFAULT_HOME),
    dbPath: resolve(process.env.PMBRAIN_DB_PATH ?? DEFAULT_DB),
    vaultPath: resolve(process.env.PMBRAIN_VAULT_PATH ?? DEFAULT_VAULT),
    embeddingProvider: process.env.PMBRAIN_EMBEDDING_PROVIDER ?? 'openai',
    embeddingModel: process.env.PMBRAIN_EMBEDDING_MODEL ?? 'text-embedding-3-large',
  }
}

export function ensureConfigDirs(config: PMBrainConfig): void {
  if (!existsSync(config.homeDir)) {
    mkdirSync(config.homeDir, { recursive: true })
  }

  const dbDir = dirname(config.dbPath)
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true })
  }
}
