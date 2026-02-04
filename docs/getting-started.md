# 快速开始

本文档帮助你快速搭建和运行 SwissArmyPM 项目。

## 📋 前置要求

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 或 **pnpm** >= 8.0.0
- **Git** (可选，用于版本控制)

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
```

## 📂 项目结构

```
SwissArmyPM/
├── docs/              # 项目文档
├── design/            # 设计资源
├── scripts/           # 构建和工具脚本
├── src/
│   ├── main/         # Electron 主进程
│   ├── renderer/     # React 渲染进程
│   └── shared/       # 共享类型定义
├── templates/        # 应用模板
├── package.json
└── vite.config.ts
```

## 🎨 组件库

项目使用 **Ant Design v5** 作为 UI 组件库：

```bash
# Ant Design 已安装
npm install antd @ant-design/icons
```

详见 [组件库指南](./component-library.md)

## 🔧 开发工具

### VS Code 推荐插件

- ESLint
- Prettier
- TypeScript Vue Plugin (Volar)
- Auto Import - ES6, TS, JSX, Vue

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

- 阅读 [项目概述](./overview.md) 了解整体架构
- 查看 [组件库指南](./component-library.md) 学习如何使用 Ant Design
- 参考 [迁移指南](./migration-guide.md) 如果需要从 Radix UI 迁移

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

在提交 PR 前，请确保：

1. 代码通过类型检查 (`npm run type-check`)
2. 代码符合项目规范
3. 添加必要的文档和注释
