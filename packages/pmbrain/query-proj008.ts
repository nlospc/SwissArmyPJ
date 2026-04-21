import { openDatabase } from './src/core/db';
import { loadConfig } from './src/core/config';

const config = loadConfig();
const db = openDatabase(config);
const rows = db.query(`
  SELECT code, owner, budget_baseline, status
  FROM projects
  WHERE code = 'PROJ008'
`).all();

console.log(JSON.stringify(rows, null, 2));
db.close();