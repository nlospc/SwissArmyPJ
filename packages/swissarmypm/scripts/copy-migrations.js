const fs = require('fs');
const path = require('path');

// Copy migrations to where the bundled code looks for them
const srcDir = path.join(__dirname, '..', 'src', 'main', 'database', 'migrations');
const destDir = path.join(__dirname, '..', 'dist', 'main', 'migrations');

// Create destination directory
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Copy all SQL files
const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.sql'));
let copied = 0;

files.forEach(file => {
  const src = path.join(srcDir, file);
  const dest = path.join(destDir, file);
  fs.copyFileSync(src, dest);
  copied++;
  console.log(`✅ Copied: ${file}`);
});

console.log(`\n✨ Copied ${copied} migration file(s) to dist/main/migrations/`);
