import { ipcMain } from 'electron';

import { getDatabase } from '../database/schema';

import type { IPCResponse, SearchResult } from '../../shared/types';

export function registerSearchHandlers(): void {
  ipcMain.handle('search:global', handleGlobalSearch);
}

function handleGlobalSearch(_event: any, query: string): IPCResponse<SearchResult[]> {
  try {
    const db = getDatabase();
    const results: SearchResult[] = [];
    const searchPattern = `%${query}%`;

    const portfolios = db.prepare(`
      SELECT id, uuid, name, description FROM portfolios
      WHERE name LIKE ? OR description LIKE ?
      LIMIT 10
    `).all(searchPattern, searchPattern) as any[];

    for (const portfolio of portfolios) {
      results.push({
        type: 'portfolio',
        id: portfolio.id,
        uuid: portfolio.uuid,
        title: portfolio.name,
        subtitle: portfolio.description,
      });
    }

    const projects = db.prepare(`
      SELECT id, uuid, name, owner, status FROM projects
      WHERE name LIKE ? OR description LIKE ?
      LIMIT 10
    `).all(searchPattern, searchPattern) as any[];

    for (const project of projects) {
      results.push({
        type: 'project',
        id: project.id,
        uuid: project.uuid,
        title: project.name,
        subtitle: project.owner,
        metadata: { status: project.status },
      });
    }

    const workItems = db.prepare(`
      SELECT id, uuid, title, type, status FROM work_items
      WHERE title LIKE ? OR notes LIKE ?
      LIMIT 10
    `).all(searchPattern, searchPattern) as any[];

    for (const workItem of workItems) {
      results.push({
        type: 'work_item',
        id: workItem.id,
        uuid: workItem.uuid,
        title: workItem.title,
        subtitle: workItem.type,
        metadata: { status: workItem.status },
      });
    }

    const inboxItems = db.prepare(`
      SELECT id, uuid, raw_text FROM inbox_items
      WHERE raw_text LIKE ? AND processed = 0
      LIMIT 10
    `).all(searchPattern) as any[];

    for (const inboxItem of inboxItems) {
      results.push({
        type: 'inbox',
        id: inboxItem.id,
        uuid: inboxItem.uuid,
        title: inboxItem.raw_text.substring(0, 100),
      });
    }

    return { success: true, data: results };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
