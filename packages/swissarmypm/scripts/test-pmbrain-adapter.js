#!/usr/bin/env node
/**
 * PMBrain Adapter 测试脚本
 * 验证 SwissArmyPM 是否能正确读取 PMBrain 数据库
 */

const path = require('path');
const Database = require('better-sqlite3');

// 模拟 cwd 为项目根目录（和 Electron 运行时一致）
process.chdir(path.join(__dirname, '../../../..'));
console.log('工作目录:', process.cwd());

// ============================================================================
// 直接测试数据库连接（不依赖 TypeScript 编译）
// ============================================================================

function testDirectConnection() {
  console.log('\n📊 直接测试 PMBrain 数据库连接...');
  
  try {
    const dbPath = path.join(process.cwd(), '.pmbrain/pmbrain.db');
    console.log('数据库路径:', dbPath);
    
    const db = new Database(dbPath, { fileMustExist: true });
    console.log('✅ 数据库连接成功！');

    // 统计信息
    const stats = {
      projects: db.prepare('SELECT COUNT(*) as count FROM projects').get().count,
      workItems: db.prepare('SELECT COUNT(*) as count FROM work_items').get().count,
      stakeholders: db.prepare('SELECT COUNT(*) as count FROM stakeholders').get().count,
      risks: db.prepare('SELECT COUNT(*) as count FROM risks').get().count,
    };
    console.log('\n📈 数据库统计:');
    console.log(`  项目: ${stats.projects} 个`);
    console.log(`  工作项: ${stats.workItems} 个`);
    console.log(`  干系人: ${stats.stakeholders} 个`);
    console.log(`  风险: ${stats.risks} 个`);

    // 列出前 5 个项目
    console.log('\n📋 前 5 个项目:');
    const projects = db.prepare(`
      SELECT p.id, p.code, p.status, p.progress_pct, pg.title
      FROM projects p
      JOIN pages pg ON p.id = pg.id
      ORDER BY p.updated_at DESC
      LIMIT 5
    `).all();
    projects.forEach((p, i) => {
      console.log(`  ${i + 1}. [${p.code}] ${p.title} (${p.status}, ${p.progress_pct}%)`);
    });

    // 列出前 5 个工作项
    console.log('\n✅ 前 5 个工作项:');
    const workItems = db.prepare(`
      SELECT wi.id, wi.code, wi.item_type, wi.status, wi.title
      FROM work_items wi
      ORDER BY wi.updated_at DESC
      LIMIT 5
    `).all();
    workItems.forEach((w, i) => {
      console.log(`  ${i + 1}. [${w.code || 'N/A'}] ${w.title} (${w.item_type}, ${w.status})`);
    });

    // 测试 FTS5 搜索
    console.log('\n🔍 测试 FTS5 全文搜索 (搜索 "项目"):');
    try {
      const results = db.prepare(`
        SELECT 
          entity_id,
          entity_type,
          title,
          snippet(pmbrain_fts, 3, '【', '】', '...', 32) as highlight
        FROM pmbrain_fts
        WHERE pmbrain_fts MATCH ?
        ORDER BY rank
        LIMIT 5
      `).all('项目');
      
      if (results.length > 0) {
        results.forEach((r, i) => {
          console.log(`  ${i + 1}. [${r.entity_type}] ${r.title}`);
          console.log(`     摘要: ${r.highlight}`);
        });
      } else {
        console.log('  无匹配结果');
      }
    } catch (searchError) {
      console.log('  ⚠️ FTS5 表可能还未初始化:', searchError.message);
    }

    db.close();
    console.log('\n✅ 所有测试通过！');
    return true;
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    return false;
  }
}

// ============================================================================
// 执行测试
// ============================================================================

console.log('══════════════════════════════════════════════════════════════════');
console.log('PMBrain 适配器 - 连接测试');
console.log('══════════════════════════════════════════════════════════════════');

const success = testDirectConnection();

console.log('\n══════════════════════════════════════════════════════════════════');
console.log(success ? '✅ 阶段一准备就绪 - SwissArmyPM 可以读取 PMBrain 数据！' : '❌ 需要检查数据库路径');
console.log('══════════════════════════════════════════════════════════════════');

process.exit(success ? 0 : 1);
