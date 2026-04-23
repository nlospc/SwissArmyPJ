import { runDoctor } from './commands/doctor'
import { runProjectInit } from './commands/project-init'
import { runProjectDelete } from './commands/project-delete'
import { runProjectUpdate } from './commands/project-update'
import { runRiskMatrix } from './commands/risk-matrix'
import { runServe } from './commands/serve'
import { runSetup } from './commands/setup'
import { runStats } from './commands/stats'
import { runVaultSync } from './commands/vault-sync'

function printHelp(): void {
  console.log(`PMBrain CLI

Usage:
  bun run src/cli.ts <command> [args]

Commands:
  help                       Show this help
  setup                      Prepare local config and initialize SQLite schema
  doctor                     Check database, schema, and required tables
  stats                      Show current database counts
  serve                      Start MCP stub entrypoint
  project-init <code> <name> Create the first project records in SQLite
  project-delete <code|id>  Delete a project and all associated records (requires confirmation)
  project-update <code|id> <field=value>... Update project fields
  risk-matrix [projectCode]  Query the current risk matrix from SQLite
  vault-sync [mode]          Run placeholder vault sync
`)
}

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2)

  switch (command) {
    case undefined:
    case 'help':
    case '--help':
    case '-h':
      printHelp()
      return
    case 'setup':
      await runSetup()
      return
    case 'doctor':
      await runDoctor()
      return
    case 'stats':
      await runStats()
      return
    case 'serve':
      await runServe()
      return
    case 'project-init':
      await runProjectInit(args)
      return
    case 'project-delete':
      await runProjectDelete(args)
      return
    case 'project-update':
      await runProjectUpdate(args)
      return
    case 'risk-matrix':
      await runRiskMatrix(args)
      return
    case 'vault-sync':
      await runVaultSync(args)
      return
    default:
      console.error(`Unknown command: ${command}`)
      printHelp()
      process.exitCode = 1
  }
}

void main()