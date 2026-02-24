// Reset migration 004 tracking so it reapplies
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'swiss-army-pm.db');

if (!fs.existsSync(dbPath)) {
  console.log('✅ Database does not exist - will be created fresh on next run');
  process.exit(0);
}

console.log('⚠️  Database exists. To fix missing tables:');
console.log('\n1. Stop the app (npm run dev)');
console.log('2. Delete the database:');
console.log('   rm swiss-army-pm.db');
console.log('   (or on Windows: Remove-Item swiss-army-pm.db)');
console.log('3. Restart: npm run dev');
console.log('\nThe app will recreate everything with all migrations.\n');
