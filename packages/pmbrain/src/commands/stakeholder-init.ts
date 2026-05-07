import { loadConfig } from '../core/config'
import { insertStakeholder, addStakeholderToProject } from '../core/db'
import type { StakeholderInitInput } from '../core/types'

export async function runStakeholderInit(args: string[]): Promise<void> {
  const config = loadConfig()

  let name: string | undefined
  let email: string | undefined
  let phone: string | undefined
  let title: string | undefined
  let organization: string | undefined
  let influence: string | undefined
  let interest: string | undefined
  let engagementLevel: string | undefined
  let notes: string | undefined
  let projectId: string | undefined
  let projectRole: string | undefined

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--name' && i + 1 < args.length) name = args[++i]
    else if (arg === '--email' && i + 1 < args.length) email = args[++i]
    else if (arg === '--phone' && i + 1 < args.length) phone = args[++i]
    else if (arg === '--title' && i + 1 < args.length) title = args[++i]
    else if (arg === '--org' && i + 1 < args.length) organization = args[++i]
    else if (arg === '--influence' && i + 1 < args.length) influence = args[++i]
    else if (arg === '--interest' && i + 1 < args.length) interest = args[++i]
    else if (arg === '--engagement' && i + 1 < args.length) engagementLevel = args[++i]
    else if (arg === '--notes' && i + 1 < args.length) notes = args[++i]
    else if (arg === '--project-id' && i + 1 < args.length) projectId = args[++i]
    else if (arg === '--project-role' && i + 1 < args.length) projectRole = args[++i]
  }

  if (!name) {
    console.error('Error: --name is required')
    process.exit(1)
  }

  const input: StakeholderInitInput = {
    name,
    email,
    phone,
    title,
    organization,
    influence: influence as StakeholderInitInput['influence'],
    interest: interest as StakeholderInitInput['interest'],
    engagementLevel: engagementLevel as StakeholderInitInput['engagementLevel'],
    notes,
  }

  const stakeholder = insertStakeholder(config, input)

  // Optionally add to project
  let projectResult = undefined
  if (projectId) {
    projectResult = addStakeholderToProject(config, projectId, stakeholder.id, projectRole || 'stakeholder')
  }

  console.log(JSON.stringify({
    ok: true,
    command: 'stakeholder-init',
    stakeholder,
    projectAssignment: projectResult,
  }, null, 2))
}
