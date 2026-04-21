# 数据模型文档

> 最后更新：2026-04-11

---

## 一、当前 Schema（旧模型）

> 基于 `src/main/database/schema.ts` 实际建表语句。

### 当前表结构

```
workspaces          portfolios          projects
──────────          ──────────          ────────
id (PK)             id (PK)             id (PK)
uuid                uuid                uuid
name                name                portfolio_id (FK)
created_at          description         name
updated_at          created_at          description
                    updated_at          status
                                        start_date
                                        end_date
                                        metadata_json
                                        created_at
                                        updated_at

work_items          dependencies        inbox_items
───────────         ────────────        ────────────
id (PK)             id (PK)             id (PK)
uuid                uuid                uuid
project_id (FK)     predecessor_id      filename
parent_id           successor_id        file_path
type                type                processed
title               lag_days            extracted_data_json
description                              created_at
status                                   updated_at
priority
assigned_to
scheduling_mode
start_date
end_date
duration_days
progress
budget_planned
budget_actual
level
metadata_json
created_at
updated_at

todos               settings            audit_log
─────               ────────            ──────────
id (PK)             id (PK)             id (PK)
uuid                key                 uuid
title               value               entity_type
description                             entity_id
status                                  action
priority                                user_id
due_date                                source
project_id (FK)                         old_values_json
work_item_id (FK)                       new_values_json
completed_at                            created_at
estimated_minutes
actual_minutes
pomodoros_completed
created_at
updated_at
```

### 层级关系

```
Workspace
  └── Portfolio
        └── Project
              └── Work Item (支持 parent_id 自引用树)
                    └── Todo
                            ├── Dependency (Work Item 间)
                            └── Inbox Item (文件处理)
```

### 核心问题

1. **以 Portfolio 为中心**: 层级是 portfolio → project → work_item，不是 PM Workspace 的项目 → 领域对象
2. **缺少领域对象**: 没有 Canvas、Stakeholder、Risk、Evidence 等表
3. **Todo 和 Work Item 边界模糊**: todo 和 work_item 都能表达任务
4. **metadata_json 滥用**: project 和 work_item 的 metadata_json 缺乏结构定义
5. **Inbox 仅做文件处理**: 没有证据归档和来源追溯能力

---

## 二、目标 Domain 模型（PM Workspace 方向）

> 基于 PRD-001-Master.md 定义的目标数据模型。

### 核心一等对象

```
Project ──────────────────────────────────────────
  │
  ├── ProjectCanvas        项目基本信息、目标、范围、约束
  │     id, project_id, title, objectives, scope,
  │     constraints, assumptions, status, updated_at
  │
  ├── Stakeholder[]        干系人管理
  │     id, project_id, name, role, influence_level,
  │     interest_level, contact_info, notes,
  │     engagement_strategy, created_at, updated_at
  │
  ├── TimelineItem[]       时间规划
  │     id, project_id, title, type (milestone/phase/deliverable),
  │     planned_start, planned_end, actual_start, actual_end,
  │     status, dependencies[], notes, created_at, updated_at
  │
  ├── RiskItem[]           风险登记册
  │     id, project_id, title, category,
  │     probability, impact, risk_score,
  │     mitigation_strategy, contingency_plan,
  │     owner, status, created_at, updated_at
  │
  ├── WorkPackage[]        工作包
  │     id, project_id, parent_id, title, description,
  │     status, priority, assigned_to,
  │     planned_start, planned_end, actual_start, actual_end,
  │     progress, budget_planned, budget_actual,
  │     created_at, updated_at
  │
  └── Evidence[]           证据/资料
        id, project_id, title, source_type (meeting/email/im/document),
        content, source_ref, collected_at,
        linked_object_type, linked_object_id,
        created_at, updated_at
```

### 扩展模型（P2 阶段）

```
FactAssertion        事实断言 — 从证据中提取的结构化事实
ChangeProposal       变更建议 — AI 生成的更新建议
ConflictSet          冲突集 — 检测到的事实冲突
```

### 目标层级

```
Project List (首页)
  └── Project
        ├── Canvas
        ├── Stakeholders
        ├── Timeline
        ├── Risks
        ├── Work Packages
        └── Evidence
```

---

## 三、迁移策略

### 原则

- **不推倒重来**: 保留 workspaces 和 projects 表的现有数据
- **渐进迁移**: 新增表，旧表保留，逐步切换前端到新模型
- **双写过渡**: 过渡期同时维护旧表和新表

### Phase 1: 新增领域表

```sql
-- 新增表，不影响现有 schema
CREATE TABLE project_canvases (...);
CREATE TABLE stakeholders (...);
CREATE TABLE risk_items (...);
CREATE TABLE evidence (...);

-- 复用 work_items 表作为 WorkPackage 的起点
-- 后续考虑 ALTER TABLE 或新表
```

### Phase 2: 数据迁移

- 现有 projects 数据保留，补充 project_canvases 记录
- 现有 work_items 映射为 work_packages（字段基本兼容）
- portfolios 降级为可选分组，不再作为核心层级

### Phase 3: 下调旧模型

- todos 表 → 降级为个人便签，不再作为核心对象
- inbox_items 表 → 演进为 evidence 的录入入口
- portfolios 表 → 保留但不再主导导航

### 迁移执行方式

当前没有 migration 框架。建议：
1. 引入 schema 版本号（在 settings 表中记录 `schema_version`）
2. 每次变更写迁移脚本到 `scripts/migrations/`
3. 应用启动时检查版本并自动执行未运行的迁移
