# 快速开始

本文档帮助你快速搭建和运行 SwissArmyPM 项目。

## 📋 前置要求

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 或 **pnpm** >= 8.0.0
- **Git**（可选，用于版本控制）

## 🚀 安装步骤

### 1. 克隆项目

```bash
git clone https://github.com/yourusername/swiss-army-pm.git
cd swiss-army-pm
```

### 2. 安装依赖

```bash
npm install
```

> 如果遇到 native 模块编译问题，运行 `npm rebuild`。

### 3. 启动开发服务器

```bash
npm run dev
```

这将启动 Vite 开发服务器和 Electron 应用。

## 🛠️ 开发命令

```bash
# 启动开发模式
npm run dev

# 构建生产版本
npm run build

# 类型检查
npm run type-check

# 数据库迁移
npm run migrate

# 查看迁移状态
npm run migrate:status

# 回滚迁移
npm run migrate:rollback

# 测试 IPC 处理器
npm run test:ipc
```

## 🛠️ 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 桌面框架 | Electron | 29+ |
| 前端框架 | React | 19 |
| UI 组件库 | Ant Design | 5 |
| 图标 | @ant-design/icons + lucide-react | — |
| 状态管理 | Zustand（基于 Immer） | 5 |
| 样式 | Tailwind CSS 3 + PostCSS | — |
| 构建工具 | Vite 6 + vite-plugin-electron | — |
| 类型系统 | TypeScript 5.7 | — |
| 数据库 | better-sqlite3（本地 SQLite） | 9 |
| 甘特图 | vis-timeline + vis-data + 自研 Excel 风格甘特图 | — |
| 日期处理 | date-fns 4 + moment | — |
| 国际化 | 自建 i18n（中/英） | — |

## 📂 项目结构

以下为当前实际目录结构（关键层级）：

```
SwissArmyPM/
├── docs/                          # 项目文档
│   ├── PRD/                       # 产品需求文档
│   ├── architecture/              # 架构文档
│   ├── ai-coding/                 # AI 编码规范
│   └── history/migrations/        # 迁移历史
├── design/                        # 设计资源与规范
│   └── guidelines/
├── scripts/                       # 构建与工具脚本
│   ├── migrate.js                 # 数据库迁移脚本
│   ├── check-db.js                # 数据库检查
│   └── ...                        # 其他工具脚本
├── src/
│   ├── main/                      # Electron 主进程
│   │   ├── index.ts               # 主进程入口
│   │   ├── database/
│   │   │   ├── schema.ts          # 数据库 Schema 定义
│   │   │   ├── migrationRunner.ts # 迁移执行器
│   │   │   └── migrations/        # SQL 迁移文件
│   │   └── ipc/
│   │       ├── handlers.ts        # 通用 IPC 处理器
│   │       ├── dashboardHandlers.ts
│   │       └── myWorkHandlers.ts
│   ├── renderer/                  # React 渲染进程
│   │   ├── App.tsx                # 应用根组件（含路由）
│   │   ├── main.tsx               # 渲染进程入口
│   │   ├── components/            # 通用 UI 组件
│   │   │   ├── common/            # 公共组件（ThemeToggle 等）
│   │   │   ├── features/          # 功能组件（Sidebar 等）
│   │   │   ├── dashboard/         # 仪表盘组件
│   │   │   ├── gantt/             # 甘特图组件
│   │   │   └── portfolio/         # 组合视图组件
│   │   ├── features/              # 功能模块
│   │   │   └── my-work/           # My Work 模块（旧方向）
│   │   ├── pages/                 # 页面级组件
│   │   ├── stores/                # Zustand 状态管理
│   │   ├── hooks/                 # 自定义 Hooks
│   │   ├── contexts/              # React Context
│   │   ├── config/                # 配置（主题等）
│   │   ├── theme/                 # 主题定义
│   │   ├── styles/                # 全局样式
│   │   ├── lib/                   # 工具库与 IPC 封装
│   │   ├── i18n/                  # 国际化
│   │   ├── types/                 # 类型定义
│   │   └── utils/                 # 工具函数
│   └── shared/
│       └── types/
│           └── index.ts           # 跨进程共享类型
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── postcss.config.js
```

## 🔧 开发工具

### VS Code 推荐插件

- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Auto Import

### 浏览器开发者工具

Electron 应用内置开发者工具：

- **Windows/Linux**: `Ctrl + Shift + I`
- **macOS**: `Cmd + Option + I`

## 🐛 常见问题

### 依赖安装失败

尝试清除缓存后重新安装：

```bash
rm -rf node_modules package-lock.json
npm install
```

### Electron 启动失败

确保已正确安装所有依赖，包括 native 模块：

```bash
npm rebuild
```

### TypeScript 类型错误

运行类型检查并修复：

```bash
npm run type-check
```

## 📚 下一步

- 阅读 `docs/PRD/PRD-001-Master.md` 了解当前产品方向（PM Workspace）
- 阅读 `CLAUDE.md` 了解项目最高优先级规范
- 阅读 `docs/MEMORY.md` 了解已确认的产品事实与文档冲突记录
