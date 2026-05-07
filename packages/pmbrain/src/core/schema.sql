PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  page_type TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT,
  summary TEXT,
  canonical_path TEXT,
  source_kind TEXT,
  checksum TEXT,
  tags TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT
);

CREATE TABLE IF NOT EXISTS content_chunks (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  section TEXT,
  content TEXT NOT NULL,
  embedding_model TEXT,
  embedding BLOB,
  token_count INTEGER,
  created_at TEXT NOT NULL,
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
  UNIQUE(page_id, chunk_index)
);

CREATE VIRTUAL TABLE IF NOT EXISTS content_chunks_fts USING fts5(
  page_id UNINDEXED,
  section,
  content,
  tokenize = 'unicode61'
);

CREATE TABLE IF NOT EXISTS links (
  id TEXT PRIMARY KEY,
  src_page_id TEXT NOT NULL,
  dst_page_id TEXT,
  dst_slug TEXT,
  link_type TEXT NOT NULL,
  anchor_text TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (src_page_id) REFERENCES pages(id) ON DELETE CASCADE,
  FOREIGN KEY (dst_page_id) REFERENCES pages(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  color TEXT
);

CREATE TABLE IF NOT EXISTS page_tags (
  page_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (page_id, tag_id),
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS timeline_entries (
  id TEXT PRIMARY KEY,
  page_id TEXT,
  entity_type TEXT,
  entity_id TEXT,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_at TEXT NOT NULL,
  source_kind TEXT,
  source_id TEXT,
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS page_versions (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL,
  version_num INTEGER NOT NULL,
  title TEXT NOT NULL,
  body_md TEXT NOT NULL,
  frontmatter_json TEXT,
  change_source TEXT,
  change_summary TEXT,
  author TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
  UNIQUE(page_id, version_num)
);

CREATE TABLE IF NOT EXISTS raw_data (
  id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL,
  source_uri TEXT,
  external_id TEXT,
  mime_type TEXT,
  payload_text TEXT,
  metadata_json TEXT,
  checksum TEXT NOT NULL,
  captured_at TEXT NOT NULL,
  UNIQUE(source_type, checksum)
);

CREATE TABLE IF NOT EXISTS ingest_log (
  id TEXT PRIMARY KEY,
  job_type TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_ref TEXT,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  items_seen INTEGER NOT NULL DEFAULT 0,
  items_created INTEGER NOT NULL DEFAULT 0,
  items_updated INTEGER NOT NULL DEFAULT 0,
  items_skipped INTEGER NOT NULL DEFAULT 0,
  error_text TEXT,
  details_json TEXT
);

CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  page_id TEXT,
  raw_data_id TEXT,
  path TEXT,
  vault_path TEXT,
  sha256 TEXT NOT NULL UNIQUE,
  mime_type TEXT,
  size_bytes INTEGER,
  created_at TEXT NOT NULL,
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE SET NULL,
  FOREIGN KEY (raw_data_id) REFERENCES raw_data(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS vault_sync_state (
  page_id TEXT PRIMARY KEY,
  vault_path TEXT NOT NULL,
  last_sqlite_version_id TEXT,
  last_vault_hash TEXT,
  last_synced_at TEXT,
  sync_status TEXT NOT NULL,
  conflict_note TEXT,
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  owner TEXT,
  sponsor TEXT,
  status TEXT NOT NULL,
  priority TEXT,
  health TEXT,
  objective TEXT,
  start_date TEXT,
  target_date TEXT,
  end_date TEXT,
  progress_pct REAL NOT NULL DEFAULT 0,
  budget_baseline REAL,         -- Total approved budget in project currency
  cost_actual REAL,             -- Actual cost to date
  program_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  program_role TEXT NOT NULL DEFAULT 'standalone', -- 'program' / 'component' / 'standalone'
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (id) REFERENCES pages(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS risks (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  page_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT,
  status TEXT NOT NULL,
  probability INTEGER NOT NULL,
  impact INTEGER NOT NULL,
  mitigation TEXT,
  contingency TEXT,
  owner TEXT,
  identified_at TEXT,
  due_date TEXT,
  closed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
);

-- Core PM objects: stakeholders
-- Core PM objects: stakeholders (可跨项目复用)
CREATE TABLE IF NOT EXISTS stakeholders (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  title TEXT,               -- 职位头衔
  organization TEXT,
  influence TEXT,           -- high/medium/low
  interest TEXT,            -- high/medium/low
  engagement_level TEXT,    -- unaware/resistant/supportive/leading
  engagement_strategy TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
);

-- ============================================
-- FTS5 全文搜索虚拟表
-- ============================================
CREATE VIRTUAL TABLE IF NOT EXISTS pmbrain_fts USING fts5(
  entity_id,
  entity_type,  -- project, risk, work_item, stakeholder, organization, process
  title,
  content,
  tags,
  tokenize = 'unicode61'
);

-- FTS 索引更新触发器: pages
CREATE TRIGGER IF NOT EXISTS pages_ai AFTER INSERT ON pages BEGIN
  INSERT INTO pmbrain_fts(entity_id, entity_type, title, content, tags)
  VALUES (new.id, new.page_type, new.title, new.summary, new.tags);
END;

CREATE TRIGGER IF NOT EXISTS pages_ad AFTER DELETE ON pages BEGIN
  DELETE FROM pmbrain_fts WHERE entity_id = old.id;
END;

CREATE TRIGGER IF NOT EXISTS pages_au AFTER UPDATE ON pages BEGIN
  UPDATE pmbrain_fts SET title = new.title, content = new.summary, tags = new.tags
  WHERE entity_id = new.id;
END;

-- 索引已存在的数据（首次创建 FTS 表时需要）
INSERT OR IGNORE INTO pmbrain_fts(entity_id, entity_type, title, content, tags)
SELECT id, page_type, title, summary, tags FROM pages;

-- 项目-干系人 关联表 (支持一个干系人参与多个项目，每个项目中有不同角色)
CREATE TABLE IF NOT EXISTS project_stakeholders (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  stakeholder_id TEXT NOT NULL,
  role TEXT NOT NULL,       -- 该项目中的角色: 项目经理/产品经理/开发/测试/客户等
  responsibility TEXT,      -- 职责描述
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (stakeholder_id) REFERENCES stakeholders(id) ON DELETE CASCADE,
  UNIQUE(project_id, stakeholder_id)
);

-- Core PM objects: work_items (工作项: 问题/缺陷/需求/行动项)
CREATE TABLE IF NOT EXISTS work_items (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  page_id TEXT NOT NULL,
  code TEXT UNIQUE,         -- 工作项编号: ISSUE-001, DEFECT-001
  title TEXT NOT NULL,
  description TEXT,
  item_type TEXT NOT NULL,  -- issue/defect/requirement/action_item
  status TEXT NOT NULL,     -- new/analysis/in_progress/done/cancelled/on_hold
  priority TEXT,            -- critical/high/medium/low
  severity TEXT,            -- blocker/critical/major/minor
  owner TEXT,               -- 负责人 stakeholder_id
  reporter TEXT,            -- 报告人 stakeholder_id
  parent_id TEXT,           -- 父工作项 (支持层级)
  due_date TEXT,
  resolved_at TEXT,
  resolution TEXT,          -- 解决方式: fixed/wontfix/duplicate/by_design
  tags TEXT,                -- 逗号分隔的标签
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES work_items(id) ON DELETE SET NULL
);

-- Core PM objects: work packages
CREATE TABLE IF NOT EXISTS work_packages (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  page_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  responsible TEXT,       -- stakeholder id reference
  start_date TEXT,
  end_date TEXT,
  status TEXT NOT NULL,   -- pending/in_progress/done/cancelled
  progress_pct REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
);

-- Core PM objects: evidence
CREATE TABLE IF NOT EXISTS evidence (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  entity_type TEXT,       -- project/risk/stakeholder/work_package
  entity_id TEXT,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL, -- meeting_note/email/im/document
  source_uri TEXT,
  captured_at TEXT NOT NULL,
  content_text TEXT,
  file_path TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Core PM objects: processes (流程规范管理)
CREATE TABLE IF NOT EXISTS processes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  page_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  scope TEXT,            -- which phase/activity this process covers
  owner TEXT,            -- process owner (stakeholder)
  status TEXT NOT NULL,  -- draft/active/retired
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
);

-- Core PM objects: organizations (组织架构管理)
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  parent_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  level INTEGER NOT NULL DEFAULT 1,  -- 1=top level, 2=department, 3=team etc.
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (parent_id) REFERENCES organizations(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_pages_type ON pages(page_type);
CREATE INDEX IF NOT EXISTS idx_pages_updated ON pages(updated_at);
CREATE INDEX IF NOT EXISTS idx_links_src ON links(src_page_id);
CREATE INDEX IF NOT EXISTS idx_links_dst ON links(dst_page_id);
CREATE INDEX IF NOT EXISTS idx_timeline_event_at ON timeline_entries(event_at);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_risks_project ON risks(project_id);
CREATE INDEX IF NOT EXISTS idx_risks_status ON risks(status);
CREATE INDEX IF NOT EXISTS idx_stakeholders_name ON stakeholders(name);
CREATE INDEX IF NOT EXISTS idx_project_stakeholders_project ON project_stakeholders(project_id);
CREATE INDEX IF NOT EXISTS idx_project_stakeholders_stakeholder ON project_stakeholders(stakeholder_id);
CREATE INDEX IF NOT EXISTS idx_work_items_project ON work_items(project_id);
CREATE INDEX IF NOT EXISTS idx_work_items_type ON work_items(item_type);
CREATE INDEX IF NOT EXISTS idx_work_items_status ON work_items(status);
CREATE INDEX IF NOT EXISTS idx_work_items_priority ON work_items(priority);
CREATE INDEX IF NOT EXISTS idx_work_items_code ON work_items(code);
CREATE INDEX IF NOT EXISTS idx_work_packages_project ON work_packages(project_id);
CREATE INDEX IF NOT EXISTS idx_work_packages_status ON work_packages(status);
CREATE INDEX IF NOT EXISTS idx_evidence_project ON evidence(project_id);
CREATE INDEX IF NOT EXISTS idx_processes_project ON processes(project_id);
CREATE INDEX IF NOT EXISTS idx_processes_status ON processes(status);
CREATE INDEX IF NOT EXISTS idx_organizations_parent ON organizations(parent_id);
