import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const WELCOME_BOARD = `# PMBrain Welcome Board

PMBrain now uses this Obsidian vault as the human-readable project workspace.
SQLite remains the source of truth; this vault is the editable projection layer
for notes, project canvases, timelines, decisions, risks, evidence, and reviews.

## Start Here

- Open this folder as an Obsidian vault: \`packages/vault\`.
- Run \`npm run dev:pmbrain -- setup\` from the repo root to initialize PMBrain.
- Run \`npm run dev:pmbrain -- vault-sync export\` to generate project, work item, and risk notes.
- Run \`npm run dev:pmbrain -- vault-sync check\` before importing Obsidian edits.
- Run \`npm run dev:pmbrain -- vault-sync import\` only after check reports a clean vault.
- Run \`npm run dev:pmbrain -- vault-sync reconcile\` for a read-only repair preview; repair flags are reserved for later.
- Do not use the old Notion MVP workspace as a PMBrain connector. It is deprecated for this project.

## Recommended Plugins

- Dataview: query project records and build dashboards from frontmatter.
- Tasks: manage action items and due dates in Markdown.
- Kanban: maintain project boards from Markdown files.
- Chinese Calendar: Chinese lunar calendar, public holidays, adjusted workdays, and date navigation for the main user group.
- Templater: create repeatable project, meeting, and risk note templates.
- Metadata Menu: edit frontmatter fields with a structured UI.
- QuickAdd: capture new work items and evidence quickly.
- Advanced Tables: edit Markdown tables safely.
- Obsidian Git: optional later; not enabled in this fresh package.

Optional calendar plugins:

- Use Obsidian core Daily Notes first for PMBrain daily reports.
- If plugin search cannot find Calendar or Periodic Notes, skip them for now.
- Later alternatives to evaluate: Daily Note Calendar, Full Calendar, or Periodic Notes Calendar.

## Recommended Settings

- Files and Links: use Markdown links and keep new attachments under \`90_Attachments\`.
- Community plugins: disable Restricted Mode only after reviewing the plugins above.
- Core plugins: enable Daily Notes.
- Daily notes folder: \`00_Inbox/Daily\`.
- Template folder: \`99_Templates\`.
- Default new note location: \`00_Inbox\`.
- Chinese Calendar: keep QuickAdd integration disabled until PMBrain capture choices are defined.
- Obsidian Sync: disabled by default; PMBrain is local-first.

## Workspace Map

- \`00_Inbox\`: raw capture, daily reports, unsorted notes.
- \`10_Projects\`: project pages and project canvases.
- \`20_Timeline\`: milestones, status events, and timeline notes.
- \`30_WorkItems\`: actions, issues, decisions, and follow-ups.
- \`40_Risks\`: risks, assumptions, blockers, and mitigations.
- \`50_Stakeholders\`: people, organizations, and communication context.
- \`60_Evidence\`: meeting notes, source references, files, and audit evidence.
- \`90_Attachments\`: linked files and exports.
- \`99_Templates\`: Markdown templates used by PMBrain and Obsidian.

## Sync Safety Rules

- Generated folders: \`10_Projects\`, \`30_WorkItems\`, and \`40_Risks\`.
- Manually maintained or reserved folders: \`00_Inbox\`, \`20_Timeline\`, \`50_Stakeholders\`, \`60_Evidence\`, \`90_Attachments\`, and \`99_Templates\`.
- You may edit approved frontmatter fields and the \`Editable Notes\` section in generated notes.
- Do not manually edit \`pmbrain_type\`, \`pmbrain_id\`, \`sqlite_version_id\`, \`content_hash\`, or \`last_synced_at\`.
- Notes with changed IDs, invalid folders, duplicate IDs, malformed dates, or missing required frontmatter are rejected by \`vault-sync check\`.
`

const README = `# PMBrain Obsidian Vault

This vault replaces the temporary Notion MVP connector. PMBrain should be
maintained locally through SQLite plus Markdown projection, with Obsidian as the
human-facing editing and review workspace.

## Required Obsidian Setup

1. Open this directory in Obsidian.
2. Review \`Welcome Board.md\`.
3. Install the recommended community plugins listed there.
4. Keep PMBrain IDs in YAML frontmatter when syncing generated notes.

## Sync Contract

- PMBrain SQLite is the source of truth.
- Obsidian Markdown is the editable projection layer.
- Generated record notes require frontmatter fields: \`pmbrain_type\`,
  \`pmbrain_id\`, \`sync_status\`, \`last_synced_at\`,
  \`sqlite_version_id\`, and \`content_hash\`.
- See \`packages/pmbrain/docs/vault-sync-contract.md\` for the exact table,
  folder, editable-field, and read-only-field contract.
- Notion pages/databases created during the MVP experiment are deprecated and
  should not be used as PMBrain connectors.
- Agent sync should read/write this vault and PMBrain SQLite, then record data
  changes in PMBrain ingest/audit tables.
`

const TEMPLATE_PROJECT = `---
pmbrain_type: project
pmbrain_id:
status: draft
owner:
last_synced_at:
---

# {{title}}

## Objective

## Scope

## Timeline

## Risks

## Evidence
`

const TEMPLATE_DAILY = `---
pmbrain_type: daily_report
date:
last_synced_at:
---

# Daily Report

## Progress

## Risks / Blockers

## Next Actions
`

const TEMPLATE_WORK_ITEM = `---
pmbrain_type: work_item
pmbrain_id:
project_id:
status: todo
priority: medium
due:
last_synced_at:
---

# {{title}}

## Context

## Acceptance

## Evidence
`

function writeIfMissing(path: string, content: string): boolean {
  if (existsSync(path)) {
    return false
  }

  writeFileSync(path, content, 'utf8')
  return true
}

export function ensureVaultSkeleton(vaultPath: string): string[] {
  const dirs = [
    '.obsidian',
    '.obsidian/plugins',
    '.obsidian/plugins/chinese-calendar',
    '.obsidian/plugins/dataview',
    '.obsidian/plugins/metadata-menu',
    '.obsidian/plugins/obsidian-kanban',
    '.obsidian/plugins/obsidian-tasks-plugin',
    '.obsidian/plugins/quickadd',
    '.obsidian/plugins/table-editor-obsidian',
    '.obsidian/plugins/templater-obsidian',
    '00_Inbox',
    '00_Inbox/Daily',
    '10_Projects',
    '20_Timeline',
    '30_WorkItems',
    '40_Risks',
    '50_Stakeholders',
    '60_Evidence',
    '90_Attachments',
    '99_Templates',
  ]

  const created: string[] = []
  mkdirSync(vaultPath, { recursive: true })

  for (const dir of dirs) {
    const fullPath = join(vaultPath, dir)
    if (!existsSync(fullPath)) {
      mkdirSync(fullPath, { recursive: true })
      created.push(dir)
    }
  }

  const files: Array<[string, string]> = [
    ['Welcome Board.md', WELCOME_BOARD],
    ['README.md', README],
    ['.obsidian/app.json', JSON.stringify({
      alwaysUpdateLinks: true,
      attachmentFolderPath: '90_Attachments',
      newFileLocation: 'folder',
      newFileFolderPath: '00_Inbox',
      promptDelete: false,
      showLineNumber: true,
      spellcheck: false,
      useMarkdownLinks: true,
    }, null, 2)],
    ['.obsidian/core-plugins.json', JSON.stringify({
      'file-explorer': true,
      'global-search': true,
      switcher: true,
      graph: true,
      backlink: true,
      canvas: true,
      'outgoing-link': true,
      'tag-pane': true,
      footnotes: false,
      properties: true,
      'page-preview': true,
      'daily-notes': true,
      templates: true,
      'note-composer': true,
      'command-palette': true,
      'slash-command': false,
      'editor-status': true,
      bookmarks: true,
      'markdown-importer': false,
      'zk-prefixer': false,
      'random-note': false,
      outline: true,
      'word-count': true,
      slides: false,
      'audio-recorder': false,
      workspaces: false,
      'file-recovery': true,
      publish: false,
      sync: false,
      bases: true,
      webviewer: false,
    }, null, 2)],
    ['.obsidian/community-plugins.json', JSON.stringify([
      'dataview',
      'obsidian-tasks-plugin',
      'obsidian-kanban',
      'chinese-calendar',
      'templater-obsidian',
      'metadata-menu',
      'quickadd',
      'table-editor-obsidian',
    ], null, 2)],
    ['.obsidian/daily-notes.json', JSON.stringify({
      format: 'YYYY-MM-DD',
      folder: '00_Inbox/Daily',
      template: '99_Templates/Daily Report.md',
    }, null, 2)],
    ['.obsidian/templates.json', JSON.stringify({
      folder: '99_Templates',
      dateFormat: 'YYYY-MM-DD',
      timeFormat: 'HH:mm',
    }, null, 2)],
    ['.obsidian/plugins/chinese-calendar/data.json', JSON.stringify({
      daily: { useQuickAdd: false, quickAddChoice: '' },
      weekly: { useQuickAdd: false, quickAddChoice: '' },
      monthly: { useQuickAdd: false, quickAddChoice: '' },
      quarterly: { useQuickAdd: false, quickAddChoice: '' },
      yearly: { useQuickAdd: false, quickAddChoice: '' },
      appearance: {
        useScale: false,
        layout: 'Normal',
        pastTimeTransparent: true,
      },
    }, null, 2)],
    ['.obsidian/plugins/dataview/data.json', JSON.stringify({
      renderNullAs: '\\-',
      taskCompletionTracking: true,
      taskCompletionUseEmojiShorthand: true,
      warnOnEmptyResult: true,
      refreshEnabled: true,
      refreshInterval: 2500,
      defaultDateFormat: 'yyyy-MM-dd',
      defaultDateTimeFormat: 'yyyy-MM-dd HH:mm',
      maxRecursiveRenderDepth: 4,
      inlineQueryPrefix: '=',
      inlineJsQueryPrefix: '$=',
      enableInlineDataview: true,
      enableDataviewJs: true,
    }, null, 2)],
    ['.obsidian/plugins/templater-obsidian/data.json', JSON.stringify({
      templates_folder: '99_Templates',
      trigger_on_file_creation: false,
      auto_jump_to_cursor: true,
      enable_system_commands: false,
      shell_path: '',
      user_scripts_folder: '',
      enable_folder_templates: false,
      folder_templates: [],
      syntax_highlighting: true,
      syntax_highlighting_mobile: true,
      enabled_templates_hotkeys: [],
    }, null, 2)],
    ['.obsidian/plugins/obsidian-tasks-plugin/data.json', JSON.stringify({
      globalFilter: '',
      removeGlobalFilter: false,
      setDoneDate: true,
      autoSuggestInEditor: true,
      autoSuggestMinMatch: 0,
      dateFormat: 'YYYY-MM-DD',
      dateFormatForFilename: 'YYYY-MM-DD',
      filenameAsScheduledDate: false,
      filenameAsDateFolders: [],
      useFilenameAsScheduledDate: false,
      statusSettings: {
        coreStatuses: [
          {
            symbol: ' ',
            name: 'Todo',
            nextStatusSymbol: 'x',
            availableAsCommand: true,
            type: 'TODO',
          },
          {
            symbol: 'x',
            name: 'Done',
            nextStatusSymbol: ' ',
            availableAsCommand: true,
            type: 'DONE',
          },
          {
            symbol: '/',
            name: 'In Progress',
            nextStatusSymbol: 'x',
            availableAsCommand: true,
            type: 'IN_PROGRESS',
          },
          {
            symbol: '-',
            name: 'Cancelled',
            nextStatusSymbol: ' ',
            availableAsCommand: true,
            type: 'CANCELLED',
          },
        ],
        customStatuses: [],
      },
    }, null, 2)],
    ['.obsidian/plugins/quickadd/data.json', JSON.stringify({
      choices: [],
      macros: [],
      inputPrompt: 'single-line',
      devMode: false,
      templateFolderPath: '99_Templates',
    }, null, 2)],
    ['.obsidian/plugins/metadata-menu/data.json', JSON.stringify({
      fileClassAlias: 'fileClass',
      classFilesPath: '99_Templates/Metadata',
      isAutosuggestEnabled: true,
      isAutoCalculationEnabled: true,
      displayFieldsInContextMenu: true,
      frontmatterListDisplay: 'asArray',
    }, null, 2)],
    ['.obsidian/plugins/obsidian-kanban/data.json', JSON.stringify({
      newNoteFolder: '30_WorkItems',
      'lane-width': 320,
      'show-checkboxes': true,
      'date-picker-week-start': 1,
      'date-colors': [
        {
          distance: 0,
          unit: 'days',
          direction: 'after',
          backgroundColor: 'rgba(255, 0, 0, 0.18)',
          color: 'rgba(255, 255, 255, 1)',
          isToday: true,
        },
      ],
    }, null, 2)],
    ['99_Templates/Project Canvas.md', TEMPLATE_PROJECT],
    ['99_Templates/Daily Report.md', TEMPLATE_DAILY],
    ['99_Templates/Work Item.md', TEMPLATE_WORK_ITEM],
  ]

  for (const [relativePath, content] of files) {
    if (writeIfMissing(join(vaultPath, relativePath), `${content.trimEnd()}\n`)) {
      created.push(relativePath)
    }
  }

  return created
}
