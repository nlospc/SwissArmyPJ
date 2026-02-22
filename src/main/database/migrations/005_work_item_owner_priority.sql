-- Migration 005: Add owner and priority fields to work_items
-- Date: 2026-02-22

ALTER TABLE work_items ADD COLUMN owner TEXT;
ALTER TABLE work_items ADD COLUMN priority TEXT CHECK(priority IN ('low','medium','high','critical')) DEFAULT 'medium';
