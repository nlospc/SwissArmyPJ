import { loadConfig } from '../core/config'
import { findProjectByCodeOrId, updateProjectById } from '../core/db'

export async function runProjectUpdate(args: string[]): Promise<void> {
  if (args.length < 2) {
    console.error('Usage: pmbrain project-update <code|id> <field=value>...')
    console.error('Example: project-update OPS-06 owner=黄敏敏 status=active')
    console.error('Supported fields: code, name, owner, status, budget_baseline, program_id, program_role, progress_pct, description')
    process.exitCode = 1
    return
  }

  const config = loadConfig()
  const [codeOrId, ...fieldArgs] = args

  const project = findProjectByCodeOrId(config, codeOrId)
  if (!project) {
    console.error(`Project not found: ${codeOrId}`)
    process.exitCode = 1
    return
  }

  // Parse field=value arguments
  const updates: Record<string, any> = {}
  for (const fieldArg of fieldArgs) {
    const [field, value] = fieldArg.split('=', 2)
    if (value === undefined) {
      console.error(`Invalid format for ${fieldArg}, expected field=value`)
      process.exitCode = 1
      return
    }

    // Type coercion
    if (field === 'budget_baseline' || field === 'progress_pct') {
      updates[field] = Number(value)
    } else if (value === 'null') {
      updates[field] = null
    } else {
      updates[field] = value
    }
  }

  if (Object.keys(updates).length === 0) {
    console.error('No updates provided')
    console.error('Example: project-update OPS-06 owner=黄敏敏')
    process.exitCode = 1
    return
  }

  const result = updateProjectById(config, project.id, updates)
  console.log(JSON.stringify(result, null, 2))

  if (result.updated) {
    console.log(`\n✅ Project ${result.projectCode} updated successfully`)
  } else {
    console.error(`\n❌ Failed to update project: ${result.message}`)
    process.exitCode = 1
  }
}