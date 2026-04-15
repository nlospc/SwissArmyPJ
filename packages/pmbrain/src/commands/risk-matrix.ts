import { loadConfig } from '../core/config'
import { getRiskMatrix } from '../core/db'

export async function runRiskMatrix(args: string[]): Promise<void> {
  const config = loadConfig()
  const projectCode = args[0] ?? null
  const matrix = getRiskMatrix(config, projectCode)

  console.log(JSON.stringify({
    ok: true,
    command: 'risk-matrix',
    projectCode,
    dbPath: config.dbPath,
    matrix,
  }, null, 2))
}
