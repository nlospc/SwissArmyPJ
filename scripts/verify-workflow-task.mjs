import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const taskPath = path.join(root, 'workflow', 'active-task.yaml');

const requiredTopLevel = [
  'task_id:',
  'title:',
  'status:',
  'intent:',
  'execution_package:',
  'current_agreement:',
  'schema_contract:',
  'design_contract:',
  'fixture_contract:',
  'visual_acceptance:',
  'current_goal:',
  'next_step:',
  'updated_at:',
];

if (!fs.existsSync(taskPath)) {
  console.error('[workflow-verify] missing workflow/active-task.yaml');
  process.exit(1);
}

const text = fs.readFileSync(taskPath, 'utf8');
const missing = requiredTopLevel.filter((key) => !text.includes(key));

if (missing.length > 0) {
  console.error(`[workflow-verify] missing required fields: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('[workflow-verify] active task is valid');
