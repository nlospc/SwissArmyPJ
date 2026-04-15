import { existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type { PMBrainConfig } from './types'

const DEFAULT_HOME = '.pmbrain'
const DEFAULT_DB = '.pmbrain/pmbrain.db'
const DEFAULT_VAULT = '../vault'

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
