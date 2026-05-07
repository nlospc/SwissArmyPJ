import { runDoctor } from './commands/doctor'
import { runProjectInit } from './commands/project-init'
import { runProjectDelete } from './commands/project-delete'
import { runProjectUpdate } from './commands/project-update'
import { runRiskMatrix } from './commands/risk-matrix'
import { runServe } from './commands/serve'
import { runSetup } from './commands/setup'
import { runStats } from './commands/stats'
import { runStakeholderInit } from './commands/stakeholder-init'
import { runStakeholderList } from './commands/stakeholder-list'
import { runWorkItemInit } from './commands/work-item-init'
import { runWorkItemList } from './commands/work-item-list'
import { runVaultSync } from './commands/vault-sync'
import { runWorkPackageInit } from './commands/work-package-init'
import { runWorkPackageList } from './commands/work-package-list'
import { runProcessInit } from './commands/process-init'
import { runProcessList } from './commands/process-list'
import { runOrganizationInit } from './commands/organization-init'
import { runOrganizationList } from './commands/organization-list'
import { runEvidenceAdd } from './commands/evidence-add'
import { runEvidenceList } from './commands/evidence-list'

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
  stakeholder-init           Create a stakeholder (--name required, --email, --org, --project-id, --project-role optional)
  stakeholder-list           List all stakeholders (--project-id to filter)
  work-item-init             Create a work item (--project-id and --title required, --type issue/defect/feature/action)
  work-item-list             List work items (--project-id, --type, --status to filter)
  work-package-init          Create a work package (--project-id and --name required, --desc, --responsible, --start, --end, --status, --progress)
  work-package-list          List work packages (--project-id, --status to filter)
  process-init               Create a process (--project-id and --name required, --desc, --scope, --owner, --status, --version)
  process-list               List processes (--project-id, --status to filter)
  organization-init          Create an organization (--name required, --parent-id, --code, --desc, --level)
  organization-list          List organizations (--parent-id to filter)
  evidence-add               Add evidence (--project-id and --title required, --entity-type, --entity-id, --source-type, --source-uri, --captured, --content, --file)
  evidence-list              List evidence (--project-id, --entity-type, --entity-id to filter)
  vault-sync [mode]          Sync SQLite records with Obsidian vault (export|check|import|reconcile)
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
    case 'stakeholder-init':
      await runStakeholderInit(args)
      return
    case 'stakeholder-list':
      await runStakeholderList(args)
      return
    case 'work-item-init':
      await runWorkItemInit(args)
      return
    case 'work-item-list':
      await runWorkItemList(args)
      return
    case 'work-package-init':
      await runWorkPackageInit(args)
      return
    case 'work-package-list':
      await runWorkPackageList(args)
      return
    case 'process-init':
      await runProcessInit(args)
      return
    case 'process-list':
      await runProcessList(args)
      return
    case 'organization-init':
      await runOrganizationInit(args)
      return
    case 'organization-list':
      await runOrganizationList(args)
      return
    case 'evidence-add':
      await runEvidenceAdd(args)
      return
    case 'evidence-list':
      await runEvidenceList(args)
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
