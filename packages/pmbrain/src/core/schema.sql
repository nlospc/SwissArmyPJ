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
CREATE TABLE IF NOT EXISTS stakeholders (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  page_id TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT,
  organization TEXT,
  contact TEXT,
  influence TEXT,          -- high/medium/low
  interest TEXT,          -- high/medium/low
  engagement_strategy TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
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
CREATE INDEX IF NOT EXISTS idx_stakeholders_project ON stakeholders(project_id);
CREATE INDEX IF NOT EXISTS idx_work_packages_project ON work_packages(project_id);
CREATE INDEX IF NOT EXISTS idx_work_packages_status ON work_packages(status);
CREATE INDEX IF NOT EXISTS idx_evidence_project ON evidence(project_id);
CREATE INDEX IF NOT EXISTS idx_processes_project ON processes(project_id);
CREATE INDEX IF NOT EXISTS idx_processes_status ON processes(status);
CREATE INDEX IF NOT EXISTS idx_organizations_parent ON organizations(parent_id);
