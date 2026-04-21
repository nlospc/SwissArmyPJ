# SwissArmyPM 当前状态

**最后更新**: 2026-04-11  
**当前结论**: 仓库已有不少实现资产，但整体产品方向与最新目标存在明显偏差。

---

## 一句话判断

**当前实现更像“组合/任务/收件箱混合工具”，而不是“项目经理专用项目工作台”。**

---

## 已实现资产

目前仓库已经具备这些可复用资产：

- Electron + React + SQLite 的桌面应用基础架构
- IPC 通信与本地数据库能力
- 项目、工作项、收件箱、审计日志等基础 CRUD
- 甘特图 / 时间线相关 UI 资产
- 部分项目页、Dashboard 页、Search 页、Settings 页
- 本地优先的数据持久化能力

这些资产说明：

- 技术底座不是从 0 开始
- 时间线、列表、编辑、数据库、审计这些基础能力可以继续复用

---

## 与当前目标的主要偏差

### 1. 产品中心偏了

当前主导航和文档中心仍偏向：

- Dashboard
- Portfolio
- Inbox
- My Work
- Search
- Settings

但最新确认的产品中心应该是：

- 项目画布
- 干系人
- 时间规划表
- 风险登记册
- 工作包
- 资料/证据

### 2. 数据模型偏了

当前 schema 主要是一套：

- `portfolios`
- `projects`
- `work_items`
- `inbox_items`
- `todos`
- `pomodoro_sessions`

但新的目标需要逐步转向：

- `project_canvas`
- `stakeholders`
- `timeline_items`
- `risk_register_items`
- `work_packages`
- `evidence`
- 后续再扩展 `fact_assertions` / `change_proposals`

### 3. My Work 占比过重

`My Work`、`Todo`、`Pomodoro` 在代码和文档中占据很大比重，但它们不再是当前产品主线。

### 4. 组合治理叙事过重

大量文档仍把 Portfolio / PMO / 多项目治理作为核心叙事，这会误导未来设计和开发方向。

### 5. 已出现半切换状态

代码里已经出现 project canvas 相关 import：

- `src/main/ipc/handlers.ts`

但对应的 shared/service 文件缺失，说明方向切换没有完整落地，当前状态存在断层。

---

## 当前应如何理解这些旧实现

这些不是废代码，但也不是当前产品定义。

可以把它们分成三类：

### 可保留复用

- 桌面壳层
- 本地数据库
- IPC 基础设施
- 审计日志
- 时间线/Gantt 的部分交互和渲染能力
- 现有列表、表格、抽屉、编辑交互能力

### 可降级为辅助模块

- Inbox
- Search
- Dashboard

### 不应继续作为中心扩展

- My Work
- Pomodoro
- 通用 Todo 中心
- Portfolio-first 叙事

---

## 当前最真实的产品状态

如果按今天的共识来描述项目，应该是：

- **底层基础设施已有一定完成度**
- **上层产品定义需要重构和收敛**
- **关键领域模型尚未建立为一等对象**
- **文档历史包袱较重，已经开始清理**

---

## 当前建议的下一步

1. 以 PM Workspace 重新定义信息架构
2. 先补齐核心对象的数据模型
3. 以项目工作台重构主页面结构
4. 将旧方向文档标记为历史或弱化
5. 再决定哪些旧页面保留、哪些下沉、哪些废弃
