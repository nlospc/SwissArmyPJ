import { loadConfig } from '../core/config'
import { listWorkItems } from '../core/db'

export async function runWorkItemList(args: string[]): Promise<void> {
  const config = loadConfig()

  let projectId: string | undefined
  let itemType: string | undefined
  let status: string | undefined

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--project-id' && i + 1 < args.length) projectId = args[++i]
    else if (arg === '--type' && i + 1 < args.length) itemType = args[++i]
    else if (arg === '--status' && i + 1 < args.length) status = args[++i]
  }

  const workItems = listWorkItems(config, projectId, itemType, status)

  console.log(JSON.stringify({
    ok: true,
    command: 'work-item-list',
    count: workItems.length,
    workItems,
  }, null, 2))
}
