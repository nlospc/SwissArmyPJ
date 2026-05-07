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
  | 'work_item'

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
  workItems: number
  workPackages: number
  processes: number
  organizations: number
  evidence: number
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

export interface StakeholderInitInput {
  name: string
  email?: string
  phone?: string
  title?: string
  organization?: string
  influence?: 'high' | 'medium' | 'low'
  interest?: 'high' | 'medium' | 'low'
  engagementLevel?: 'unaware' | 'resistant' | 'supportive' | 'leading'
  notes?: string
}

export interface ProjectStakeholderInput {
  projectId: string
  stakeholderId: string
  role: string
  responsibility?: string
}

export interface StakeholderRecord {
  id: string
  name: string
  email: string | null
  phone: string | null
  title: string | null
  organization: string | null
  influence: string | null
  interest: string | null
  engagementLevel: string | null
  engagementStrategy: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface WorkItemInitInput {
  projectId: string
  title: string
  description?: string
  itemType: 'issue' | 'defect' | 'requirement' | 'action_item'
  status?: 'new' | 'analysis' | 'in_progress' | 'done' | 'cancelled' | 'on_hold'
  priority?: 'critical' | 'high' | 'medium' | 'low'
  severity?: 'blocker' | 'critical' | 'major' | 'minor'
  owner?: string
  reporter?: string
  dueDate?: string
  tags?: string
}

export interface WorkItemUpdateInput {
  id: string
  title?: string
  description?: string
  status?: string
  priority?: string
  severity?: string
  owner?: string
  dueDate?: string
  resolution?: string
  tags?: string
}

export type RiskStatus = 'open' | 'mitigated' | 'transferred' | 'accepted' | 'closed'

export interface RiskRecord {
  id: string
  projectId: string | null
  title: string
  category: string | null
  status: RiskStatus
  probability: number // 1-5
  impact: number // 1-5
  score?: number // probability * impact
  mitigation: string | null
  contingency: string | null
  owner: string | null
  identifiedAt: string | null
  dueDate: string | null
  closedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface RiskInitInput {
  projectId?: string
  title: string
  category?: string
  status?: RiskStatus
  probability: number
  impact: number
  mitigation?: string
  contingency?: string
  owner?: string
  dueDate?: string
}

export interface RiskUpdateInput {
  title?: string
  category?: string
  status?: RiskStatus
  probability?: number
  impact?: number
  mitigation?: string
  contingency?: string
  owner?: string
  dueDate?: string
  closureNotes?: string
}

export interface WorkItemRecord {
  id: string
  projectId: string
  code: string | null
  title: string
  description: string | null
  itemType: string
  status: string
  priority: string | null
  severity: string | null
  owner: string | null
  reporter: string | null
  parentId: string | null
  dueDate: string | null
  resolvedAt: string | null
  resolution: string | null
  tags: string | null
  createdAt: string
  updatedAt: string
}

export interface SearchResultItem {
  entityId: string
  entityType: string
  title: string
  snippet: string
  rank: number
}

export interface SearchResult {
  query: string
  total: number
  results: SearchResultItem[]
}

// Work Package types
export interface WorkPackageInitInput {
  projectId: string
  name: string
  description?: string
  responsible?: string
  startDate?: string
  endDate?: string
  status?: 'pending' | 'in_progress' | 'done' | 'cancelled'
  progressPct?: number
}

export interface WorkPackageRecord {
  id: string
  projectId: string
  name: string
  description: string | null
  responsible: string | null
  startDate: string | null
  endDate: string | null
  status: string
  progressPct: number
  createdAt: string
  updatedAt: string
}

// Process types
export interface ProcessInitInput {
  projectId: string
  name: string
  description?: string
  scope?: string
  owner?: string
  status?: 'draft' | 'active' | 'retired'
  version?: number
}

export interface ProcessRecord {
  id: string
  projectId: string
  name: string
  description: string | null
  scope: string | null
  owner: string | null
  status: string
  version: number
  createdAt: string
  updatedAt: string
}

// Organization types
export interface OrganizationInitInput {
  parentId?: string
  name: string
  code?: string
  description?: string
  level?: number
}

export interface OrganizationRecord {
  id: string
  parentId: string | null
  name: string
  code: string | null
  description: string | null
  level: number
  createdAt: string
  updatedAt: string
}

// Evidence types
export interface EvidenceInitInput {
  projectId: string
  entityType?: string
  entityId?: string
  title: string
  sourceType: 'meeting_note' | 'email' | 'im' | 'document'
  sourceUri?: string
  capturedAt?: string
  contentText?: string
  filePath?: string
  metadataJson?: JSON
}

export interface EvidenceRecord {
  id: string
  projectId: string
  entityType: string | null
  entityId: string | null
  title: string
  sourceType: string
  sourceUri: string | null
  capturedAt: string
  contentText: string | null
  filePath: string | null
  metadataJson: string | null
  createdAt: string
}
