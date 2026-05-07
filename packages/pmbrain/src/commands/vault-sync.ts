import { loadConfig } from '../core/config'
import { ensureVaultSkeleton } from '../core/vault'
import { runVaultSyncEngine } from '../core/vault-sync-engine'

export async function runVaultSync(args: string[]): Promise<void> {
  const config = loadConfig()
  const mode = args[0] ?? 'export'
  const vaultCreated = ensureVaultSkeleton(config.vaultPath)
  const validModes = new Set(['export', 'check', 'import', 'reconcile'])

  if (!validModes.has(mode)) {
    console.error(`Unknown vault-sync mode: ${mode}`)
    console.error('Usage: vault-sync [export|check|import|reconcile]')
    process.exitCode = 1
    return
  }

  const report = runVaultSyncEngine(config, mode as 'export' | 'check' | 'import' | 'reconcile', args.slice(1))

  console.log(JSON.stringify({
    command: 'vault-sync',
    vaultCreated,
    ...report,
  }, null, 2))

  if (!report.ok) {
    process.exitCode = 1
  }
}
