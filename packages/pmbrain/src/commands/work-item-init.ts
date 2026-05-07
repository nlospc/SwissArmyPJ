import { loadConfig } from '../core/config'
import { insertWorkItem } from '../core/db'
import type { WorkItemInitInput } from '../core/types'

export async function runWorkItemInit(args: string[]): Promise<void> {
  const config = loadConfig()

  let projectId: string | undefined
  let title: string | undefined
  let description: string | undefined
  let itemType: string = 'issue'
  let status: string | undefined
  let priority: string | undefined
  let severity: string | undefined
  let owner: string | undefined
  let reporter: string | undefined
  let dueDate: string | undefined
  let tags: string | undefined

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--project-id' && i + 1 < args.length) projectId = args[++i]
    else if (arg === '--title' && i + 1 < args.length) title = args[++i]
    else if (arg === '--desc' && i + 1 < args.length) description = args[++i]
    else if (arg === '--type' && i + 1 < args.length) itemType = args[++i]
    else if (arg === '--status' && i + 1 < args.length) status = args[++i]
    else if (arg === '--priority' && i + 1 < args.length) priority = args[++i]
    else if (arg === '--severity' && i + 1 < args.length) severity = args[++i]
    else if (arg === '--owner' && i + 1 < args.length) owner = args[++i]
    else if (arg === '--reporter' && i + 1 < args.length) reporter = args[++i]
    else if (arg === '--due' && i + 1 < args.length) dueDate = args[++i]
    else if (arg === '--tags' && i + 1 < args.length) tags = args[++i]
  }

  if (!projectId) {
    console.error('Error: --project-id is required')
    process.exit(1)
  }
  if (!title) {
    console.error('Error: --title is required')
    process.exit(1)
  }

  const input: WorkItemInitInput = {
    projectId,
    title,
    description,
    itemType: itemType as any,
    status: status as WorkItemInitInput['status'],
    priority: priority as WorkItemInitInput['priority'],
    severity: severity as WorkItemInitInput['severity'],
    owner,
    reporter,
    dueDate,
    tags,
  }

  const workItem = insertWorkItem(config, input)

  console.log(JSON.stringify({
    ok: true,
    command: 'work-item-init',
    workItem,
  }, null, 2))
}
