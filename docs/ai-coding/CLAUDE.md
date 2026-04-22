# Claude Code 工作说明

> 最后更新：2026-04-11
> 本文件为 Claude Code / AI 编码助手的 workspace 级指令。

---

## 🎯 本文件职责

本文件只负责编码工作说明。

产品方向、用户边界、非目标与最高优先级规则，统一以根目录 `CLAUDE.md` 为准。

如果需要产品背景，请按需读取：

1. `../../CLAUDE.md`
2. `../MEMORY.md`
3. `../AGENT-DESIGN-BRIEF.md`
4. `../PRD/PRD-001-Master.md`
5. 相关模块 PRD

如果任务涉及架构、目录组织、文件拆分/合并、domain 边界，请额外读取：

6. `../../.claude/skills/architecture-agent.md`
7. `../architecture/RETRIEVAL-UNIT-GUIDANCE.md`

---

## 📁 实际目录结构

```
SwissArmyPM/
├── src/
│   ├── main/                  # Electron 主进程
│   │   ├── database/          # SQLite schema + migration
│   │   │   └── schema.ts      # 建表语句 + 初始化逻辑
│   │   ├── ipc/               # IPC handlers（按 domain 拆分）
│   │   │   ├── handlers.ts    # 主 handler（portfolio/project/work-item/inbox/todo/settings）
│   │   │   ├── myWorkHandlers.ts
│   │   │   └── dashboardHandlers.ts
│   │   └── index.ts           # Electron 入口
│   ├── renderer/              # React 前端
│   │   ├── components/        # 通用组件
│   │   │   ├── common/        # ThemeToggle 等
│   │   │   ├── dashboard/     # Dashboard 相关组件（旧方向）
│   │   │   ├── gantt/         # 甘特图组件（旧方向，待重构为 Timeline）
│   │   │   ├── portfolio/     # Portfolio 组件（旧方向）
│   │   │   └── features/      # Sidebar 等
│   │   ├── features/          # 功能模块
│   │   │   └── my-work/       # My Work 功能（旧方向，保留可用）
│   │   ├── stores/            # Zustand stores
│   │   ├── pages/             # 页面组件
│   │   ├── hooks/             # 自定义 hooks
│   │   ├── lib/               # 工具函数 + IPC bridge
│   │   ├── config/            # 主题配置
│   │   ├── contexts/          # React contexts
│   │   ├── i18n/              # 国际化
│   │   ├── theme/             # 主题定义
│   │   ├── types/             # 类型声明
│   │   └── utils/             # 工具函数
│   └── shared/                # 主进程/渲染进程共享
│       └── types/index.ts     # 共享类型定义
├── docs/                      # 项目文档
│   ├── PRD/                   # 产品需求文档
│   ├── architecture/          # 架构文档
│   └── ai-coding/             # 本文件所在目录
├── design/                    # 设计资源
├── scripts/                   # 构建脚本
└── .claude/skills/            # Claude Code skills
```

---

## 🔑 编码规则

### 1. 方向引用规则

- 新增代码必须遵循根目录 `CLAUDE.md`
- 不要在本文件重复扩展产品方向正文
- 需要模块细节时，优先读取对应 `PRD/modules/*.md`

### 2. 代码在哪里工作

| 职责 | 位置 |
|------|------|
| 数据库 Schema | `src/main/database/schema.ts` |
| 共享类型 | `src/shared/types/index.ts` |
| IPC Handlers | `src/main/ipc/` |
| React 页面 | `src/renderer/pages/` |
| UI 组件 | `src/renderer/components/` |
| 功能模块 | `src/renderer/features/` |
| 状态管理 | `src/renderer/stores/` |
| IPC Bridge | `src/renderer/lib/` |

### 2.1 架构 agent 的拆分规则

- 不按文件行数机械拆分
- 优先按 domain + runtime + 检索单元组织代码
- 同一问题的相关方法尽量收敛在同一文件或同一 feature 单元
- 只有出现真正边界时才拆：runtime、domain、生命周期、依赖方向、公共 contract
- 禁止把完整功能过早打碎成很多薄文件，增加 agent 检索噪音

### 3. 当前实际技术栈

| 层 | 技术 | 版本 |
|---|---|---|
| 桌面框架 | Electron | ^29 |
| 前端框架 | React | ^19 |
| 语言 | TypeScript | ^5.7 |
| 构建工具 | Vite | ^6 |
| UI 组件库 | Ant Design | ^5.29 |
| 图标 | @ant-design/icons + lucide-react | - |
| 样式 | Tailwind CSS ^3 + Ant Design Theme Token | - |
| 状态管理 | Zustand | ^5 |
| 本地数据库 | SQLite (better-sqlite3) | ^9.6 |
| IPC | Electron ipcMain/ipcRenderer | - |
| 日期 | date-fns ^4 + moment | - |
| 时间线 | vis-timeline ^8 | - |

### 4. 主题适配规范

所有 UI 代码必须使用 Ant Design theme token，禁止硬编码颜色。

详见 `.claude/skills/ui-standards.md`。

---

## 🚨 重要规则

1. 新增代码必须围绕 PM Workspace 方向，不要延续 Portfolio/My Work 叙事
2. 数据库 schema 变更要同步更新 `schema.ts` 和 `shared/types/index.ts`
3. 新增 IPC handler 需在对应 `*Handlers.ts` 中注册
4. UI 组件使用 `theme.useToken()` 获取颜色，不要硬编码
5. 布局用 `flex` + `h-full` + `min-h-0` 处理高度
6. 修改前先确认意图和范围，避免返工
7. 产品方向变更时同步更新根目录 `CLAUDE.md`、`docs/MEMORY.md` 与相关 PRD
8. 架构调整优先优化 agent/LLM 的上下文检索质量，不追求表面上的小文件化

---

## 📚 文档优先级

当文档互相冲突时，按以下顺序采信：

1. `CLAUDE.md`（根目录）
2. `docs/MEMORY.md`
3. `docs/PRD/PRD-001-Master.md`
4. `docs/overview.md`
5. 其他历史文档

---

## 📝 有用命令

```bash
npm run dev          # 启动开发
npm run build        # 构建
npm run type-check   # 类型检查
npm run migrate      # 运行数据库迁移
npm run migrate:status  # 查看迁移状态
```
