import { loadConfig } from '../core/config'
import { insertProject } from '../core/db'
import type { ProjectInitInput } from '../core/types'

export async function runProjectInit(args: string[]): Promise<void> {
  const config = loadConfig()
  const [code, ...nameParts] = args
  const name = nameParts.join(' ').trim()

  const input: ProjectInitInput = {
    code: code ?? 'PMBRAIN-DEMO',
    name: name || 'Untitled Project',
    status: 'planning',
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
