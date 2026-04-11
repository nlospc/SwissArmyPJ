# SwissArmyPM

面向**项目经理**的桌面工作台。

当前明确方向：先做一个可独立使用的 PM Workspace，让项目经理能快速维护和查看项目关键事实，而不是继续扩展成组合治理平台或个人效率工具。

## 当前产品中心

- 项目画布
- 干系人
- 时间规划表
- 风险登记册
- 工作包
- 资料/证据

## 当前原则

- **项目经理唯一核心用户**
- **桌面独立可用**，不依赖外部系统才能成立
- **手工 CRUD 优先**，AI/Agent 先做建议，不先做自动改写
- **证据可追溯**，未来回答关键问题时要能给来源

## 仓库现状提醒

仓库里仍有大量旧方向内容，包括：

- Portfolio Dashboard
- Inbox
- My Work / Pomodoro
- 通用 work item / todo 结构

这些是历史实现资产，不再代表当前产品定义。

## 关键文档

- `CLAUDE.md`：当前最高优先级工作说明
- `docs/MEMORY.md`：已确认产品事实与废弃假设
- `docs/PRD/PRD-001-Master.md`：新的主 PRD
- `docs/overview.md`：面向项目本身的概览

## 开发

```bash
npm install
npm run dev
```

## 备注

如果文档之间有冲突，以 `CLAUDE.md` 为准。
