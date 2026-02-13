# 项目概述

SwissArmyPM 是一个轻量级的桌面项目管理工具，具有 AI 集成能力。

## 🎯 项目愿景

打造一个功能强大、轻量级、易用的桌面项目管理工具，帮助用户高效管理任务和项目。

## 🏗️ 架构概览

### 技术架构

```
┌─────────────────────────────────────────────────────────┐
│                    Electron 桌面应用                     │
├─────────────────────────────────────────────────────────┤
│  Renderer Process (React + Vite)                       │
│  ├── UI 层: Ant Design v5 组件库                        │
│  ├── 状态管理: Zustand                                  │
│  ├── 样式: Tailwind CSS + Ant Design Theme             │
│  └── 工具库: date-fns, immer 等                         │
├─────────────────────────────────────────────────────────┤
│  Main Process (Electron)                               │
│  ├── 窗口管理                                           │
│  ├── IPC 通信                                           │
│  └── 系统集成                                           │
├─────────────────────────────────────────────────────────┤
│  Data Layer (SQLite + FTS5)                            │
│  ├── 项目数据                                           │
│  ├── 任务管理                                           │
│  └── 全文搜索                                           │
└─────────────────────────────────────────────────────────┘
```

### 核心功能模块

- 📊 **Dashboard** - 项目组合总览、风险分析、变更动态  （详见 [PRD-006](./PRD/PRD-006-Dashboard.md)）
- 📋 **My Work** - 个人任务管理、时间跟踪、番茄钟  （详见 [PRD-011](./PRD/PRD-011-MyWork.md)）
- 📁 **Projects** - 项目管理、层级任务、Excel 风格甘特图  （与 [PRD-002](./PRD/PRD-002-DataModel.md)、[PRD-005](./PRD/PRD-005-Timeline.md) 联动）
- 📥 **Inbox** - 快速捕获、智能分类、批量处理  （详见 [PRD-003](./PRD/PRD-003-Inbox.md)）
- 📈 **Timeline** - 可视化时间线、依赖关系、关键路径  （详见 [PRD-005](./PRD/PRD-005-Timeline.md)）
- 🔍 **Search** - FTS5 全文搜索、跨项目查询  （建议补充独立 PRD：PRD-012-Search）
- ⚙️ **Settings** - 用户偏好、数据导入/导出、主题设置  （建议补充独立 PRD：PRD-013-Settings）

## 📦 项目结构

```
SwissArmyPM/
├── docs/              # 项目文档
├── design/            # 设计系统资源
├── scripts/           # 构建和工具脚本
├── src/
│   ├── main/         # Electron 主进程代码
│   ├── renderer/     # React 渲染进程代码
│   └── shared/       # 共享类型定义
├── templates/        # 应用模板
└── package.json      # 项目配置
```

## 🔄 开发路线图



### ✅ 已完成 (Phase 1)

- ✅ 基础架构：Electron + React 19 + Vite + TypeScript

- ✅ 数据库：SQLite 完整 schema + 迁移系统 (4 个迁移)

- ✅ IPC 层：50+ 处理器 (portfolios, projects, work_items, inbox, todos, dashboard)

- ✅ UI 迁移：Ant Design v5 全面集成 (已完成 Radix UI 迁移)

- ✅ 状态管理：Zustand stores 覆盖所有核心功能

- ✅ My Work 后端：19 个 IPC 处理器 (时间跟踪、番茄钟、统计)

- ✅ Dashboard：组合汇总、风险分析、变更动态

- ✅ Gantt 图表：Excel 风格冻结窗格、拖拽交互、多视图模式

- ✅ 审计日志：完整的变更追踪和治理支持



### 🚧 进行中 (Phase 2)

- 🔨 My Work 前端：组件集成和用户测试

- 🔨 Inbox 处理：AI 驱动的字段提取

- 🔨 搜索 UI：全局搜索界面 (后端已就绪)

- 🔨 依赖可视化：任务依赖关系和关键路径

- 🔨 数据导入/导出：CSV/MSP 格式支持



### 📅 计划中 (Phase 3)

- 📋 日历集成：外部日历同步 (Google/Outlook)

- 📋 测试框架：Vitest 单元测试 + Playwright E2E

- 📋 性能优化：虚拟滚动、懒加载、分页

- 📋 Tauri 迁移：从 Electron 迁移到 Tauri v2

- 📋 AI 增强：自然语言任务创建、智能建议

## 🎨 设计理念

### 1. 简洁优先
保持界面简洁，突出核心功能，避免过度设计。

### 2. 性能至上
优化渲染性能，确保在大数据量下仍保持流畅。

### 3. 可扩展性
模块化设计，便于功能扩展和维护。

### 4. 用户友好
直观的交互设计，降低学习成本。
