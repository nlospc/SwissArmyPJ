import { loadConfig } from '../core/config'
import { insertProject } from '../core/db'
import type { ProjectInitInput } from '../core/types'

export async function runProjectInit(args: string[]): Promise<void> {
  const config = loadConfig()
  
  // Parse flags: --owner X --budget 100000
  let owner: string | undefined
  let budgetBaseline: number | undefined
  const positional: string[] = []
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--owner' && i + 1 < args.length) {
      owner = args[++i]
    } else if (arg === '--budget' && i + 1 < args.length) {
      budgetBaseline = parseFloat(args[++i])
    } else {
      positional.push(arg)
    }
  }
  
  const [code, ...nameParts] = positional
  const name = nameParts.join(' ').trim()

  const input: ProjectInitInput = {
    code: code ?? 'PMBRAIN-DEMO',
    name: name || 'Untitled Project',
    status: 'planning',
    owner,
    budgetBaseline,
  }

  const project = insertProject(config, input)

  console.log(JSON.stringify({
    ok: true,
    command: 'project-init',
    project,
    vaultPath: config.vaultPath,
    note: 'Project rows, initial page version, and sync state were created.',
  }, null, 2))
}
