# PRD-001: SwissArmyPM 概述

> **注意**: 本文档是 [PRD-001-Master.md](./PRD-001-Master.md) 的概述版本。完整 PRD 请参阅 Master PRD。

---

## 产品定义

SwissArmyPM 是一个**只服务项目经理的桌面工作台**。

核心目标：让项目经理在一个独立桌面应用中快速维护、查看、校正和追溯项目关键事实。

---

## 核心用户

| 用户 | 说明 |
|------|------|
| **项目经理**（唯一核心用户） | 在桌面工作台中维护项目关键事实，逐步让系统基于证据辅助更新与回答 |

当前阶段不以 PMO、管理层、技术负责人为核心用户。

---

## 产品定位

不是协同工具，不是 PMO 平台，不是个人效率工具。

它是项目经理的**独立工作台**——即使不接入 Jira / MSP / Outlook / 飞书，也能独立使用。后续会考虑像openclaw那样接入tg、飞书bot

---

## 核心对象

产品围绕以下一等对象构建：

| 对象 | 说明 | MVP 优先级 |
|------|------|-----------|
| 项目画布 (Canvas) | 项目基本信息、目标、范围、约束 | P0 |
| 干系人 (Stakeholder) | 项目相关干系人及其角色、影响 | P0 |
| 时间规划表 (Timeline) | 项目里程碑、阶段、交付节点 | P0 |
| 风险登记册 (Risk Register) | 项目风险、影响、应对措施 | P0 |
| 工作包 (Work Package) | 项目工作分解与跟踪 | P0 |
| 证据 (Evidence) | 会议纪要、邮件、IM 摘录等来源材料 | P1 |

---

## 产品原则

1. **项目经理唯一核心用户** — 优化 PM 的日常操作面
2. **桌面独立可用优先** — 不依赖外部集成即可使用
3. **手工 CRUD 优先于自主代理** — AI 建议，不定义数据
4. **证据先沉淀，再自动化** — 先收证据，后做抽取
5. **关键答案必须可追溯** — 答案 + 来源
6. **快速更新优先于复杂流程** — 减少摩擦，不要增加仪式

---

## 信息架构

```
Project List
  └── Project Workspace
      ├── Canvas
      ├── Stakeholders
      ├── Timeline
      ├── Risks
      ├── Work Packages
      └── Evidence
```

---

## 技术栈

| 层 | 技术 |
|---|---|
| 桌面框架 | Electron 29 |
| 前端 | React 19 + TypeScript 5.7 + Vite 6 |
| UI | Ant Design 5 + Tailwind CSS 3 |
| 状态管理 | Zustand 5 |
| 本地存储 | SQLite (better-sqlite3) |

---

## 当前阶段

仓库已有可复用底座（Electron + React + SQLite），但现有实现与 PM Workspace 方向存在偏差。

策略：**不是推倒重来**，而是复用底座 + 调整信息架构 + 重构领域模型 + 围绕 PM Workspace 重建上层。

---

## 文档关系

- 本文件：概述版本（你正在看的）
- [PRD-001-Master.md](./PRD-001-Master.md)：完整 PRD（权威来源）
- `CLAUDE.md`（根目录）：AI 编码指令
- `docs/MEMORY.md`：项目记忆与偏差记录
