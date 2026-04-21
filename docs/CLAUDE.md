# CLAUDE.md

本文件是 `docs/` 目录的**文档入口文件**，不是产品方向正文。

## Canonical Source

`docs/` 下所有文档都以根目录 `CLAUDE.md` 为唯一 canonical brief。

如果这里与根目录 `CLAUDE.md` 冲突，**一律以根目录为准**。

---

## 按需加载顺序

当 agent 或人需要读取 `docs/` 文档时，建议按以下顺序按需加载：

1. `../CLAUDE.md` — 仓库级最高方向约束
2. `MEMORY.md` — 当前稳定共识与偏差记录
3. `AGENT-DESIGN-BRIEF.md` — 给 agent 的最小设计入口
4. `PRD/PRD-001-Master.md` — 产品总纲
5. `PRD/modules/*.md` — 模块级 PRD（按需读取）
6. `PRD/cross-cutting/*.md` — 跨模块机制（按需读取）
7. 其他专题文档 — 仅在需要时加载

---

## `docs/` 各类文档的职责

- `MEMORY.md`：记录已经确认的稳定事实，不写实现细节
- `AGENT-DESIGN-BRIEF.md`：给 agent 的最小约束入口
- `PRD/PRD-001-Master.md`：产品总纲与模块索引
- `PRD/modules/*.md`：模块施工图
- `PRD/cross-cutting/*.md`：跨模块规则，如 Evidence / Traceability
- `architecture/ARCHITECTURE.md`：当前实际架构说明
- `architecture/component-map.md`：现有组件方向归类
- `architecture/data-model.md`：旧 schema 与目标 schema 对照
- `history/`：历史方向文档，只做参考

---

## 维护规则

- 不在本文件重复维护产品方向正文
- 产品方向修改时，优先更新根目录 `CLAUDE.md`
- 模块细节不要继续堆进这里，写到对应模块 PRD
