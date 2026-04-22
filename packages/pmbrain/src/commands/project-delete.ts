import { loadConfig } from '../core/config'
import { findProjectByCodeOrId, deleteProjectById, type ProjectDeleteResult } from '../core/db'

export async function runProjectDelete(args: string[]): Promise<void> {
  const config = loadConfig()
  
  // Parse flags: --yes / -y to skip confirmation
  let skipConfirmation = false
  const positional: string[] = []
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--yes' || arg === '-y') {
      skipConfirmation = true
    } else {
      positional.push(arg)
    }
  }
  
  const [codeOrId] = positional
  
  if (!codeOrId) {
    console.error('Error: Missing project code or ID argument')
    console.log('Usage: bun run project-delete <project-code-or-id> [--yes|-y]')
    process.exitCode = 1
    return
  }
  
  // Find the project
  const project = findProjectByCodeOrId(config, codeOrId)
  
  if (!project) {
    console.log(JSON.stringify({
      ok: false,
      command: 'project-delete',
      error: `Project not found: ${codeOrId}`,
    }, null, 2))
    process.exitCode = 1
    return
  }
  
  // Show project info and require confirmation
  console.log(`
⚠️  WARNING: You are about to DELETE the following project:

  Project ID:   ${project.id}
  Project Code: ${project.code}
  Status:       ${project.status}
  Owner:        ${project.owner ?? 'none'}
  Created:      ${project.createdAt}

This operation will PERMANENTLY DELETE:
  - Project record
  - Project overview page and all versions
  - All stakeholders associated with this project
  - All work packages associated with this project  
  - All evidence associated with this project
  - All content chunks, links, and tags connected to these pages

⚠️  THIS ACTION CANNOT BE UNDONE!
`)
  
  if (!skipConfirmation) {
    // Wait for user confirmation via stdin
    console.log('Type "YES" (all caps) to confirm deletion, or anything else to cancel:')
    const answer = await readStdinLine()
    
    if (answer.trim() !== 'YES') {
      console.log('\nDeletion cancelled.')
      return
    }
  } else {
    console.log('Skipping confirmation due to --yes/-y flag.')
  }
  
  // Execute deletion
  console.log('\nDeleting project...')
  const result: ProjectDeleteResult = deleteProjectById(config, project.id)
  
  if (result.deleted) {
    console.log(JSON.stringify({
      ok: true,
      command: 'project-delete',
      deleted: result.deleted,
      projectId: result.projectId,
      projectCode: result.projectCode,
      message: result.message,
    }, null, 2))
  } else {
    console.log(JSON.stringify({
      ok: false,
      command: 'project-delete',
      deleted: false,
      projectId: result.projectId,
      projectCode: result.projectCode,
      error: result.message,
    }, null, 2))
    process.exitCode = 1
  }
}

/**
 * Read a single line from stdin for confirmation
 */
function readStdinLine(): Promise<string> {
  return new Promise((resolve) => {
    process.stdin.once('data', (data) => {
      resolve(data.toString())
    })
  })
}
