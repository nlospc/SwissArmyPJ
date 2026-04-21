export type WorkbenchModuleKey =
  | 'canvas'
  | 'stakeholders'
  | 'timeline'
  | 'risks'
  | 'work-packages'
  | 'evidence';

export interface WorkbenchSnapshot {
  projectId: number;
  progress: number;
  totalWorkItems: number;
  milestoneCount: number;
  activeRiskCount: number;
  collaboratorCount: number;
  currentPhaseTitle: string | null;
  nextMilestoneTitle: string | null;
  nextMilestoneDate: string | null;
}

export interface WorkbenchModuleDefinition {
  key: WorkbenchModuleKey;
  label: string;
  description: string;
  count?: number;
}
