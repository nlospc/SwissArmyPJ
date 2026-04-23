# 快速开始

本文档描述当前 SwissArmyPM monorepo 的可复用本地开发流程。

## 前置要求

- Node.js >= 18
- npm >= 9
- Git（可选）
- Bun >= 1.1（仅当你需要运行 `packages/pmbrain` 的 CLI 时）

## 仓库结构

当前仓库是一个 monorepo，包含两个独立包：

- `packages/swissarmypm`：Electron + React + Vite 桌面应用
- `packages/pmbrain`：Bun + TypeScript CLI / 知识脑

日常开发请始终从仓库根目录开始。

## 1. 克隆仓库

```bash
git clone git@github.com:nlospc/SwissArmyPJ.git
cd SwissArmyPJ
```

## 2. 安装依赖

根目录的标准安装方式是：

```bash
npm install
```

说明：
- 这是整个 workspace 的标准安装入口
- `pmbrain` 的运行时命令仍然依赖 Bun，但根目录依赖安装和校验流程以 npm 为主

## 3. 常用本地开发命令

### SwissArmyPM 桌面应用

```bash
npm run dev:swissarmypm
npm run type-check:swissarmypm
npm run build:swissarmypm
npm run verify:swissarmypm
npm run verify:swissarmypm:strict
```

其中：
- `dev:swissarmypm`：启动桌面应用开发环境
- `type-check:swissarmypm`：执行 SwissArmyPM 的严格 TypeScript 校验，用于清理历史类型债务
- `build:swissarmypm`：执行生产构建
- `verify:swissarmypm`：默认本地验证入口，执行稳定可通过的桌面应用构建验证
- `verify:swissarmypm:strict`：先 type-check 再 build，适合专门处理类型问题时使用

### PMBrain

```bash
npm run check:pmbrain
npm run type-check:pmbrain
npm run dev:pmbrain
```

说明：
- `check:pmbrain` / `type-check:pmbrain`：执行 PMBrain 的 TypeScript 静态校验
- `dev:pmbrain`：会调用包内的 Bun CLI，因此需要本机已安装 Bun

### 整个 workspace 的校验

```bash
npm run verify:workspace
```

当前它会：
- 校验并构建 `swissarmypm`
- 校验 `pmbrain`

这条命令适合作为跨包修改后的本地总验证入口。

## 4. 推荐日常流程

### 只改 SwissArmyPM 时

```bash
npm install
npm run verify:swissarmypm
```

### 修改了 workspace 级脚本、共享约定或跨包边界时

```bash
npm install
npm run verify:workspace
```

### 需要运行 PMBrain CLI 时

```bash
npm run dev:pmbrain
```

如果失败，请先确认 Bun 已安装。

## 5. 常见问题

### `npm install` 失败

先确认你是在仓库根目录执行。

然后尝试：

```bash
rm -rf node_modules package-lock.json
npm install
```

### `npm run dev:pmbrain` 失败

这通常意味着本机没有安装 Bun。先安装 Bun，再重新执行。

### `better-sqlite3` / Electron native 模块异常

先重新安装依赖，再重跑构建：

```bash
npm install
npm run build:swissarmypm
```

## 6. 下一步

- 桌面应用开发：优先查看 `packages/swissarmypm/CLAUDE.md`
- 仓库级规范：查看根目录 `AGENTS.md` 和 `CLAUDE.md`
- 产品与架构文档：查看 `docs/`
