import { loadConfig } from '../core/config'
import { listStakeholders } from '../core/db'

export async function runStakeholderList(args: string[]): Promise<void> {
  const config = loadConfig()

  let projectId: string | undefined

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--project-id' && i + 1 < args.length) projectId = args[++i]
  }

  const stakeholders = listStakeholders(config, projectId)

  console.log(JSON.stringify({
    ok: true,
    command: 'stakeholder-list',
    count: stakeholders.length,
    stakeholders,
  }, null, 2))
}
