// Check database state and migrations
const fs = require('fs');
const path = require('path');

console.log('Checking database state...\n');

const dbPath = path.join(__dirname, '..', 'swiss-army-pm.db');

if (!fs.existsSync(dbPath)) {
  console.log('❌ Database does not exist');
  process.exit(1);
}

console.log('✅ Database exists:', dbPath);
console.log('File size:', (fs.statSync(dbPath).size / 1024).toFixed(2), 'KB\n');

// Try to read SQLite file header
const buffer = fs.readFileSync(dbPath);
const header = buffer.toString('utf8', 0, 16);
console.log('Database header:', header);

// Check if it's a valid SQLite file
if (header === 'SQLite format 3\u0000') {
  console.log('✅ Valid SQLite database\n');
} else {
  console.log('❌ Invalid SQLite database\n');
}
