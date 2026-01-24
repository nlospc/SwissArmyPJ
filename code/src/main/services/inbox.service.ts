import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { marked } from 'marked';
import { getDatabase } from '../db/schema';
import type { InboxFile, ApiResponse, CSVWorkPackageRow } from '@shared/types';

export class InboxService {
  private get db() {
    return getDatabase();
  }
  private inboxPath: string;

  constructor(inboxPath: string) {
    this.inboxPath = inboxPath;
  }

  getAll(): ApiResponse<InboxFile[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM inbox_files
        ORDER BY created_at DESC
      `);
      const files = stmt.all() as InboxFile[];
      return { success: true, data: files };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async processFile(filePath: string): Promise<ApiResponse<any>> {
    try {
      const ext = path.extname(filePath).toLowerCase().slice(1);
      const fileType = ext === 'md' || ext === 'markdown' ? 'md' : ext === 'csv' ? 'csv' : 'txt';

      // Check if file already exists in database
      const checkStmt = this.db.prepare('SELECT id FROM inbox_files WHERE file_path = ?');
      const existing = checkStmt.get(filePath);
      if (existing) {
        return { success: false, error: 'File already processed' };
      }

      // Create inbox file record
      const insertStmt = this.db.prepare(`
        INSERT INTO inbox_files (file_path, file_type, status)
        VALUES (?, ?, 'pending')
      `);
      const result = insertStmt.run(filePath, fileType);
      const fileId = result.lastInsertRowid as number;

      let content: string;
      let parsedData: any;

      // Read and parse file
      if (fileType === 'csv') {
        content = fs.readFileSync(filePath, 'utf-8');
        parsedData = this.parseCSV(content);
      } else {
        content = fs.readFileSync(filePath, 'utf-8');
        parsedData = this.parseMarkdown(content);
      }

      // Update inbox file record
      const updateStmt = this.db.prepare(`
        UPDATE inbox_files
        SET status = 'processed', processed_at = datetime('now')
        WHERE id = ?
      `);
      updateStmt.run(fileId);

      return { success: true, data: { fileId, fileType, parsedData } };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  private parseCSV(content: string): CSVWorkPackageRow[] {
    try {
      const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      return records as CSVWorkPackageRow[];
    } catch (error) {
      throw new Error(`Failed to parse CSV: ${String(error)}`);
    }
  }

  private parseMarkdown(content: string): any {
    try {
      const tokens = marked.lexer(content);
      
      const result = {
        headings: [] as string[],
        paragraphs: [] as string[],
        lists: [] as string[][],
        codeBlocks: [] as string[],
      };

      for (const token of tokens) {
        switch (token.type) {
          case 'heading':
            result.headings.push(token.text);
            break;
          case 'paragraph':
            result.paragraphs.push(token.text);
            break;
          case 'list':
            result.lists.push(token.items.map((item: any) => item.text));
            break;
          case 'code':
            result.codeBlocks.push(token.text);
            break;
        }
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to parse Markdown: ${String(error)}`);
    }
  }

  // Watch inbox directory for new files
  async watchInbox(callback: (filePath: string) => void): Promise<fs.FSWatcher> {
    if (!fs.existsSync(this.inboxPath)) {
      fs.mkdirSync(this.inboxPath, { recursive: true });
    }

    const watcher = fs.watch(this.inboxPath, (eventType, filename) => {
      if (eventType === 'rename' && filename) {
        const filePath = path.join(this.inboxPath, filename);
        // Wait a bit to ensure file is fully written
        setTimeout(() => {
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            callback(filePath);
          }
        }, 500);
      }
    });

    return watcher;
  }
}

// Factory function to create inbox service with workspace path
export function createInboxService(workspacePath: string): InboxService {
  const inboxPath = path.join(workspacePath, 'inbox');
  return new InboxService(inboxPath);
}
