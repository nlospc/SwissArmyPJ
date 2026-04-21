> ⚠️ **已取代** — 本 PRD 已被 [PRD-001-Master.md](./PRD-001-Master.md) 取代。
> 当前产品方向为 **PM Workspace**，请以 Master PRD 为准。
> 本文档仅供历史参考。

# PRD-010: User Personas

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-010 |
| **Parent** | @PRD-001-Master.md |
| **Status** | Draft |
| **Date** | 2026-01-30 |

---

## 1. Primary Persona: Enterprise IT Project Manager ("Alex")

### 1.1 Demographics

| Attribute | Value |
|-----------|-------|
| **Name** | Alex Chen |
| **Age** | 35-45 |
| **Role** | Senior IT Project Manager |
| **Company** | Fortune 500 enterprise |
| **Experience** | 8-15 years in project management |
| **Certifications** | PMP, possibly ITIL, Agile |
| **Reports To** | PMO Director or IT Director |
| **Team Size** | 10-50 stakeholders across projects |

### 1.2 Technical Profile

| Skill | Level |
|-------|-------|
| MS Project | Advanced |
| Excel | Advanced |
| PowerPoint | Advanced |
| SQL/Databases | Basic awareness |
| Scripting | None to basic |
| New software adoption | Moderate comfort |

### 1.3 Current Tool Stack

- **Planning**: MS Project (mandated by organization)
- **Tracking**: Excel spreadsheets (personal system)
- **Communication**: Outlook, Teams/Slack
- **Documentation**: SharePoint, Confluence
- **Reporting**: PowerPoint (manual assembly)
- **Issue Tracking**: ServiceNow, Jira (read access)

### 1.4 Daily Workflow

| Time | Activity | Pain Points |
|------|----------|-------------|
| 8:00 | Email/chat triage | Important updates buried in threads |
| 8:30 | Update personal tracking spreadsheet | Manual data entry, version confusion |
| 9:00 | Team standup | Notes captured in email, not linked to tasks |
| 10:00 | Stakeholder meetings | Status questions require "let me check and get back" |
| 12:00 | MS Project updates | File on network share may have conflicts |
| 14:00 | Risk review | Risks tracked in separate Excel, not linked |
| 16:00 | Report preparation | 1-2 hours copying data into PowerPoint |

### 1.5 Pain Points (Prioritized)

1. **Context Loss** (Critical): "Every morning I spend 20 minutes figuring out where I left off across 3 projects"
2. **Data Staleness** (Critical): "My MS Project file is outdated within 2 days of publishing"
3. **Report Assembly** (High): "I spend Friday afternoon copying numbers into slides"
4. **Information Scatter** (High): "Risks are in Excel, tasks in MSP, updates in email"
5. **Audit Trail** (Medium): "When PMO asks 'who changed this?', I can't always answer"

### 1.6 Goals

1. Single source of truth for project status
2. 30-second context recovery when switching projects
3. Automated weekly report generation
4. Traceable change history for governance
5. Offline capability (works during travel)

### 1.7 Objections / Concerns

- "I can't abandon MS Project—it's mandated"
- "I don't have time to learn a complex new tool"
- "My data can't go to the cloud—security/compliance"
- "What if this tool goes away?"

### 1.8 Success Metrics

- Report generation time: 2 hours → 10 minutes
- Daily context recovery: 20 minutes → 2 minutes
- Data currency: Stale within days → Always current
- Audit queries: "I'll get back to you" → Immediate answer

---

## 2. Secondary Persona: PMO Lead ("Jordan")

### 2.1 Demographics

| Attribute | Value |
|-----------|-------|
| **Name** | Jordan Williams |
| **Age** | 40-50 |
| **Role** | PMO Director / Portfolio Manager |
| **Experience** | 15+ years, 5+ in PMO leadership |
| **Certifications** | PMP, PgMP, possibly MBA |
| **Team** | Oversees 5-10 project managers |
| **Projects** | 15-30 active projects in portfolio |

### 2.2 Focus Areas

- Portfolio-level visibility
- Resource allocation
- Executive reporting
- Process standardization
- Governance and compliance

### 2.3 Current Challenges

1. **Inconsistent Reporting**: Each PM uses different formats
2. **Aggregation Overhead**: Manual rollup of status across projects
3. **Stale Data**: Portfolio view based on last week's snapshots
4. **Standards Enforcement**: Templates exist but aren't followed
5. **Audit Preparation**: Gathering evidence for compliance reviews

### 2.4 Goals

1. Real-time portfolio dashboard
2. Standardized templates and field dictionaries
3. One-click executive summary generation
4. Drill-down from portfolio to project to task
5. Audit-ready change history

### 2.5 Feature Priorities

| Feature | Priority for Jordan |
|---------|---------------------|
| Portfolio Dashboard | Critical |
| Template Management | Critical |
| Field Dictionary | High |
| Monthly Report | High |
| Audit Log | High |
| Individual Project Tools | Medium (delegates to PMs) |

---

## 3. Tertiary Persona: Technical Lead ("Sam")

### 3.1 Demographics

| Attribute | Value |
|-----------|-------|
| **Name** | Sam Patel |
| **Age** | 28-35 |
| **Role** | Technical Lead / Senior Developer |
| **Experience** | 5-10 years in software development |
| **Relationship** | Reports to Alex on project work |

### 3.2 Current Frustrations

- "I just need to see what's assigned to me and update it"
- "MS Project is overkill for my needs"
- "I don't care about the PM ceremony—just the data"
- "Meetings to discuss status that's already in a tool"

### 3.3 Desired Features

| Feature | Sam's Need |
|---------|------------|
| Task List | See my assigned tasks, filter by project |
| Status Update | Mark task complete in 2 clicks |
| Timeline View | Understand dependencies affecting my work |
| Minimal UI | No clutter, no PM jargon |

### 3.4 Anti-Features (What Sam Doesn't Want)

- Complex dashboards
- Report generation
- Portfolio views
- AI suggestions
- Governance features

### 3.5 Access Model

- Read access to project timeline
- Write access to own tasks (status, notes)
- No access to budget, resource, or portfolio data

---

## 4. Persona Comparison Matrix

| Attribute | Alex (PM) | Jordan (PMO) | Sam (Tech Lead) |
|-----------|-----------|--------------|-----------------|
| Primary Goal | Manage projects efficiently | Oversee portfolio | Complete tasks |
| Key Feature | Inbox + Timeline | Dashboard + Templates | Task list |
| AI Interest | High (save time) | Medium (reports) | Low (unnecessary) |
| Data Entry | Moderate | Low (consumes) | Minimal |
| Report Generation | Weekly | Monthly/Executive | Never |
| Audit Needs | Medium | High | None |
| Offline Needs | High (travel) | Low | Medium |
| Learning Tolerance | 2-3 hours | 1 hour | 15 minutes |

---

## 5. User Journey: Alex's First Week

### Day 1: Setup & Import
1. Install SwissArmyPM
2. Import existing MS Project file
3. Review mapped items
4. Configure watched folder for future MSP exports

### Day 2: Inbox Workflow
1. Drop meeting notes into inbox
2. Triage items, assign to project
3. AI suggests task classification
4. Confirm and save

### Day 3: Timeline Usage
1. Open project timeline
2. Drag task to adjust date
3. See dependency warning
4. Update status on 3 tasks

### Day 4: Dashboard & Reporting
1. Open portfolio dashboard
2. Review change feed
3. Generate weekly report
4. Export to Markdown, copy to email

### Day 5: Sync & Governance
1. MS Project file updated by colleague
2. Rebuild engine shows diff
3. Resolve one conflict
4. Review audit log for changes

---

## 6. Related Documents

- @PRD-001-Master.md — Master PRD
- @PRD-003-Inbox.md — Inbox workflow (Alex focus)
- @PRD-006-Dashboard.md — Dashboard (Jordan focus)
- @PRD-005-Timeline.md — Timeline (all personas)

---

*End of PRD-010*
