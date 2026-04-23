import * as crypto from 'node:crypto';
import type Database from 'better-sqlite3';

import { getDatabase } from '../../database/schema';

export interface AuditLogEntry {
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete';
  userId?: string | null;
  source?: string | null;
  oldValuesJson?: string | null;
  newValuesJson?: string | null;
  createdAt?: string;
}

interface WriteAuditLogOptions {
  db?: Database.Database;
}

export function writeAuditLog(entry: AuditLogEntry, options: WriteAuditLogOptions = {}): void {
  try {
    const db = options.db ?? getDatabase();
    const createdAt = entry.createdAt ?? new Date().toISOString();

    db.prepare(`
      INSERT INTO audit_log (
        uuid,
        entity_type,
        entity_id,
        action,
        user_id,
        source,
        old_values_json,
        new_values_json,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      entry.entityType,
      entry.entityId,
      entry.action,
      entry.userId ?? null,
      entry.source ?? null,
      entry.oldValuesJson ?? null,
      entry.newValuesJson ?? null,
      createdAt
    );
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}