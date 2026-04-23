export type PageType =
  | 'note'
  | 'project'
  | 'risk'
  | 'meeting'
  | 'decision'
  | 'artifact'
  | 'stakeholder'
  | 'process'
  | 'organization'
  | 'deliverable'
  | 'sprint'
  | 'index'

export interface PMBrainConfig {
  homeDir: string
  dbPath: string
  vaultPath: string
  embeddingProvider: string
  embeddingModel: string
}

export interface CommandContext {
  config: PMBrainConfig
}

export interface PageRecord {
  id: string
  slug: string
  title: string
  pageType: PageType
  canonicalPath?: string
  summary?: string
  status?: string
}

export interface ProjectInitInput {
  code: string
  name: string
  status?: string
  owner?: string
  budgetBaseline?: number
  programId?: string | null
  programRole?: 'program' | 'component' | 'standalone'
}

export interface RiskMatrixCell {
  probability: number
  impact: number
  count: number
}

export interface DoctorReport {
  ok: boolean
  dbPath: string
  schemaPath: string
  vaultPath: string
  notes: string[]
}

export interface StatsReport {
  pages: number
  projects: number
  risks: number
  stakeholders: number
  processes: number
  organizations: number
  chunks: number
}

export interface ProjectRecord {
  id: string
  code: string
  owner: string | null
  sponsor: string | null
  status: string
  priority: string | null
  health: string | null
  objective: string | null
  startDate: string | null
  targetDate: string | null
  endDate: string | null
  progressPct: number
  budgetBaseline: number | null
  costActual: number | null
  programId: string | null
  programRole: 'program' | 'component' | 'standalone'
  createdAt: string
  updatedAt: string
}
