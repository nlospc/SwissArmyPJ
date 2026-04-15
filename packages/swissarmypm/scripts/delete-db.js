const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'swiss-army-pm.db');
const backupPath = path.join(__dirname, '..', 'swiss-army-pm.db.backup');

console.log('Deleting database...\n');

if (fs.existsSync(dbPath)) {
  // Backup first
  fs.copyFileSync(dbPath, backupPath);
  console.log('✅ Backed up to:', backupPath);

  // Delete
  fs.unlinkSync(dbPath);
  console.log('✅ Deleted:', dbPath);
} else {
  console.log('ℹ️  Database does not exist');
}

if (fs.existsSync(dbPath)) {
  console.log('\n❌ Failed to delete database');
  process.exit(1);
} else {
  console.log('\n✨ Database deleted successfully');
  console.log('Run `npm run dev` to recreate with migrations');
}
