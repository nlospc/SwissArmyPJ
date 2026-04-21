import { loadConfig } from '../core/config'
import { collectStats } from '../core/db'

export async function runStats(): Promise<void> {
  const config = loadConfig()
  console.log(JSON.stringify({
    ok: true,
    command: 'stats',
    dbPath: config.dbPath,
    stats: collectStats(config),
  }, null, 2))
}
