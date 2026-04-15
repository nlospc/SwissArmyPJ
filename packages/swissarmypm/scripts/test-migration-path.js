// Test migration path resolution
const path = require('path');
const fs = require('fs');

// Simulate what __dirname will be in compiled code
const compiledDir = path.join(__dirname, '..', 'dist', 'main', 'database');
const migrationsDir = path.join(compiledDir, 'migrations');

console.log('Compiled dir:', compiledDir);
console.log('Migrations dir:', migrationsDir);
console.log('Exists?', fs.existsSync(migrationsDir));

if (fs.existsSync(migrationsDir)) {
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log('\nMigrations found:');
  files.forEach(f => console.log('  -', f));

  if (files.length === 0) {
    console.log('\n❌ No migration files found!');
  } else {
    console.log('\n✅ Migrations will run on next start');
  }
} else {
  console.log('\n❌ Migrations directory does not exist in dist/');
}
