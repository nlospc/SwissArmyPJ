import { loadConfig } from '../core/config'
import { insertWorkPackage } from '../core/db'
import type { WorkPackageInitInput } from '../core/types'

export async function runWorkPackageInit(args: string[]): Promise<void> {
  const config = loadConfig()

  let projectId: string | undefined
  let name: string | undefined
  let description: string | undefined
  let responsible: string | undefined
  let startDate: string | undefined
  let endDate: string | undefined
  let status: string | undefined
  let progressPct: string | undefined

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--project-id' && i + 1 < args.length) projectId = args[++i]
    else if (arg === '--name' && i + 1 < args.length) name = args[++i]
    else if (arg === '--desc' && i + 1 < args.length) description = args[++i]
    else if (arg === '--responsible' && i + 1 < args.length) responsible = args[++i]
    else if (arg === '--start' && i + 1 < args.length) startDate = args[++i]
    else if (arg === '--end' && i + 1 < args.length) endDate = args[++i]
    else if (arg === '--status' && i + 1 < args.length) status = args[++i]
    else if (arg === '--progress' && i + 1 < args.length) progressPct = args[++i]
  }

  if (!projectId) {
    console.error('Error: --project-id is required')
    process.exit(1)
  }
  if (!name) {
    console.error('Error: --name is required')
    process.exit(1)
  }

  const input: WorkPackageInitInput = {
    projectId,
    name,
    description,
    responsible,
    startDate,
    endDate,
    status: status as any,
    progressPct: progressPct ? parseFloat(progressPct) : undefined,
  }

  const workPackage = insertWorkPackage(config, input)

  console.log(JSON.stringify({
    ok: true,
    command: 'work-package-init',
    workPackage,
  }, null, 2))
}
