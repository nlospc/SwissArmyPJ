> ⚠️ **已取代** — 本 PRD 已被 [PRD-001-Master.md](./PRD-001-Master.md) 取代。
> 当前产品方向为 **PM Workspace**，请以 Master PRD 为准。
> 本文档仅供历史参考。

# PRD-009: AI Provider Specification

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-009 |
| **Parent** | @PRD-001-Master.md |
| **Status** | Draft |
| **Phase** | Phase 2 |
| **Date** | 2026-01-30 |

---

## 1. Overview

The AI Provider layer enables optional AI-powered features while maintaining "AI-optional" principles. All suggestions require user confirmation.

**Dependencies**: @PRD-002-DataModel.md, @PRD-003-Inbox.md
**Dependents**: None (enhances other features)

---

## 2. Design Principles

| Principle | Description |
|-----------|-------------|
| **AI-Optional** | All features work without AI configured |
| **Human-in-the-Loop** | AI suggests; user confirms |
| **Provider-Agnostic** | Pluggable providers, no vendor lock-in |
| **Graceful Degradation** | Provider failures don't break core features |

---

## 3. Supported Providers

| Provider | Type | MVP | Phase 2 |
|----------|------|-----|---------|
| OpenAI | Cloud API | ❌ | ✅ |
| Anthropic | Cloud API | ❌ | ✅ |
| Ollama | Local | ❌ | ✅ |
| Custom Endpoint | Enterprise | ❌ | ✅ |

---

## 4. Provider Configuration

### 4.1 Schema

```sql
CREATE TABLE ai_providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  provider_type TEXT NOT NULL, -- openai, anthropic, ollama, custom
  endpoint_url TEXT,
  model_id TEXT NOT NULL,
  api_key_ref TEXT, -- Reference to OS keychain entry
  is_default INTEGER DEFAULT 0,
  enabled INTEGER DEFAULT 1,
  config TEXT, -- JSON: provider-specific settings
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### 4.2 Configuration UI

```
┌─────────────────────────────────────────────────────────────┐
│  AI Provider Settings                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Provider:     [OpenAI ▼]                                  │
│  Model:        [gpt-4-turbo ▼]                             │
│  API Key:      [••••••••••••••••] [Show] [Test]            │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  Feature Toggles:                                           │
│  ☑ Inbox: Classification suggestions                       │
│  ☑ Inbox: Field extraction                                 │
│  ☑ Inbox: Duplicate detection                              │
│  ☐ Reporting: Summary generation                           │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  Status: ✅ Connected (last test: 2 min ago)               │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                              [Cancel]  [Save]              │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. API Key Storage

### 5.1 OS Keychain Integration

| Platform | Storage |
|----------|---------|
| Windows | Credential Manager |
| macOS | Keychain |
| Linux | Secret Service (libsecret) |

### 5.2 Rust Implementation

```rust
use keyring::Entry;

fn store_api_key(provider_id: &str, api_key: &str) -> Result<(), Error> {
    let entry = Entry::new("swissarmypm", provider_id)?;
    entry.set_password(api_key)?;
    Ok(())
}

fn get_api_key(provider_id: &str) -> Result<String, Error> {
    let entry = Entry::new("swissarmypm", provider_id)?;
    entry.get_password()
}

fn delete_api_key(provider_id: &str) -> Result<(), Error> {
    let entry = Entry::new("swissarmypm", provider_id)?;
    entry.delete_password()?;
    Ok(())
}
```

---

## 6. AI Capabilities

### 6.1 Capability Matrix

| Capability | Used By | Input | Output |
|------------|---------|-------|--------|
| Classification | Inbox | Raw content | Item type suggestion |
| Field Extraction | Inbox | Raw content | Title, dates, owner, priority |
| Duplicate Detection | Inbox | Content + existing items | Similar item IDs + scores |
| Summary Generation | Reporting | Structured data | Natural language summary |
| Tag Suggestion | Inbox | Content | Relevant tags |

### 6.2 Capability Interface

```rust
// Unified suggestion interface
trait AISuggester {
    async fn suggest(&self, request: SuggestionRequest) -> Result<SuggestionResponse, Error>;
}

struct SuggestionRequest {
    capability: Capability,
    content: String,
    context: Option<SuggestionContext>, // Project list, existing items, etc.
    max_suggestions: usize,
}

struct SuggestionResponse {
    suggestions: Vec<Suggestion>,
    confidence: f32,
    model_used: String,
    tokens_used: usize,
}

struct Suggestion {
    field: String,
    value: serde_json::Value,
    confidence: f32,
    reasoning: Option<String>,
}
```

---

## 7. Confirmation Flow

### 7.1 Suggestion Display

```
┌─────────────────────────────────────────────────────────────┐
│  AI Suggestions                              Confidence: 87%│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Field          │ Suggestion        │ Accept              │
│  ────────────────┼───────────────────┼──────────────────── │
│  Title          │ "Q1 Risk Review"  │ [✓ Accept] [✗]     │
│  Type           │ Issue             │ [✓ Accept] [✗]     │
│  Priority       │ High (92%)        │ [✓ Accept] [✗]     │
│  Project        │ Project Alpha     │ [○ Override ▼]     │
│  Due Date       │ 2026-02-15        │ [✓ Accept] [✗]     │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  ⚠️ Potential Duplicates:                                   │
│     • "Q1 Risk Assessment" (78% similar) [View] [Merge]    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│        [Reject All]  [Accept Selected]  [Accept All]       │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Confirmation Requirement

**CRITICAL**: No AI suggestion persists without explicit user action.

```rust
fn apply_suggestion(item_id: Uuid, suggestion: Suggestion, user_confirmed: bool) -> Result<(), Error> {
    if !user_confirmed {
        return Err(Error::ConfirmationRequired);
    }
    
    // Apply suggestion
    update_item_field(item_id, &suggestion.field, &suggestion.value)?;
    
    // Audit log with AI source
    write_audit_entry(AuditEntry {
        action: "ai_suggestion_applied",
        source: "ai",
        metadata: json!({
            "confidence": suggestion.confidence,
            "model": suggestion.model_used,
        }),
        ..
    })?;
    
    Ok(())
}
```

---

## 8. Provider Implementation

### 8.1 OpenAI Provider

```rust
struct OpenAIProvider {
    client: reqwest::Client,
    api_key: String,
    model: String,
}

impl AISuggester for OpenAIProvider {
    async fn suggest(&self, request: SuggestionRequest) -> Result<SuggestionResponse, Error> {
        let prompt = build_prompt(&request);
        
        let response = self.client
            .post("https://api.openai.com/v1/chat/completions")
            .header("Authorization", format!("Bearer {}", self.api_key))
            .json(&json!({
                "model": self.model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3,
            }))
            .send()
            .await?;
        
        parse_response(response).await
    }
}
```

### 8.2 Ollama Provider (Local)

```rust
struct OllamaProvider {
    endpoint: String, // Default: http://localhost:11434
    model: String,
}

impl AISuggester for OllamaProvider {
    async fn suggest(&self, request: SuggestionRequest) -> Result<SuggestionResponse, Error> {
        let prompt = build_prompt(&request);
        
        let response = reqwest::Client::new()
            .post(format!("{}/api/generate", self.endpoint))
            .json(&json!({
                "model": self.model,
                "prompt": prompt,
                "stream": false,
            }))
            .send()
            .await?;
        
        parse_response(response).await
    }
}
```

---

## 9. Error Handling

### 9.1 Failure Modes

| Error | Handling |
|-------|----------|
| No provider configured | Skip AI features, no error shown |
| API key invalid | Show settings prompt |
| Rate limited | Queue and retry with backoff |
| Network timeout | Show warning, allow manual input |
| Model error | Log error, fall back to manual |

### 9.2 Graceful Degradation

```rust
async fn get_inbox_suggestions(content: &str) -> InboxSuggestions {
    let ai_provider = get_default_ai_provider();
    
    match ai_provider {
        Some(provider) => {
            match provider.suggest(build_inbox_request(content)).await {
                Ok(response) => InboxSuggestions::from_ai(response),
                Err(e) => {
                    log::warn!("AI suggestion failed: {}", e);
                    InboxSuggestions::empty()
                }
            }
        }
        None => InboxSuggestions::empty()
    }
}
```

---

## 10. Feature Toggles

### 10.1 Toggle Schema

```sql
CREATE TABLE ai_feature_toggles (
  id TEXT PRIMARY KEY,
  feature_name TEXT NOT NULL UNIQUE,
  enabled INTEGER DEFAULT 1,
  provider_id TEXT REFERENCES ai_providers(id),
  updated_at TEXT NOT NULL
);
```

### 10.2 Default Toggles

| Feature | Default | Description |
|---------|---------|-------------|
| inbox_classification | ON | Suggest item type |
| inbox_extraction | ON | Extract fields from content |
| inbox_duplicates | ON | Detect similar items |
| report_summary | OFF | Generate report summaries |

---

## 11. Acceptance Criteria

| AC# | Criteria | Test Method |
|-----|----------|-------------|
| AC-01 | App works without AI provider | E2E test |
| AC-02 | API key stored in OS keychain | Integration test |
| AC-03 | Provider connection test works | Integration test |
| AC-04 | Suggestions display with confidence | E2E test |
| AC-05 | Suggestions require confirmation | E2E test |
| AC-06 | Provider failure doesn't break inbox | Integration test |
| AC-07 | Feature toggles enable/disable features | Unit test |
| AC-08 | Ollama local provider works offline | Integration test |
| AC-09 | Audit log records AI-applied changes | Integration test |

---

## 12. Related Documents

- @PRD-001-Master.md — Master PRD
- @PRD-003-Inbox.md — AI suggestions in inbox
- @PRD-007-Reporting.md — AI summary generation

---

*End of PRD-009*
