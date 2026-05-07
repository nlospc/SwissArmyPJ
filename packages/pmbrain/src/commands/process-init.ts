import { loadConfig } from '../core/config'
import { insertProcess } from '../core/db'
import type { ProcessInitInput } from '../core/types'

export async function runProcessInit(args: string[]): Promise<void> {
  const config = loadConfig()

  let projectId: string | undefined
  let name: string | undefined
  let description: string | undefined
  let scope: string | undefined
  let owner: string | undefined
  let status: string | undefined
  let version: string | undefined

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--project-id' && i + 1 < args.length) projectId = args[++i]
    else if (arg === '--name' && i + 1 < args.length) name = args[++i]
    else if (arg === '--desc' && i + 1 < args.length) description = args[++i]
    else if (arg === '--scope' && i + 1 < args.length) scope = args[++i]
    else if (arg === '--owner' && i + 1 < args.length) owner = args[++i]
    else if (arg === '--status' && i + 1 < args.length) status = args[++i]
    else if (arg === '--version' && i + 1 < args.length) version = args[++i]
  }

  if (!projectId) {
    console.error('Error: --project-id is required')
    globalThis.process.exit(1)
  }
  if (!name) {
    console.error('Error: --name is required')
    globalThis.process.exit(1)
  }

  const input: ProcessInitInput = {
    projectId: projectId as string,
    name: name as string,
    description,
    scope,
    owner,
    status: status as any,
    version: version ? parseInt(version, 10) : undefined,
  }

  const processRecord = insertProcess(config, input)

  console.log(JSON.stringify({
    ok: true,
    command: 'process-init',
    process: processRecord,
  }, null, 2))
}
