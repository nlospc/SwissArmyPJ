/**
 * PMBrain SDK — programmatic API for external consumers (e.g., SwissArmyPM).
 *
 * This module re-exports core operations so that consumers can import from
 * `pmbrain` without shelling out to the CLI.
 *
 * Currently a skeleton; real implementations will be wired in as commands
 * stabilize.
 */

export interface PMBrainConfig {
  homeDir: string;
  dbPath: string;
  vaultPath: string;
}

export interface PageRecord {
  id: string;
  slug: string;
  title: string;
  pageType: string;
  summary?: string;
  status?: string;
}

export interface SearchResult {
  pageId: string;
  section: string;
  content: string;
  score: number;
}

// Placeholder — will be implemented when core/db.ts is stabilized
export class PMBrainClient {
  constructor(private config: PMBrainConfig) {}

  async health(): Promise<{ ok: boolean; dbPath: string }> {
    return { ok: true, dbPath: this.config.dbPath };
  }
}
