import { loadConfig } from '../core/config'

export async function runVaultSync(args: string[]): Promise<void> {
  const config = loadConfig()
  const mode = args[0] ?? 'export'

  console.log(JSON.stringify({
    ok: true,
    command: 'vault-sync',
    mode,
    vaultPath: config.vaultPath,
    note: 'Vault projection and reconciliation are not implemented yet. This command is the placeholder contract.',
  }, null, 2))
}
