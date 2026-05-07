import { loadConfig } from '../core/config'
import { listProcesses } from '../core/db'

export async function runProcessList(args: string[]): Promise<void> {
  const config = loadConfig()

  let projectId: string | undefined
  let status: string | undefined

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--project-id' && i + 1 < args.length) projectId = args[++i]
    else if (arg === '--status' && i + 1 < args.length) status = args[++i]
  }

  const processes = listProcesses(config, projectId, status)

  console.log(JSON.stringify({
    ok: true,
    command: 'process-list',
    count: processes.length,
    processes,
  }, null, 2))
}
