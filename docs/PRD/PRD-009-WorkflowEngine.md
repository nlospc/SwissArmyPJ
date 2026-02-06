# PRD-009: Workflow Engine & State Machine Specification

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-009 |
| **Parent** | @PRD-001-Master.md |
| **Status** | Draft |
| **Date** | 2026-02-06 |
| **Authors** | Product Team |

---

## 1. Overview

The Workflow Engine implements a deterministic state machine that governs item status transitions, ensuring data quality and enforcing business rules across the SwissArmyPM system.

**Dependencies**: @PRD-002-DataModel.md, @PRD-008-Governance.md
**Dependents**: @PRD-006-Dashboard.md, @PRD-010-ItemManagement.md

---

## 2. Design Goals

| Goal | Description |
|------|-------------|
| **Deterministic** | Same inputs always produce same transitions |
| **Validated** | All transitions validated before execution |
| **Audited** | Every transition logged with full context |
| **Extensible** | New item types and workflows pluggable |
| **Performant** | < 10ms validation time per transition |

---

## 3. State Machine Architecture

### 3.1 Core Components

```
┌─────────────────────────────────────────────────────────────────┐
│                     Workflow Engine                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │ State        │───▶│ Validator    │───▶│ Executor     │     │
│  │ Definition   │    │ Chain        │    │              │     │
│  └──────────────┘    └──────────────┘    └──────────────┘     │
│         │                                      │               │
│         │                                      │               │
│         ▼                                      ▼               │
│  ┌──────────────┐                    ┌──────────────┐        │
│  │ Transition   │                    │ Audit        │        │
│  │ Registry     │                    │ Logger       │        │
│  └──────────────┘                    └──────────────┘        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Type System

```rust
/// Item types supported by the workflow engine
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum ItemType {
    Epic,
    Story,
    Task,
    Bug,
    Spike,
    Milestone,
}

/// Status values for each item type
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ItemStatus {
    // Story/Task statuses
    Backlog,
    Ready,
    InProgress,
    InReview,
    InTest,
    Done,
    Blocked,

    // Bug statuses
    BugNew,
    Triage,
    InFix,
    InVerification,
    Closed,

    // Spike statuses
    Proposed,
    InResearch,
    FindingsReady,
    SpikeClosed,

    // Milestone/Epic statuses
    Active,
    Completed,
}

/// Convert status string to enum
impl ItemStatus {
    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "Backlog" => Some(Self::Backlog),
            "Ready" => Some(Self::Ready),
            "In Progress" => Some(Self::InProgress),
            "In Review" => Some(Self::InReview),
            "In Test" => Some(Self::InTest),
            "Done" => Some(Self::Done),
            "Blocked" => Some(Self::Blocked),
            "New" => Some(Self::BugNew),
            "Triage" => Some(Self::Triage),
            "In Fix" => Some(Self::InFix),
            "In Verification" => Some(Self::InVerification),
            "Closed" => Some(Self::Closed),
            "Proposed" => Some(Self::Proposed),
            "In Research" => Some(Self::InResearch),
            "Findings Ready" => Some(Self::FindingsReady),
            // ... other mappings
            _ => None,
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Backlog => "Backlog",
            Self::Ready => "Ready",
            Self::InProgress => "In Progress",
            Self::InReview => "In Review",
            Self::InTest => "In Test",
            Self::Done => "Done",
            Self::Blocked => "Blocked",
            Self::BugNew => "New",
            Self::Triage => "Triage",
            Self::InFix => "In Fix",
            Self::InVerification => "In Verification",
            Self::Closed => "Closed",
            Self::Proposed => "Proposed",
            Self::InResearch => "In Research",
            Self::FindingsReady => "Findings Ready",
            _ => "Unknown",
        }
    }
}
```

---

## 4. State Transition Definitions

### 4.1 Transition Registry

```rust
/// Represents a valid state transition
#[derive(Debug, Clone)]
pub struct Transition {
    pub from_status: Option<ItemStatus>, // None for initial state
    pub to_status: ItemStatus,
    pub item_type: ItemType,
    pub validators: Vec<Box<dyn TransitionValidator>>,
    pub side_effects: Vec<Box<dyn SideEffect>>,
}

/// Trait for transition validation
pub trait TransitionValidator: Send + Sync {
    fn validate(&self, item: &Item, context: &TransitionContext) -> Result<(), ValidationError>;
}

/// Trait for transition side effects
pub trait SideEffect: Send + Sync {
    fn execute(&self, item: &Item, context: &TransitionContext) -> Result<(), SideEffectError>;
}

/// Context information during transition
pub struct TransitionContext {
    pub user_id: String,
    pub timestamp: DateTime<Utc>,
    pub reason: Option<String>,
    pub metadata: HashMap<String, serde_json::Value>,
}
```

### 4.2 Story/Task Transitions

```rust
fn build_story_task_transitions() -> Vec<Transition> {
    vec![
        // Forward flow
        Transition {
            from_status: None, // Initial state
            to_status: ItemStatus::Backlog,
            item_type: ItemType::Story,
            validators: vec![],
            side_effects: vec![],
        },
        Transition {
            from_status: Some(ItemStatus::Backlog),
            to_status: ItemStatus::Ready,
            item_type: ItemType::Story,
            validators: vec![Box::new(OwnerAssignedValidator)],
            side_effects: vec![Box::new(NotifyAssignee)],
        },
        Transition {
            from_status: Some(ItemStatus::Ready),
            to_status: ItemStatus::InProgress,
            item_type: ItemType::Story,
            validators: vec![Box::new(OwnerAssignedValidator)],
            side_effects: vec![Box::new(RecordStartTime)],
        },
        Transition {
            from_status: Some(ItemStatus::InProgress),
            to_status: ItemStatus::InReview,
            item_type: ItemType::Story,
            validators: vec![Box::new(WorkCompletedValidator)],
            side_effects: vec![Box::new(NotifyReviewers)],
        },
        Transition {
            from_status: Some(ItemStatus::InReview),
            to_status: ItemStatus::InTest,
            item_type: ItemType::Story,
            validators: vec![Box::new(ReviewApprovedValidator)],
            side_effects: vec![Box::new(NotifyQATeam)],
        },
        Transition {
            from_status: Some(ItemStatus::InTest),
            to_status: ItemStatus::Done,
            item_type: ItemType::Story,
            validators: vec![
                Box::new(AcceptanceCriteriaMetValidator),
                Box::new(AllTestsPassedValidator),
            ],
            side_effects: vec![
                Box::new(RecordCompletionTime),
                Box::new(UpdateProjectMetrics),
            ],
        },

        // Backward transitions (with validation)
        Transition {
            from_status: Some(ItemStatus::InReview),
            to_status: ItemStatus::InProgress,
            item_type: ItemType::Story,
            validators: vec![Box::new(ReviewRejectedWithFeedbackValidator)],
            side_effects: vec![Box::new(NotifyRejectionReason)],
        },
        Transition {
            from_status: Some(ItemStatus::InTest),
            to_status: ItemStatus::InReview,
            item_type: ItemType::Story,
            validators: vec![Box::new(TestFailedValidator)],
            side_effects: vec![Box::new(RecordTestFailure)],
        },

        // Blocked state (from any active state)
        Transition {
            from_status: Some(ItemStatus::InProgress),
            to_status: ItemStatus::Blocked,
            item_type: ItemType::Story,
            validators: vec![Box::new(BlockerDocumentedValidator)],
            side_effects: vec![Box::new(NotifyBlockerStakeholders)],
        },
        Transition {
            from_status: Some(ItemStatus::Blocked),
            to_status: ItemStatus::Ready,
            item_type: ItemType::Story,
            validators: vec![Box::new(BlockerResolvedValidator)],
            side_effects: vec![Box::new(NotifyUnblocked)],
        },
    ]
}
```

### 4.3 Bug Transitions

```rust
fn build_bug_transitions() -> Vec<Transition> {
    vec![
        Transition {
            from_status: None,
            to_status: ItemStatus::BugNew,
            item_type: ItemType::Bug,
            validators: vec![Box::new(SeverityAssignedValidator)],
            side_effects: vec![Box::new(NotifyTriageTeam)],
        },
        Transition {
            from_status: Some(ItemStatus::BugNew),
            to_status: ItemStatus::Triage,
            item_type: ItemType::Bug,
            validators: vec![Box::new(TriageAssignedValidator)],
            side_effects: vec![Box::new(PrioritizeBug)],
        },
        Transition {
            from_status: Some(ItemStatus::Triage),
            to_status: ItemStatus::InFix,
            item_type: ItemType::Bug,
            validators: vec![Box::new(DeveloperAssignedValidator)],
            side_effects: vec![Box::new(NotifyDeveloper)],
        },
        Transition {
            from_status: Some(ItemStatus::InFix),
            to_status: ItemStatus::InVerification,
            item_type: ItemType::Bug,
            validators: vec![Box::new(FixSubmittedValidator)],
            side_effects: vec![Box::new(NotifyQATeam)],
        },
        Transition {
            from_status: Some(ItemStatus::InVerification),
            to_status: ItemStatus::Closed,
            item_type: ItemType::Bug,
            validators: vec![
                Box::new(VerificationPassedValidator),
                Box::new(VerifiedBySetValidator),
            ],
            side_effects: vec![
                Box::new(RecordFixTime),
                Box::new(UpdateBugMetrics),
            ],
        },
        // Verification failed - go back to fix
        Transition {
            from_status: Some(ItemStatus::InVerification),
            to_status: ItemStatus::InFix,
            item_type: ItemType::Bug,
            validators: vec![Box::new(VerificationFailedWithReasonValidator)],
            side_effects: vec![Box::new(NotifyVerificationFailure)],
        },
        // Not reproducible or won't fix
        Transition {
            from_status: Some(ItemStatus::InVerification),
            to_status: ItemStatus::Closed,
            item_type: ItemType::Bug,
            validators: vec![
                Box::new(ClosedWithReasonValidator),
                Box::new(VerifiedBySetValidator),
            ],
            side_effects: vec![Box::new(RecordClosureReason)],
        },
    ]
}
```

### 4.4 Spike Transitions

```rust
fn build_spike_transitions() -> Vec<Transition> {
    vec![
        Transition {
            from_status: None,
            to_status: ItemStatus::Proposed,
            item_type: ItemType::Spike,
            validators: vec![Box::new(ResearchObjectiveDefinedValidator)],
            side_effects: vec![],
        },
        Transition {
            from_status: Some(ItemStatus::Proposed),
            to_status: ItemStatus::InResearch,
            item_type: ItemType::Spike,
            validators: vec![Box::new(ResearcherAssignedValidator)],
            side_effects: vec![Box::new(RecordResearchStartTime)],
        },
        Transition {
            from_status: Some(ItemStatus::InResearch),
            to_status: ItemStatus::FindingsReady,
            item_type: ItemType::Spike,
            validators: vec![Box::new(FindingsDocumentedValidator)],
            side_effects: vec![Box::new(NotifyStakeholdersFindingsReady)],
        },
        Transition {
            from_status: Some(ItemStatus::FindingsReady),
            to_status: ItemStatus::SpikeClosed,
            item_type: ItemType::Spike,
            validators: vec![
                Box::new(FindingsReviewedValidator),
                Box::new(FindingsApprovedValidator),
            ],
            side_effects: vec![
                Box::new(RecordSpikeCompletion),
                Box::new(UpdateResearchMetrics),
            ],
        },
        // More research needed
        Transition {
            from_status: Some(ItemStatus::FindingsReady),
            to_status: ItemStatus::InResearch,
            item_type: ItemType::Spike,
            validators: vec![Box::new(AdditionalResearchNeededValidator)],
            side_effects: vec![Box::new(ExtendResearchTime)],
        },
    ]
}
```

---

## 5. Built-in Validators

### 5.1 Common Validators

```rust
/// Validator: Owner must be assigned
pub struct OwnerAssignedValidator;

impl TransitionValidator for OwnerAssignedValidator {
    fn validate(&self, item: &Item, _context: &TransitionContext) -> Result<(), ValidationError> {
        if item.owner.is_none() || item.owner.as_ref().unwrap().is_empty() {
            return Err(ValidationError {
                code: "V001".to_string(),
                message: "Item must have an owner assigned".to_string(),
                field: Some("owner".to_string()),
            });
        }
        Ok(())
    }
}

/// Validator: Blocker must be documented
pub struct BlockerDocumentedValidator;

impl TransitionValidator for BlockerDocumentedValidator {
    fn validate(&self, item: &Item, _context: &TransitionContext) -> Result<(), ValidationError> {
        if item.description.is_none() || item.description.as_ref().unwrap().is_empty() {
            return Err(ValidationError {
                code: "V002".to_string(),
                message: "Blocker reason must be documented in description".to_string(),
                field: Some("description".to_string()),
            });
        }
        Ok(())
    }
}
```

### 5.2 Story-Specific Validators

```rust
/// Validator: Acceptance criteria must be present for Done
pub struct AcceptanceCriteriaMetValidator;

impl TransitionValidator for AcceptanceCriteriaMetValidator {
    fn validate(&self, item: &Item, _context: &TransitionContext) -> Result<(), ValidationError> {
        if item.item_type != ItemType::Story {
            return Ok(());
        }

        if item.acceptance_criteria.is_none() || item.acceptance_criteria.as_ref().unwrap().is_empty() {
            return Err(ValidationError {
                code: "V003".to_string(),
                message: "Story requires acceptance criteria to be completed".to_string(),
                field: Some("acceptance_criteria".to_string()),
            });
        }

        // Additional validation: Check if acceptance criteria are actually met
        // This could involve checking test results, review approvals, etc.
        Ok(())
    }
}

/// Validator: Work must be marked complete before moving to review
pub struct WorkCompletedValidator;

impl TransitionValidator for WorkCompletedValidator {
    fn validate(&self, item: &Item, context: &TransitionContext) -> Result<(), ValidationError> {
        // Check if there are incomplete sub-tasks
        if has_incomplete_children(item.id) {
            return Err(ValidationError {
                code: "V004".to_string(),
                message: "All sub-tasks must be completed before moving to review".to_string(),
                field: None,
            });
        }

        // Check if required dependencies are met
        if has_blocking_dependencies(item.id) {
            return Err(ValidationError {
                code: "V005".to_string(),
                message: "Blocking dependencies must be completed".to_string(),
                field: None,
            });
        }

        Ok(())
    }
}
```

### 5.3 Bug-Specific Validators

```rust
/// Validator: Severity must be assigned
pub struct SeverityAssignedValidator;

impl TransitionValidator for SeverityAssignedValidator {
    fn validate(&self, item: &Item, _context: &TransitionContext) -> Result<(), ValidationError> {
        if item.severity.is_none() {
            return Err(ValidationError {
                code: "V006".to_string(),
                message: "Bug must have severity assigned".to_string(),
                field: Some("severity".to_string()),
            });
        }
        Ok(())
    }
}

/// Validator: Bug must be verified before closing
pub struct VerificationPassedValidator;

impl TransitionValidator for VerificationPassedValidator {
    fn validate(&self, item: &Item, context: &TransitionContext) -> Result<(), ValidationError> {
        if !context.metadata.contains_key("verification_passed") {
            return Err(ValidationError {
                code: "V007".to_string(),
                message: "Bug verification must be passed".to_string(),
                field: None,
            });
        }

        let passed = context.metadata.get("verification_passed")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);

        if !passed {
            return Err(ValidationError {
                code: "V008".to_string(),
                message: "Bug verification must pass before closing".to_string(),
                field: None,
            });
        }

        Ok(())
    }
}

/// Validator: verified_by must be set
pub struct VerifiedBySetValidator;

impl TransitionValidator for VerifiedBySetValidator {
    fn validate(&self, item: &Item, _context: &TransitionContext) -> Result<(), ValidationError> {
        if item.verified_by.is_none() || item.verified_by.as_ref().unwrap().is_empty() {
            return Err(ValidationError {
                code: "V009".to_string(),
                message: "Bug must be verified by QA personnel".to_string(),
                field: Some("verified_by".to_string()),
            });
        }
        Ok(())
    }
}
```

### 5.4 Spike-Specific Validators

```rust
/// Validator: Findings must be documented
pub struct FindingsDocumentedValidator;

impl TransitionValidator for FindingsDocumentedValidator {
    fn validate(&self, item: &Item, _context: &TransitionContext) -> Result<(), ValidationError> {
        if item.findings.is_none() || item.findings.as_ref().unwrap().is_empty() {
            return Err(ValidationError {
                code: "V010".to_string(),
                message: "Spike requires documented findings".to_string(),
                field: Some("findings".to_string()),
            });
        }
        Ok(())
    }
}

/// Validator: Research objective must be defined
pub struct ResearchObjectiveDefinedValidator;

impl TransitionValidator for ResearchObjectiveDefinedValidator {
    fn validate(&self, item: &Item, _context: &TransitionContext) -> Result<(), ValidationError> {
        if item.description.is_none() || item.description.as_ref().unwrap().len() < 50 {
            return Err(ValidationError {
                code: "V011".to_string(),
                message: "Spike must have a clear research objective (min 50 chars)".to_string(),
                field: Some("description".to_string()),
            });
        }
        Ok(())
    }
}
```

---

## 6. Workflow Engine API

### 6.1 Core Engine Interface

```rust
/// Workflow Engine - Main API
pub struct WorkflowEngine {
    transition_registry: HashMap<(ItemType, Option<ItemStatus>, ItemStatus), Transition>,
    db: Arc<dyn Database>,
    audit_logger: Arc<dyn AuditLogger>,
}

impl WorkflowEngine {
    pub fn new(db: Arc<dyn Database>, audit_logger: Arc<dyn AuditLogger>) -> Self {
        let mut engine = Self {
            transition_registry: HashMap::new(),
            db,
            audit_logger,
        };

        // Register all transitions
        engine.register_transitions();
        engine
    }

    fn register_transitions(&mut self) {
        // Story/Task transitions
        for transition in build_story_task_transitions() {
            let key = (
                transition.item_type,
                transition.from_status.clone(),
                transition.to_status.clone(),
            );
            self.transition_registry.insert(key, transition);
        }

        // Bug transitions
        for transition in build_bug_transitions() {
            let key = (
                transition.item_type,
                transition.from_status.clone(),
                transition.to_status.clone(),
            );
            self.transition_registry.insert(key, transition);
        }

        // Spike transitions
        for transition in build_spike_transitions() {
            let key = (
                transition.item_type,
                transition.from_status.clone(),
                transition.to_status.clone(),
            );
            self.transition_registry.insert(key, transition);
        }
    }

    /// Transition an item to a new status
    pub fn transition_item_status(
        &self,
        item_id: Uuid,
        to_status: ItemStatus,
        user_id: String,
        reason: Option<String>,
        metadata: HashMap<String, serde_json::Value>,
    ) -> Result<Item, WorkflowError> {
        // 1. Fetch current item state
        let item = self.db.get_item(item_id)?
            .ok_or_else(|| WorkflowError::ItemNotFound(item_id))?;

        let from_status = item.status.clone();

        // 2. Build transition context
        let context = TransitionContext {
            user_id: user_id.clone(),
            timestamp: Utc::now(),
            reason: reason.clone(),
            metadata: metadata.clone(),
        };

        // 3. Find transition definition
        let key = (item.item_type, Some(from_status.clone()), to_status.clone());
        let transition = self.transition_registry.get(&key)
            .ok_or_else(|| WorkflowError::InvalidTransition {
                item_type: item.item_type,
                from: from_status.clone(),
                to: to_status.clone(),
            })?;

        // 4. Run validators
        for validator in &transition.validators {
            validator.validate(&item, &context)?;
        }

        // 5. Execute transition
        let mut updated_item = item.clone();
        updated_item.status = to_status.clone();

        // 6. Execute side effects
        for side_effect in &transition.side_effects {
            side_effect.execute(&updated_item, &context)?;
        }

        // 7. Persist to database
        self.db.update_item(&updated_item)?;

        // 8. Write audit log
        self.audit_logger.write_status_transition(
            &item,
            &from_status,
            &to_status,
            &user_id,
            reason,
            metadata,
        )?;

        // 9. Write status history
        self.db.insert_status_history(item_id, &from_status, &to_status, &user_id)?;

        Ok(updated_item)
    }

    /// Check if a transition is valid (without executing)
    pub fn validate_transition(
        &self,
        item_id: Uuid,
        to_status: ItemStatus,
    ) -> Result<(), ValidationError> {
        let item = self.db.get_item(item_id)?
            .ok_or_else(|| WorkflowError::ItemNotFound(item_id))?;

        let from_status = item.status.clone();
        let key = (item.item_type, Some(from_status.clone()), to_status.clone());

        self.transition_registry.get(&key)
            .ok_or_else(|| ValidationError {
                code: "V900".to_string(),
                message: format!(
                    "Invalid transition from {:?} to {:?} for {:?}",
                    from_status, to_status, item.item_type
                ),
                field: None,
            })?;

        Ok(())
    }

    /// Get available transitions for an item
    pub fn get_available_transitions(&self, item_id: Uuid) -> Result<Vec<ItemStatus>, WorkflowError> {
        let item = self.db.get_item(item_id)?
            .ok_or_else(|| WorkflowError::ItemNotFound(item_id))?;

        let mut transitions = Vec::new();

        for (key, _) in self.transition_registry.iter() {
            if key.0 == item.item_type && key.1 == Some(item.status.clone()) {
                transitions.push(key.2.clone());
            }
        }

        transitions.sort_by_key(|s| s.as_str().to_string());
        Ok(transitions)
    }

    /// Get initial status for a new item
    pub fn get_initial_status(&self, item_type: ItemType) -> ItemStatus {
        match item_type {
            ItemType::Story | ItemType::Task => ItemStatus::Backlog,
            ItemType::Bug => ItemStatus::BugNew,
            ItemType::Spike => ItemStatus::Proposed,
            ItemType::Milestone => ItemStatus::Active,
            ItemType::Epic => ItemStatus::Active,
        }
    }
}
```

### 6.2 Error Types

```rust
#[derive(Debug, thiserror::Error)]
pub enum WorkflowError {
    #[error("Item not found: {0}")]
    ItemNotFound(Uuid),

    #[error("Invalid transition: {item_type:?} from {from:?} to {to:?}")]
    InvalidTransition {
        item_type: ItemType,
        from: ItemStatus,
        to: ItemStatus,
    },

    #[error("Validation failed: {0}")]
    ValidationFailed(#[from] ValidationError),

    #[error("Side effect failed: {0}")]
    SideEffectFailed(#[from] SideEffectError),

    #[error("Database error: {0}")]
    DatabaseError(String),

    #[error("Audit log error: {0}")]
    AuditError(String),
}

#[derive(Debug, Clone)]
pub struct ValidationError {
    pub code: String,
    pub message: String,
    pub field: Option<String>,
}

impl std::fmt::Display for ValidationError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "[{}] {}", self.code, self.message)
    }
}

impl std::error::Error for ValidationError {}

#[derive(Debug, thiserror::Error)]
pub enum SideEffectError {
    #[error("Notification failed: {0}")]
    NotificationFailed(String),

    #[error("Metrics update failed: {0}")]
    MetricsUpdateFailed(String),

    #[error("External service error: {0}")]
    ExternalServiceError(String),
}
```

---

## 7. Database Integration

### 7.1 Status History Table

```sql
-- Created in PRD-002, referenced here for workflow engine
CREATE TABLE item_status_history (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  changed_at TEXT NOT NULL DEFAULT (datetime('now')),
  transition_reason TEXT,
  metadata TEXT, -- JSON: additional validation results
  duration_in_state INTEGER -- Seconds spent in from_status (calculated)
);

CREATE INDEX idx_item_status_history_item
  ON item_status_history(item_id, changed_at DESC);
```

### 7.2 Workflow State Queries

```sql
-- Get current state distribution for CFD
SELECT
  type,
  status,
  COUNT(*) as count
FROM items
WHERE project_id = ?
GROUP BY type, status;

-- Get status transition history for CFD
SELECT
  DATE(ch.changed_at) as date,
  i.type,
  ch.to_status,
  COUNT(*) as cumulative_count
FROM item_status_history ch
JOIN items i ON ch.item_id = i.id
WHERE i.project_id = ?
  AND ch.changed_at >= date('now', '-30 days')
GROUP BY DATE(ch.changed_at), i.type, ch.to_status
ORDER BY date;

-- Calculate average time in status
SELECT
  from_status,
  to_status,
  AVG(duration_in_state) as avg_seconds,
  AVG(duration_in_state) / 86400.0 as avg_days
FROM item_status_history
WHERE item_id = ?
  AND duration_in_state IS NOT NULL
GROUP BY from_status, to_status;

-- Detect blocked items
SELECT
  i.id,
  i.name,
  i.type,
  i.status,
  julianday('now') - juliandate(i.updated_at) as days_stuck
FROM items i
WHERE i.status = 'Blocked'
  AND julianday('now') - juliandate(i.updated_at) > 7
ORDER BY days_stuck DESC;
```

---

## 8. Frontend Integration (React + Zustand)

### 8.1 Zustand Store

```typescript
// stores/workflowStore.ts
import { create } from 'zustand';
import { Item, ItemStatus, ItemType } from '@/types';

interface WorkflowState {
  availableTransitions: Map<string, ItemStatus[]>;
  validationErrors: Map<string, string>;
  isTransitioning: boolean;

  // Actions
  fetchAvailableTransitions: (itemId: string) => Promise<void>;
  transitionItemStatus: (
    itemId: string,
    toStatus: ItemStatus,
    reason?: string
  ) => Promise<void>;
  clearErrors: () => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  availableTransitions: new Map(),
  validationErrors: new Map(),
  isTransitioning: false,

  fetchAvailableTransitions: async (itemId: string) => {
    try {
      const response = await fetch(`/api/workflow/transitions/${itemId}`);
      const transitions: ItemStatus[] = await response.json();

      set((state) => {
        const newMap = new Map(state.availableTransitions);
        newMap.set(itemId, transitions);
        return { availableTransitions: newMap };
      });
    } catch (error) {
      console.error('Failed to fetch transitions:', error);
    }
  },

  transitionItemStatus: async (itemId: string, toStatus: ItemStatus, reason?: string) => {
    set({ isTransitioning: true });

    try {
      const response = await fetch(`/api/workflow/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, toStatus, reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Transition failed');
      }

      const updatedItem: Item = await response.json();

      // Clear any previous errors for this item
      set((state) => {
        const newErrors = new Map(state.validationErrors);
        newErrors.delete(itemId);
        return { validationErrors: newErrors };
      });

      return updatedItem;
    } catch (error: any) {
      // Store validation error
      set((state) => {
        const newErrors = new Map(state.validationErrors);
        newErrors.set(itemId, error.message);
        return { validationErrors: newErrors };
      });
      throw error;
    } finally {
      set({ isTransitioning: false });
    }
  },

  clearErrors: () => set({ validationErrors: new Map() }),
}));
```

### 8.2 Status Transition Component

```typescript
// components/StatusTransitionButton.tsx
import { Button, Dropdown, message } from 'antd';
import { useWorkflowStore } from '@/stores/workflowStore';
import { Item, ItemStatus } from '@/types';

interface StatusTransitionButtonProps {
  item: Item;
  onTransitionComplete?: (updatedItem: Item) => void;
}

export const StatusTransitionButton: React.FC<StatusTransitionButtonProps> = ({
  item,
  onTransitionComplete,
}) => {
  const { fetchAvailableTransitions, transitionItemStatus, isTransitioning } =
    useWorkflowStore();

  useEffect(() => {
    fetchAvailableTransitions(item.id);
  }, [item.id]);

  const handleTransition = async (toStatus: ItemStatus) => {
    try {
      const updatedItem = await transitionItemStatus(
        item.id,
        toStatus,
        `Transition from ${item.status} to ${toStatus}`
      );

      message.success(`Status changed to ${toStatus}`);
      onTransitionComplete?.(updatedItem);

      // Refresh available transitions
      fetchAvailableTransitions(item.id);
    } catch (error: any) {
      message.error(`Failed to transition: ${error.message}`);
    }
  };

  return (
    <Dropdown
      menu={{
        items: workflowStore.availableTransitions
          .get(item.id)
          ?.map((status) => ({
            key: status,
            label: status,
            onClick: () => handleTransition(status),
          })) || [],
      }}
      trigger={['click']}
    >
      <Button loading={isTransitioning}>
        Change Status
      </Button>
    </Dropdown>
  );
};
```

### 8.3 Ant Design v5 Integration

```typescript
// components/WorkflowProgressBar.tsx
import { Progress, Badge, Space, Tooltip } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';

interface WorkflowProgressBarProps {
  currentStatus: ItemStatus;
  itemType: ItemType;
}

const STATUS_CONFIG: Record<ItemStatus, { color: string; icon: React.ReactNode }> = {
  [ItemStatus.Backlog]: { color: 'default', icon: <ClockCircleOutlined /> },
  [ItemStatus.Ready]: { color: 'blue', icon: <ClockCircleOutlined /> },
  [ItemStatus.InProgress]: { color: 'processing', icon: <ClockCircleOutlined /> },
  [ItemStatus.InReview]: { color: 'purple', icon: <ClockCircleOutlined /> },
  [ItemStatus.InTest]: { color: 'orange', icon: <ClockCircleOutlined /> },
  [ItemStatus.Done]: { color: 'success', icon: <CheckCircleOutlined /> },
  [ItemStatus.Blocked]: { color: 'exception', icon: <StopOutlined /> },
  // ... other statuses
};

export const WorkflowProgressBar: React.FC<WorkflowProgressBarProps> = ({
  currentStatus,
  itemType,
}) => {
  const workflow = getWorkflowForType(itemType);
  const currentIndex = workflow.indexOf(currentStatus);
  const percent = ((currentIndex + 1) / workflow.length) * 100;

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Progress
        percent={Math.round(percent)}
        status={STATUS_CONFIG[currentStatus]?.color as any}
        strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
      />

      <Space>
        {workflow.map((status, index) => (
          <Tooltip key={status} title={status}>
            <Badge
              status={index <= currentIndex ? 'success' : 'default'}
              text={STATUS_CONFIG[status]?.icon}
            />
          </Tooltip>
        ))}
      </Space>
    </Space>
  );
};
```

---

## 9. Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Validation Time** | < 10ms | Per transition validation |
| **Transition Execution** | < 100ms | Including database write |
| **Available Transitions Query** | < 50ms | Fetch transition options |
| **Status History Query** | < 200ms | 30-day CFD data |
| **Concurrent Transitions** | 100/sec | Sustained throughput |

### 9.1 Caching Strategy

```rust
/// Cache for available transitions
pub struct TransitionCache {
    cache: Arc<RwLock<HashMap<Uuid, (Vec<ItemStatus>, DateTime<Utc>)>>>,
    ttl: Duration,
}

impl TransitionCache {
    pub fn get(&self, item_id: Uuid) -> Option<Vec<ItemStatus>> {
        let cache = self.cache.read().unwrap();
        cache.get(&item_id)
            .filter(|(_, timestamp)| Utc::now() - *timestamp < self.ttl)
            .map(|(transitions, _)| transitions.clone())
    }

    pub fn set(&self, item_id: Uuid, transitions: Vec<ItemStatus>) {
        let mut cache = self.cache.write().unwrap();
        cache.insert(item_id, (transitions, Utc::now()));
    }
}
```

---

## 10. Testing Strategy

### 10.1 Unit Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_story_backlog_to_ready_requires_owner() {
        let mut item = Item::new(ItemType::Story, "Test Story");
        item.status = ItemStatus::Backlog;
        item.owner = None;

        let engine = create_test_engine();
        let result = engine.transition_item_status(
            item.id,
            ItemStatus::Ready,
            "test-user".to_string(),
            None,
            HashMap::new(),
        );

        assert!(matches!(result, Err(WorkflowError::ValidationFailed(_))));
    }

    #[test]
    fn test_bug_close_requires_verification() {
        let mut item = Item::new(ItemType::Bug, "Test Bug");
        item.status = ItemStatus::InVerification;
        item.verified_by = None;

        let engine = create_test_engine();
        let result = engine.transition_item_status(
            item.id,
            ItemStatus::Closed,
            "test-user".to_string(),
            None,
            HashMap::new(),
        );

        assert!(matches!(result, Err(WorkflowError::ValidationFailed(_))));
    }

    #[test]
    fn test_invalid_transition_rejected() {
        let mut item = Item::new(ItemType::Story, "Test Story");
        item.status = ItemStatus::Backlog;

        let engine = create_test_engine();
        let result = engine.transition_item_status(
            item.id,
            ItemStatus::Done, // Skip to Done - invalid
            "test-user".to_string(),
            None,
            HashMap::new(),
        );

        assert!(matches!(result, Err(WorkflowError::InvalidTransition { .. })));
    }
}
```

### 10.2 Integration Tests

```rust
#[tokio::test]
async fn test_full_workflow_story_lifecycle() {
    let db = create_test_db().await;
    let audit = create_test_audit_logger();
    let engine = WorkflowEngine::new(db, audit);

    // Create story
    let story = create_test_story("User Login");
    let story = db.create_item(story).unwrap();

    // Backlog → Ready
    let story = engine.transition_item_status(
        story.id,
        ItemStatus::Ready,
        "alice".to_string(),
        None,
        HashMap::new(),
    ).unwrap();
    assert_eq!(story.status, ItemStatus::Ready);

    // Ready → In Progress
    let story = engine.transition_item_status(
        story.id,
        ItemStatus::InProgress,
        "alice".to_string(),
        None,
        HashMap::new(),
    ).unwrap();
    assert_eq!(story.status, ItemStatus::InProgress);

    // ... continue through full lifecycle

    // Verify audit log entries
    let history = db.get_status_history(story.id).unwrap();
    assert_eq!(history.len(), 6); // All transitions recorded
}
```

---

## 11. Acceptance Criteria

| AC# | Criteria | Test Method |
|-----|----------|-------------|
| AC-01 | Engine validates all transitions | Unit test |
| AC-02 | Invalid transitions rejected with clear error | Unit test |
| AC-03 | All validators run before transition | Unit test |
| AC-04 | Side effects execute after transition | Integration test |
| AC-05 | Audit log written for each transition | Integration test |
| AC-06 | Status history maintained | Integration test |
| AC-07 | Available transitions query returns valid options | Unit test |
| AC-08 | Validation time < 10ms | Performance test |
| AC-09 | Engine handles 100 concurrent transitions | Load test |
| AC-10 | Frontend can fetch and display transitions | E2E test |
| AC-11 | Story completion requires acceptance criteria | Unit test |
| AC-12 | Bug closure requires verification | Unit test |
| AC-13 | Spike closure requires findings | Unit test |
| AC-14 | Blocked state can be entered from any active state | Unit test |
| AC-15 | CFD data available from status history | Integration test |

---

## 12. Migration Strategy

### 12.1 Data Migration

```sql
-- Migrate existing items to new workflow states
-- Story/Task migration
UPDATE items
SET status = CASE
  WHEN status = 'NotStarted' THEN 'Backlog'
  WHEN status = 'InProgress' THEN 'In Progress'
  WHEN status = 'Done' THEN 'Done'
  ELSE status
END
WHERE type IN ('Story', 'Task');

-- Bug migration (treat existing Issues as Bugs)
UPDATE items
SET type = 'Bug',
    status = CASE
      WHEN status = 'NotStarted' THEN 'New'
      WHEN status = 'InProgress' THEN 'In Fix'
      WHEN status = 'Done' THEN 'Closed'
      ELSE status
    END
WHERE type = 'Issue';

-- Spike migration
UPDATE items
SET type = 'Spike',
    status = CASE
      WHEN status = 'NotStarted' THEN 'Proposed'
      WHEN status = 'InProgress' THEN 'In Research'
      WHEN status = 'Done' THEN 'Closed'
      ELSE status
    END
WHERE type = 'Spike' OR name LIKE '%Spike%';
```

### 12.2 Phased Rollout

```infographic
infographic sequence-steps-simple
data
  title Workflow Engine Rollout Plan
  items
    - label Phase 1
      desc Backend engine deployment (week 1-2)
    - label Phase 2
      desc Frontend integration (week 3-4)
    - label Phase 3
      desc Data migration (week 5)
    - label Phase 4
      desc Validation enforcement (week 6)
    - label Phase 5
      desc Full rollout (week 7-8)
```

---

## 13. Related Documents

- @PRD-001-Master.md — Master PRD
- @PRD-002-DataModel.md — Data model with workflow states
- @PRD-006-Dashboard.md — Workflow visualization
- @PRD-008-Governance.md — Audit and validation rules
- @PRD-010-ItemManagement.md — Item CRUD operations (FUTURE)

---

## 14. Future Enhancements

### 14.1 Custom Workflows

Allow organizations to define custom workflows per item type:

```rust
pub struct CustomWorkflow {
    pub id: Uuid,
    pub name: String,
    pub item_type: ItemType,
    pub statuses: Vec<ItemStatus>,
    pub transitions: Vec<CustomTransition>,
    pub validators: Vec<ValidatorConfig>,
}
```

### 14.2 Workflow Designer UI

Visual workflow editor for business users:

```
┌─────────────────────────────────────────────────────────┐
│  Workflow Designer - Story Workflow          [Save]     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Backlog] → [Ready] → [In Progress] → [In Review]     │
│                           ↓            ↓                │
│                        [Blocked] ← ─ ─ ─ ─              │
│                                        ↓                │
│  ← ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ [In Test] → [Done]        │
│                                                         │
│  [+ Add Status]  [+ Add Transition]                     │
│                                                         │
│  Properties:                                            │
│  ────────────────────────────────────────────────────  │
│  Status: [In Test]                                      │
│  Validators:                                            │
│    ☑ All tests passed                                  │
│    ☑ Acceptance criteria met                           │
│    ☐ Documentation complete                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 14.3 Workflow Analytics

Advanced metrics and insights:

- Lead time distribution by status
- Bottleneck identification using ML
- Predictive completion modeling
- Resource utilization by workflow state

---

*End of PRD-009*
