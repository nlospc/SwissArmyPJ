import { loadConfig } from '../core/config'
import { listWorkPackages } from '../core/db'

export async function runWorkPackageList(args: string[]): Promise<void> {
  const config = loadConfig()

  let projectId: string | undefined
  let status: string | undefined

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--project-id' && i + 1 < args.length) projectId = args[++i]
    else if (arg === '--status' && i + 1 < args.length) status = args[++i]
  }

  const workPackages = listWorkPackages(config, projectId, status)

  console.log(JSON.stringify({
    ok: true,
    command: 'work-package-list',
    count: workPackages.length,
    workPackages,
  }, null, 2))
}
