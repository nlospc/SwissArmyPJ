import { loadConfig } from '../core/config'
import { listEvidence } from '../core/db'

export async function runEvidenceList(args: string[]): Promise<void> {
  const config = loadConfig()

  let projectId: string | undefined
  let entityType: string | undefined
  let entityId: string | undefined

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--project-id' && i + 1 < args.length) projectId = args[++i]
    else if (arg === '--entity-type' && i + 1 < args.length) entityType = args[++i]
    else if (arg === '--entity-id' && i + 1 < args.length) entityId = args[++i]
  }

  const evidence = listEvidence(config, projectId, entityType, entityId)

  console.log(JSON.stringify({
    ok: true,
    command: 'evidence-list',
    count: evidence.length,
    evidence,
  }, null, 2))
}
