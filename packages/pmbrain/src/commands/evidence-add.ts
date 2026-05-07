import { loadConfig } from '../core/config'
import { addEvidence } from '../core/db'
import type { EvidenceInitInput } from '../core/types'

export async function runEvidenceAdd(args: string[]): Promise<void> {
  const config = loadConfig()

  let projectId: string | undefined
  let entityType: string | undefined
  let entityId: string | undefined
  let title: string | undefined
  let sourceType: string = 'meeting_note'
  let sourceUri: string | undefined
  let capturedAt: string | undefined
  let contentText: string | undefined
  let filePath: string | undefined

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--project-id' && i + 1 < args.length) projectId = args[++i]
    else if (arg === '--entity-type' && i + 1 < args.length) entityType = args[++i]
    else if (arg === '--entity-id' && i + 1 < args.length) entityId = args[++i]
    else if (arg === '--title' && i + 1 < args.length) title = args[++i]
    else if (arg === '--source-type' && i + 1 < args.length) sourceType = args[++i]
    else if (arg === '--source-uri' && i + 1 < args.length) sourceUri = args[++i]
    else if (arg === '--captured' && i + 1 < args.length) capturedAt = args[++i]
    else if (arg === '--content' && i + 1 < args.length) contentText = args[++i]
    else if (arg === '--file' && i + 1 < args.length) filePath = args[++i]
  }

  if (!projectId) {
    console.error('Error: --project-id is required')
    process.exit(1)
  }
  if (!title) {
    console.error('Error: --title is required')
    process.exit(1)
  }

  const input: EvidenceInitInput = {
    projectId,
    entityType,
    entityId,
    title,
    sourceType: sourceType as any,
    sourceUri,
    capturedAt,
    contentText,
    filePath,
  }

  const evidence = addEvidence(config, input)

  console.log(JSON.stringify({
    ok: true,
    command: 'evidence-add',
    evidence,
  }, null, 2))
}
