import { loadConfig } from '../core/config'
import { listOrganizations } from '../core/db'

export async function runOrganizationList(args: string[]): Promise<void> {
  const config = loadConfig()

  let parentId: string | undefined

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--parent-id' && i + 1 < args.length) parentId = args[++i]
  }

  const organizations = listOrganizations(config, parentId)

  console.log(JSON.stringify({
    ok: true,
    command: 'organization-list',
    count: organizations.length,
    organizations,
  }, null, 2))
}
