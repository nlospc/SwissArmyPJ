# PMBrain - 项目管理大脑

PMBrain 是一个本地优先的项目管理大脑系统，通过 SQLite 存储结构化数据，支持 MCP 协议连接 AI 助手，并可与 Obsidian 双向同步。

## 核心架构

PMBrain 围绕四层构建：
- **SQLite** - 结构化记录、溯源、同步状态和搜索元数据的唯一真相源
- **Obsidian Vault** - 人类可读的投影层
- **MCP** - Agent 访问层（支持 Codex、Claude Code、Hermes 等）
- **CLI** - 本地操作界面（设置、导入、同步和 PM 工作流）

## 快速开始

```bash
# 安装依赖
bun install

# 初始化数据库
bun run src/cli.ts setup

# 检查健康状态
bun run src/cli.ts doctor

# 查看所有命令帮助
bun run src/cli.ts help
```

---

## CLI 命令参考

### 基础命令

| 命令 | 描述 | 示例 |
|------|------|------|
| `help` | 显示帮助信息 | `bun run src/cli.ts help` |
| `setup` | 准备本地数据库和配置目录 | `bun run src/cli.ts setup` |
| `doctor` | 诊断并报告健康状态 | `bun run src/cli.ts doctor` |
| `stats` | 显示数据库统计信息 | `bun run src/cli.ts stats` |
| `serve` | 启动 MCP 服务器（stdio） | `bun run src/cli.ts serve` |

### 项目管理

#### `project-init` - 创建新项目
```bash
bun run src/cli.ts project-init <CODE> <NAME> [OPTIONS]

# 必需参数
- CODE: 项目代码（唯一标识符）
- NAME: 项目名称

# 可选参数
--owner <name>          项目负责人
--status <status>       初始状态 (planning/active/completed/on_hold)
--budget <amount>       预算基线
--program-id <id>       所属项目集 ID
--program-role <role>   项目集角色 (program/component/standalone)
--description <desc>    项目描述

# 示例
bun run src/cli.ts project-init PROJ001 "ERP 系统升级" --owner "张三" --status active
bun run src/cli.ts project-init DV "数统项目集" --program-role program
```

#### `project-update` - 更新项目信息
```bash
bun run src/cli.ts project-update <CODE_OR_ID> [OPTIONS]

# 可选参数
--code <new_code>       新项目代码
--name <new_name>       新项目名称
--owner <new_owner>     新负责人
--status <new_status>   新状态
--budget <new_budget>   新预算
--program-id <id>       新所属项目集
--program-role <role>   新项目集角色
--progress <pct>        进度百分比 (0-100)
--description <desc>    新描述

# 示例
bun run src/cli.ts project-update PROJ001 --status completed --progress 100
```

#### `project-delete` - 删除项目
```bash
bun run src/cli.ts project-delete <CODE_OR_ID>

# 示例
bun run src/cli.ts project-delete PROJ001
```

#### 子命令
- `project-list` - 列出所有项目
- `get-project <CODE>` - 获取项目详情（含子项目）

### 风险管理

#### `risk-init` - 创建风险
```bash
bun run src/cli.ts risk-init [OPTIONS]

# 必需参数
--title <title>         风险标题
--probability <1-5>     概率评分 (1最低，5最高)
--impact <1-5>          影响评分 (1最低，5最高)

# 可选参数
--project-id <id>       关联项目 ID
--category <cat>        风险类别 (technical/schedule/resource/external)
--status <status>       状态 (open/mitigated/transferred/accepted/closed)
--mitigation <strategy> 缓解策略
--contingency <plan>    应急预案
--owner <person>        风险负责人
--due-date <ISO>        目标解决日期

# 示例
bun run src/cli.ts risk-init --title "关键人员流失风险" --probability 3 --impact 5 --project-id proj_xxx
```

#### `risk-update` - 更新风险
```bash
bun run src/cli.ts risk-update <RISK_ID> [OPTIONS]

# 可选参数（同上 risk-init）
```

#### `risk-close` - 关闭风险
```bash
bun run src/cli.ts risk-close <RISK_ID> [--closure-notes <notes>]
```

#### `list-risks` - 列出风险
```bash
bun run src/cli.ts list-risks [OPTIONS]

--project-id <id>       按项目筛选
--status <status>       按状态筛选
```

#### `risk-matrix` - 获取风险矩阵
```bash
bun run src/cli.ts risk-matrix [--project-code <CODE>]
```

### 干系人管理

#### `stakeholder-init` - 创建干系人
```bash
bun run src/cli.ts stakeholder-init <NAME> [OPTIONS]

# 可选参数
--email <email>         邮箱
--phone <phone>         电话
--title <title>         职位
--organization <org>    组织
--influence <level>     影响力 (high/medium/low)
--interest <level>      利益相关度 (high/medium/low)
--engagement-level <l>  参与度
--notes <notes>         备注
--project-id <id>       关联项目
--project-role <role>   项目角色

# 示例
bun run src/cli.ts stakeholder-init "张三" --title "产品总监" --organization "产品部" --influence high
```

#### `list-stakeholders` - 列出干系人
```bash
bun run src/cli.ts list-stakeholders [--project-id <id>]
```

### 工作项管理

#### `work-item-init` - 创建工作项
```bash
bun run src/cli.ts work-item-init [OPTIONS]

# 必需参数
--project-id <id>       所属项目
--title <title>         工作项标题

# 可选参数
--description <desc>    详细描述
--item-type <type>      类型 (issue/defect/feature/action)
--status <status>       状态 (new/in_progress/done/blocked)
--priority <priority>   优先级 (critical/high/medium/low)
--severity <severity>   严重程度
--owner <person>        负责人
--reporter <person>     报告人
--due-date <ISO>        截止日期
--tags <tags>           标签（逗号分隔）

# 示例
bun run src/cli.ts work-item-init --project-id proj_xxx --title "修复登录 bug" --item-type defect --priority critical
```

#### `work-item-list` - 列出工作项
```bash
bun run src/cli.ts work-item-list [OPTIONS]

--project-id <id>       按项目筛选
--item-type <type>      按类型筛选
--status <status>       按状态筛选
```

#### `update-work-item` - 更新工作项
```bash
bun run src/cli.ts update-work-item <WORK_ITEM_ID> [OPTIONS]

# 可选参数（同上 work-item-init）
--resolution <notes>    解决方案/备注
```

### 工作包管理

#### `work-package-init` - 创建工作包
```bash
bun run src/cli.ts work-package-init [OPTIONS]

# 必需参数
--project-id <id>       所属项目
--name <name>           工作包名称

# 可选参数
--desc <description>    描述
--responsible <person>  负责人
--start-date <ISO>      开始日期
--end-date <ISO>        结束日期
--status <status>       状态 (not_started/in_progress/paused/completed)
--progress <pct>        进度百分比 (0-100)

# 示例
bun run src/cli.ts work-package-init --project-id proj_xxx --name "需求分析与设计" --desc "完成用户需求分析和系统设计" --status in_progress --progress 50
```

#### `work-package-list` - 列出工作包
```bash
bun run src/cli.ts work-package-list [--project-id <id>]
```

### 流程规范管理

#### `process-init` - 创建流程规范
```bash
bun run src/cli.ts process-init [OPTIONS]

# 必需参数
--name <name>           流程名称
--code <code>           流程代码

# 可选参数
--project-id <id>       关联项目
--category <cat>        类别
--version <version>     版本号 (default: 1.0)
--owner <person>        负责人
--doc-uri <uri>         文档 URI
--status <status>       状态 (draft/active/deprecated)

# 示例
bun run src/cli.ts process-init --name "需求评审流程" --code "REQ-REV" --category "需求管理"
```

#### `process-list` - 列出流程规范
```bash
bun run src/cli.ts process-list [--project-id <id>]
```

### 组织架构管理

#### `organization-init` - 创建组织单元
```bash
bun run src/cli.ts organization-init [OPTIONS]

# 必需参数
--name <name>           组织名称
--code <code>           组织代码

# 可选参数
--desc <description>    描述
--level <level>         层级 (default: 1)
--parent-id <id>        父组织 ID

# 示例
bun run src/cli.ts organization-init --name "质量保障部" --code "QA" --desc "负责质量保证和测试" --level 2 --parent-id org_xxx
```

#### `organization-list` - 列出组织架构
```bash
bun run src/cli.ts organization-list
```

### 证据/溯源管理

#### `evidence-add` - 添加证据记录
```bash
bun run src/cli.ts evidence-add [OPTIONS]

# 必需参数
--title <title>         证据标题
--source-type <type>    来源类型 (meeting_note/email/doc/voice_memo/chat/artifact)

# 可选参数
--project-id <id>       关联项目
--content <text>        内容文本
--entity-type <type>    关联实体类型 (project/risk/stakeholder/work_item)
--entity-id <id>        关联实体 ID
--source-uri <uri>      来源 URI
--captured-at <ISO>     捕获时间
--file-path <path>      文件路径
--metadata <json>       元数据（JSON 字符串）

# 示例
bun run src/cli.ts evidence-add --title "项目启动会议纪要" --source-type meeting_note --content "讨论了项目范围、时间表和关键干系人"
```

#### `evidence-list` - 列出证据
```bash
bun run src/cli.ts evidence-list [--project-id <id>]
```

### 搜索命令

#### `search-all` - 全文搜索（跨所有实体）
```bash
bun run src/cli.ts search-all <QUERY> [--limit <N>]

# 示例
bun run src/cli.ts search-all "风险" --limit 10
```

#### `search-by-type` - 按类型搜索
```bash
bun run src/cli.ts search-by-type <QUERY> <ENTITY_TYPE> [--limit <N>]

# entity_type: project/risk/work_item/stakeholder/organization/process/evidence

# 示例
bun run src/cli.ts search-by-type "登录 bug" work_item
```

### Vault 同步

#### `vault-sync` - 同步到 Obsidian Vault
```bash
bun run src/cli.ts vault-sync [OPTIONS]

--dry-run              预览将要同步的内容
--force                强制覆盖所有文件
--page-id <id>         同步指定页面
--since <ISO>          仅同步指定时间后的变更
```

---

## MCP 工具列表

通过 MCP 协议，AI 助手可以调用以下工具：

### 项目工具
| 工具名 | 描述 |
|--------|------|
| `list_projects_stats` | 获取所有项目的统计信息 |
| `list_projects` | 列出所有项目（可按状态筛选） |
| `get_project` | 获取项目详情（含子项目列表） |
| `create_project` | 创建新项目 |
| `update_project` | 更新项目信息 |
| `delete_project` | 删除项目 |

### 风险工具
| 工具名 | 描述 |
|--------|------|
| `get_risk_matrix` | 获取风险矩阵（概率 vs 影响） |
| `create_risk` | 创建新风险 |
| `update_risk` | 更新风险信息 |
| `close_risk` | 关闭风险 |
| `list_risks` | 列出风险（按分数排序） |

### 干系人工具
| 工具名 | 描述 |
|--------|------|
| `create_stakeholder` | 创建新干系人 |
| `list_stakeholders` | 列出干系人 |

### 工作项工具
| 工具名 | 描述 |
|--------|------|
| `create_work_item` | 创建工作项 |
| `update_work_item` | 更新工作项 |
| `list_work_items` | 列出工作项 |

### 搜索工具
| 工具名 | 描述 |
|--------|------|
| `search_all` | 全文搜索（跨所有实体，BM25 排序） |
| `search_by_type` | 按实体类型搜索 |

---

## 数据结构

### 核心实体

#### Project (项目)
```sql
projects (
  id, code, name, owner, status, priority, health,
  progress_pct, budget_baseline,
  program_id, program_role,  -- 项目集管理
  created_at, updated_at
)
```

#### Risk (风险)
```sql
risks (
  id, project_id, title, category, status,
  probability, impact, score,  -- score = probability * impact
  mitigation, contingency, owner, due_date,
  closure_notes, closed_at,
  created_at, updated_at
)
```

#### Stakeholder (干系人)
```sql
stakeholders (
  id, name, email, phone, title, organization,
  influence, interest, engagement_level, notes,
  created_at, updated_at
)
```

#### WorkItem (工作项)
```sql
work_items (
  id, project_id, title, description,
  item_type, status, priority, severity,
  owner, reporter, due_date, tags, resolution,
  created_at, updated_at, closed_at
)
```

#### WorkPackage (工作包)
```sql
work_packages (
  id, project_id, name, description,
  responsible, start_date, end_date,
  status, progress_pct,
  created_at, updated_at
)
```

#### Process (流程规范)
```sql
processes (
  id, project_id, name, code, description,
  category, version, owner, doc_uri, status,
  created_at, updated_at
)
```

#### Organization (组织单元)
```sql
organizations (
  id, parent_id, name, code, description,
  level, created_at, updated_at
)
```

#### Evidence (证据)
```sql
evidence (
  id, project_id,
  entity_type, entity_id,  -- 关联实体
  title, source_type, source_uri,
  captured_at, content_text,
  file_path, metadata_json,
  created_at
)
```

### 元数据表

#### Pages (页面索引)
```sql
pages (
  id, page_type, title, slug, status, summary,
  canonical_path, source_kind, checksum,
  created_at, updated_at, archived_at
)
```

#### Vault Sync State (同步状态)
```sql
vault_sync_state (
  page_id, vault_path, last_sync_hash,
  last_synced_at, needs_sync, sync_attempts,
  last_error, last_error_at
)
```

---

## 开发指南

### 项目结构
```
packages/pmbrain/
├── src/
│   ├── cli.ts              # CLI 入口
│   ├── commands/           # 命令处理器
│   │   ├── setup.ts
│   │   ├── doctor.ts
│   │   ├── stats.ts
│   │   ├── serve.ts        # MCP 服务器
│   │   ├── vault-sync.ts   # Vault 同步
│   │   ├── project-init.ts
│   │   ├── project-delete.ts
│   │   ├── project-update.ts
│   │   ├── risk-init.ts
│   │   ├── risk-update.ts
│   │   ├── risk-close.ts
│   │   ├── list-risks.ts
│   │   ├── stakeholder-init.ts
│   │   ├── stakeholder-list.ts
│   │   ├── work-item-init.ts
│   │   ├── work-item-list.ts
│   │   ├── update-work-item.ts
│   │   ├── work-package-init.ts
│   │   ├── work-package-list.ts
│   │   ├── process-init.ts
│   │   ├── process-list.ts
│   │   ├── organization-init.ts
│   │   ├── organization-list.ts
│   │   ├── evidence-add.ts
│   │   └── evidence-list.ts
│   └── core/
│       ├── schema.sql      # 数据库架构
│       ├── db.ts           # 数据库操作
│       ├── types.ts        # TypeScript 类型
│       └── config.ts       # 配置管理
├── docs/
│   └── architecture.md     # 架构文档
├── package.json
└── README.md
```

### 开发命令
```bash
# 开发模式运行
bun run dev -- <command>

# 生产模式运行
bun run src/cli.ts <command>

# 启动 MCP 服务器
bun run src/cli.ts serve
```

### 添加新命令

1. 在 `src/commands/` 创建新文件
2. 导出 `run<CommandName>(args: string[]): Promise<void>`
3. 在 `src/cli.ts` 导入并注册
4. 在 `src/core/db.ts` 添加数据库操作函数
5. 在 `src/core/types.ts` 添加类型定义
6. （可选）在 `src/commands/serve.ts` 添加 MCP 工具

### 数据库迁移

修改 `src/core/schema.sql` 后，运行：
```bash
bun run src/cli.ts setup --force
```

---

## 最佳实践

### 项目编码规范
- 项目代码：`PROJ001`, `DV002` 等 4-6 位字母数字组合
- 组织代码：`QA`, `DEV`, `PM` 等 2-4 位大写字母
- 流程代码：`REQ-REV`, `RISK-MGT` 等带连字符的 slug

### 风险评分
- 概率/影响：1-5 分，5 为最高
- 风险分数 = 概率 × 影响 (范围 1-25)
- 高风险：15-25，中风险：8-14，低风险：1-7

### 工作流程
1. **启动项目**: `project-init` → 创建项目
2. **识别干系人**: `stakeholder-init` → 关联项目
3. **风险评估**: `risk-init` → 制定缓解策略
4. **工作分解**: `work-package-init` → 分解为工作包
5. **任务分配**: `work-item-init` → 创建具体任务
6. **进度跟踪**: `update-work-item`, `project-update` → 定期更新
7. **知识沉淀**: `evidence-add` → 留存关键证据

---

## 相关链接

- [架构文档]( ./docs/architecture.md)
- [SQLite Schema](./src/core/schema.sql)
- [Monorepo 根目录](../../README.md)
