# PRD-106 — Evidence

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-106 |
| **Status** | Draft |
| **Module** | Evidence |
| **Parent** | `docs/PRD/PRD-001-Master.md` |
| **Last Updated** | 2026-04-11 |

---

## 1. 模块目标

Evidence 模块用于沉淀能够支撑项目判断的原始材料或摘录。

它不是附件仓库，而是：

- 项目事实的来源层
- 问答返回“答案 + 来源”的基础层
- 候选事实抽取与建议更新的输入层

---

## 2. 模块边界

### 本模块负责

- 录入与归档项目相关证据
- 保存证据元数据
- 为结构化对象提供来源挂接基础
- 为后续抽取、比对、建议更新提供输入

### 本模块不负责

- 直接替代结构化事实
- 绕过 PM 直接更新核心对象
- 充当泛个人知识大脑

---

## 3. 核心字段

- `title`
- `type`
- `source_label`
- `source_uri`
- `captured_at`
- `author`
- `content`
- `summary`
- `content_hash`
- `ingest_status`

---

## 4. P0 / P1 / P2

### P0

- 支持手动录入证据
- 支持粘贴会议纪要、邮件、IM 片段、文档摘录
- 支持按项目归档和查看
- 支持 type、source、captured_at、author、summary 等基础元数据
- 为内容哈希去重预留设计

### P1

- 支持文件导入与批量导入
- 支持来源链接和导入日志
- 支持结构化对象手动挂接来源

### P2

- 支持证据切块
- 支持候选事实抽取
- 支持来源回溯视图
- 支持基于证据生成 Change Proposal

---

## 5. 与其他模块关系

- 与 `Project Canvas`：可提供摘要生成与来源挂接
- 与 `Stakeholders`：可提供诉求、顾虑、关系变化来源
- 与 `Timeline`：可提供日期承诺与变更来源
- 与 `Risks`：可提供风险信号来源
- 与 `Work Packages`：可提供行动项、阻塞、owner 变化来源

---

## 6. 设计约束

- 必须坚持“证据先沉淀，再参与建议更新”
- 证据不足时允许回答“不确定”
- 任何基于证据的结构化更新都需要 PM 最终确认
- 内容导入应逐步具备去重、幂等、可审计能力
