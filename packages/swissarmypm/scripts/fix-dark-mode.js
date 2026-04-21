/**
 * 批量修复硬编码颜色值的脚本
 * 运行方式: node scripts/fix-dark-mode.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 需要替换的颜色映射
const colorReplacements = {
  // 背景色
  'bg-white': 'bg-theme-container',
  'bg-gray-50': 'bg-theme-container',
  'bg-gray-100': 'bg-theme-layout',
  'bg-gray-200': 'bg-theme-layout',
  'backgroundColor: white': "backgroundColor: 'var(--ant-color-bg-container)'",
  'backgroundColor:#fff': "backgroundColor: 'var(--ant-color-bg-container)'",
  'backgroundColor:#ffffff': "backgroundColor: 'var(--ant-color-bg-container)'",

  // 文字颜色
  'text-gray-500': 'text-theme-secondary',
  'text-gray-400': 'text-theme-secondary',
  'text-gray-600': 'text-theme-primary',
  'color: gray': "color: 'var(--ant-color-text-secondary)'",
  'color:#000': "color: 'var(--ant-color-text)'",
  'color:black': "color: 'var(--ant-color-text)'",

  // 边框颜色
  'border-gray-200': 'border-theme-secondary',
  'border-gray-300': 'border-theme-primary',
  'borderColor: gray': "borderColor: 'var(--ant-color-border)'",
  'borderColor:#d9d9d9': "borderColor: 'var(--ant-color-border)'",

  // 内联样式
  "backgroundColor: 'white'": "backgroundColor: 'var(--ant-color-bg-container)'",
  'backgroundColor: "white"': 'backgroundColor: "var(--ant-color-bg-container)"',
  'color: "black"': 'color: "var(--ant-color-text)"',
  "color: 'black'": "color: 'var(--ant-color-text)'",
};

// 递归处理目录
function processDirectory(dir, options = {}) {
  const { dryRun = true, extensions = ['.tsx', '.ts', '.jsx', '.js'] } = options;

  const files = fs.readdirSync(dir, { withFileTypes: true });
  let fixedCount = 0;
  let totalFiles = 0;

  for (const file of files) {
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory()) {
      // 跳过 node_modules 和其他不需要的目录
      if (
        file.name === 'node_modules' ||
        file.name === 'dist' ||
        file.name === 'build' ||
        file.name === '.git' ||
        file.name.startsWith('.')
      ) {
        continue;
      }

      const result = processDirectory(fullPath, options);
      fixedCount += result.fixedCount;
      totalFiles += result.totalFiles;
    } else if (file.isFile()) {
      const ext = path.extname(file.name);
      if (extensions.includes(ext)) {
        totalFiles++;
        const result = processFile(fullPath, dryRun);
        if (result.fixed) {
          fixedCount++;
          console.log(`✓ Fixed: ${fullPath}`);
          if (result.preview) {
            console.log(`  Preview: ${result.preview}`);
          }
        }
      }
    }
  }

  return { fixedCount, totalFiles };
}

// 处理单个文件
function processFile(filePath, dryRun = true) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let hasChanges = false;

    // 应用所有替换规则
    for (const [oldPattern, newPattern] of Object.entries(colorReplacements)) {
      const regex = new RegExp(oldPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (regex.test(content)) {
        content = content.replace(regex, newPattern);
        hasChanges = true;
      }
    }

    // 检查并修复常见的内联样式问题
    const inlineStyleFixes = [
      [/style=\{[^}]*backgroundColor:\s*['"`]white['"`][^}]*\}/g, (match) => {
        return match.replace(/backgroundColor:\s*['"`]white['"`]/, "backgroundColor: 'var(--ant-color-bg-container)'");
      }],
      [/style=\{[^}]*color:\s*['"`]black['"`][^}]*\}/g, (match) => {
        return match.replace(/color:\s*['"`]black['"`]/, "color: 'var(--ant-color-text)'");
      }],
    ];

    for (const [regex, replacement] of inlineStyleFixes) {
      if (regex.test(content)) {
        content = content.replace(regex, replacement);
        hasChanges = true;
      }
    }

    if (hasChanges && !dryRun) {
      fs.writeFileSync(filePath, content, 'utf8');
      return { fixed: true, preview: null };
    } else if (hasChanges && dryRun) {
      // 生成预览
      const changes = [];
      for (const [oldPattern, newPattern] of Object.entries(colorReplacements)) {
        if (originalContent.includes(oldPattern)) {
          changes.push(`${oldPattern} → ${newPattern}`);
        }
      }
      return { fixed: true, preview: changes.join(', ') };
    }

    return { fixed: false };
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return { fixed: false };
  }
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--fix');
  const srcPath = path.join(__dirname, '..', 'src', 'renderer');

  console.log('🎨 深色模式批量修复工具\n');
  console.log(`模式: ${dryRun ? '预览模式 (不会修改文件)' : '修复模式 (将修改文件)'}`);
  console.log(`目标目录: ${srcPath}\n`);

  if (dryRun) {
    console.log('运行修复模式请使用: node scripts/fix-dark-mode.js --fix\n');
  }

  const result = processDirectory(srcPath, { dryRun, extensions: ['.tsx', '.ts'] });

  console.log('\n📊 统计:');
  console.log(`  扫描文件: ${result.totalFiles}`);
  console.log(`  需要修复: ${result.fixedCount}`);

  if (result.fixedCount > 0 && dryRun) {
    console.log('\n💡 提示: 运行 `node scripts/fix-dark-mode.js --fix` 来应用修复');
  }

  if (!dryRun && result.fixedCount > 0) {
    console.log('\n✅ 修复完成! 建议运行以下命令验证更改:');
    console.log('   git diff');
    console.log('   npm run dev');
  }
}

// 运行
main();
