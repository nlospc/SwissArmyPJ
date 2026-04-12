# PRD-201 — Evidence & Traceability

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-201 |
| **Status** | Draft |
| **Type** | Cross-cutting |
| **Parent** | `docs/PRD/PRD-001-Master.md` |
| **Last Updated** | 2026-04-11 |

---

## 1. 目的

本文件定义 SwissArmyPM 的跨模块机制：Evidence 与 Traceability 闭环。

---

## 2. 闭环步骤

1. `Capture`：采集或导入证据
2. `Store`：按项目归档并保留元数据
3. `Link`：把证据与结构化对象建立关联
4. `Compare`：用新证据比对已有事实
5. `Propose`：生成候选事实或更新建议
6. `Confirm`：由 PM 决定是否写入核心对象
7. `Trace`：保留答案、更新与来源之间的引用关系

---

## 3. 设计要求

- 任何重要结论都应尽量能回溯到具体 Evidence
- 证据不足时允许返回“不确定”
- Agent 只能提出建议，不能绕过 PM 直接确认核心事实
- 闭环应适用于 Canvas、Stakeholders、Timeline、Risks、Work Packages

---

## 4. 后续数据对象方向

- `Evidence`
- `EvidenceChunk`
- `FactAssertion`
- `ChangeProposal`
- `SourceLink`
- `IngestLog`
