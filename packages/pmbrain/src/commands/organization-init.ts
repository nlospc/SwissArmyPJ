import { loadConfig } from '../core/config'
import { insertOrganization } from '../core/db'
import type { OrganizationInitInput } from '../core/types'

export async function runOrganizationInit(args: string[]): Promise<void> {
  const config = loadConfig()

  let parentId: string | undefined
  let name: string | undefined
  let code: string | undefined
  let description: string | undefined
  let level: string | undefined

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--parent-id' && i + 1 < args.length) parentId = args[++i]
    else if (arg === '--name' && i + 1 < args.length) name = args[++i]
    else if (arg === '--code' && i + 1 < args.length) code = args[++i]
    else if (arg === '--desc' && i + 1 < args.length) description = args[++i]
    else if (arg === '--level' && i + 1 < args.length) level = args[++i]
  }

  if (!name) {
    console.error('Error: --name is required')
    process.exit(1)
  }

  const input: OrganizationInitInput = {
    parentId,
    name,
    code,
    description,
    level: level ? parseInt(level, 10) : undefined,
  }

  const organization = insertOrganization(config, input)

  console.log(JSON.stringify({
    ok: true,
    command: 'organization-init',
    organization,
  }, null, 2))
}
