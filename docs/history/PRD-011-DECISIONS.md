> ⚠️ **已取代** — 本 PRD 已被 [PRD-001-Master.md](./PRD-001-Master.md) 取代。
> 当前产品方向为 **PM Workspace**，请以 Master PRD 为准。
> 本文档仅供历史参考。

# PRD-011 My Work - Design Decisions Summary

| Field | Value |
|-------|-------|
| **Date** | 2026-02-01 |
| **Status** | Approved for Implementation |
| **Related** | @PRD-011-MyWork.md, @my-work-blueprint.md |

---

## ✅ Approved Design Decisions

### 1. Completed Tasks: 24-Hour Auto-Archive

**Decision**: Show completed tasks with strikethrough for 24 hours, then auto-archive

**Implementation**:
- Add `completed_at` timestamp to `items` table
- Create trigger to auto-set when `status = 'Done'`
- Filter query: exclude tasks where `completed_at <= datetime('now', '-1 day')`
- UI: Show green banner "✓ Completed 2h ago • Auto-archives in 22h"
- Archive view accessible via "View Archive" button

**Database Migration**:
```sql
ALTER TABLE items ADD COLUMN completed_at TEXT;

CREATE TRIGGER items_completed_at
AFTER UPDATE OF status ON items
FOR EACH ROW
WHEN NEW.status = 'Done' AND OLD.status != 'Done'
BEGIN
  UPDATE items SET completed_at = datetime('now') WHERE id = NEW.id;
END;
```

**User Experience**:
- Reduces clutter without losing immediate context
- 24h grace period prevents accidental "where did my task go?"
- Archived tasks still searchable in Archive view

---

### 2. Edit Time Logs: Enabled with Audit Trail

**Decision**: Allow editing time logs after submission with full audit trail

**Implementation**:
- Add `edited_at`, `edited_by`, `edit_count` columns to `time_logs`
- Create IPC handler `timelog:edit` with validation
- Update creates audit_log entry with old/new values
- UI: Show "✏️ Edit" button on hover in Today's Log
- Dialog with pre-filled start/end time, auto-calculated duration

**Database Migration**:
```sql
ALTER TABLE time_logs ADD COLUMN edited_at TEXT;
ALTER TABLE time_logs ADD COLUMN edited_by TEXT;
ALTER TABLE time_logs ADD COLUMN edit_count INTEGER DEFAULT 0;

CREATE TRIGGER time_logs_track_edits
AFTER UPDATE ON time_logs
FOR EACH ROW
WHEN OLD.start_time != NEW.start_time OR OLD.end_time != NEW.end_time OR OLD.notes != NEW.notes
BEGIN
  UPDATE time_logs
  SET
    edited_at = datetime('now'),
    edited_by = NEW.user_id,
    edit_count = OLD.edit_count + 1
  WHERE id = NEW.id;
END;
```

**Validation**:
- Start time must be before end time
- No overlapping time logs (optional, to prevent double-counting)
- Audit log records old/new values

**UI Indicator**:
- Show "Edited 2x • Last: 10m ago" below time log entry
- Tooltip on hover shows edit history

---

### 3. Multiple Timers: Not in v1, Documented for Future

**Decision**: Single active timer for v1, but record requirement for v2

**Rationale**:
- Reduces complexity for MVP
- Focus on core workflow first
- Validate user demand before building

**Future Requirement (v2)**:
- Support up to 3 simultaneous timers
- Constraint: Only 1 Pomodoro timer at a time (simple timers can be parallel)
- Database already supports (no schema changes needed)
- UI changes: Stacked timer widgets, total time display

**Backend Support**: ✅ Already compatible
- `time_logs` table allows multiple rows with `end_time = NULL`
- No backend changes needed for v2

**Review Trigger**: User feedback after v1 release

---

### 4. Calendar Integration: Phase 2 Feature with Holiday Support

**Decision**: Sync with Google Calendar + Outlook, show holidays based on app language

**Implementation Phases**:

#### Phase 2.1: Holiday Display (Week 1-2)
- Fetch holidays from public API (Nager.Date)
- Cache in SQLite `holidays` table
- Display in calendar widget sidebar
- Auto-switch based on app language:
  - `zh` → Chinese holidays (春节, 国庆节, etc.)
  - `en` → US/UK holidays
  - Auto-refresh yearly

#### Phase 2.2: Google Calendar Sync (Week 3-4)
- OAuth2 integration
- Read-only sync (fetch events)
- Display task due dates on calendar
- Show calendar events in sidebar

#### Phase 2.3: Outlook Sync (Week 5-6)
- Microsoft Graph API integration
- Same read-only display

#### Phase 2.4: Two-Way Sync (Future)
- Create calendar events from tasks
- Update task due dates from calendar
- Conflict resolution UI

**Database Schema**:
```sql
CREATE TABLE calendar_connections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT CHECK(provider IN ('google', 'microsoft', 'ical')),
  calendar_id TEXT NOT NULL,
  access_token TEXT,  -- Encrypted
  refresh_token TEXT,
  token_expires_at TEXT,
  sync_enabled INTEGER DEFAULT 1,
  last_sync_at TEXT
);

CREATE TABLE holidays (
  id TEXT PRIMARY KEY,
  country_code TEXT NOT NULL,  -- 'CN', 'US', 'GB'
  date TEXT NOT NULL,          -- 'YYYY-MM-DD'
  local_name TEXT NOT NULL,    -- "春节"
  english_name TEXT NOT NULL,  -- "Spring Festival"
  year INTEGER NOT NULL,
  UNIQUE(country_code, date)
);
```

**Holiday API**:
- Primary: [Nager.Date API](https://date.nager.at/) (free, open-source)
- Fallback: Embedded JSON file for offline support

**Language → Country Mapping**:
```typescript
'zh' → 'CN' (China)
'zh-TW' → 'TW' (Taiwan)
'en' → 'US' (United States)
'en-GB' → 'GB' (United Kingdom)
'ja' → 'JP' (Japan)
'de' → 'DE' (Germany)
```

**UI Component**:
- Mini calendar in sidebar (30% width)
- Holiday indicators on dates (🏮 for Chinese holidays)
- Upcoming events list (tasks + holidays)

---

## 📋 Implementation Priority

### Phase 1: Core My Work (v1.0)
- [ ] Todo list with grouping/sorting
- [ ] Time logging (manual + timer)
- [ ] Pomodoro timer
- [ ] 24h auto-archive for completed tasks
- [ ] Edit time logs functionality

**Duration**: 8 weeks

### Phase 2: Calendar Integration (v1.1)
- [ ] Holiday display (language-aware)
- [ ] Google Calendar sync (read-only)
- [ ] Outlook sync (read-only)
- [ ] Calendar widget in sidebar

**Duration**: 6 weeks

### Future (v2.0+)
- [ ] Multiple simultaneous timers (based on user feedback)
- [ ] Two-way calendar sync
- [ ] Mobile companion app
- [ ] Team time tracking view

---

## 🔧 Technical Notes

### Migration Order
1. Create `time_logs` table with edit tracking columns
2. Create `pomodoro_sessions` table
3. Create `user_preferences` table
4. Add `estimated_minutes`, `assigned_to`, `completed_at` to `items`
5. Create triggers for auto-set timestamps
6. (Phase 2) Create `calendar_connections` and `holidays` tables

### IPC Handlers Required
**Phase 1 (v1)**:
- `mywork:getTodos` - Fetch todos with archive filter
- `mywork:markDone` - Mark task complete
- `timelog:start` - Start timer
- `timelog:stop` - Stop timer
- `timelog:logManual` - Manual time entry
- `timelog:edit` - Edit existing log ✨ NEW
- `timelog:getToday` - Fetch today's logs
- `timelog:getWeeklySummary` - Fetch weekly stats
- `pomodoro:start` - Start Pomodoro session
- `pomodoro:complete` - Complete session

**Phase 2 (Calendar)**:
- `calendar:fetchHolidays` - Fetch from API
- `calendar:getHolidays` - Get cached holidays
- `calendar:getUpcomingHolidays` - Next 5 holidays
- `calendar:connectGoogle` - OAuth flow
- `calendar:syncEvents` - Fetch calendar events

### Performance Considerations
- Index on `items.assigned_to` for todo queries
- Composite index on `time_logs(user_id, start_time)` for log queries
- Partial index on `time_logs(user_id) WHERE end_time IS NULL` for active timers
- Holiday cache refreshed yearly (background job)

---

## 🎯 Success Metrics

### Phase 1 (v1)
- [ ] Todo list loads in < 1 second for 100 tasks
- [ ] Timer countdown updates at 60 FPS (no lag)
- [ ] Pomodoro completion triggers notification within 1 second
- [ ] Edit time log saves in < 300ms
- [ ] Auto-archive correctly filters tasks at 24h boundary

### Phase 2 (Calendar)
- [ ] Holiday fetch completes in < 2 seconds
- [ ] Holiday cache covers full year (365 days)
- [ ] Google Calendar sync completes in < 5 seconds for 100 events
- [ ] Language switch updates holidays within 1 second

---

## 📝 Open Items for Later Discussion

1. **Overlap Detection**: Should editing time logs prevent overlapping entries?
   - Pros: Prevents accidental double-counting
   - Cons: Reduces flexibility (user might intentionally overlap)
   - Decision deferred to user testing

2. **Pomodoro Customization**: Should users customize work/break durations?
   - Default: 25-5-25-5-25-5-25-15 (classic Pomodoro)
   - Option: Add "Pomodoro Settings" in preferences
   - Decision: Yes, add in Phase 1 (stored in `user_preferences`)

3. **Archive Retention**: Should archived tasks ever be deleted?
   - Current: Archived tasks kept forever
   - Option: Auto-delete after 90 days? 1 year?
   - Decision: Keep forever for v1, revisit based on database size

4. **Notification Sounds**: Which sound for Pomodoro completion?
   - Options: System default, custom sound, user upload
   - Decision: System default for v1, custom sound in v2

---

## 🚀 Next Steps

1. **Create database migration** (`004_my_work.sql`)
2. **Implement IPC handlers** in `src/main/ipc/myWorkHandlers.ts`
3. **Build Zustand store** in `src/renderer/stores/useMyWorkStore.ts`
4. **Create UI components**:
   - `TodoListContainer.tsx`
   - `PomodoroTimer/TimerWidget.tsx`
   - `TodayLog/LogEntry.tsx`
   - `EditTimeLogDialog.tsx`
5. **Add desktop notification permissions** request
6. **Write tests** (unit + integration)
7. **Deploy Phase 1** (8-week timeline)
8. **User feedback collection**
9. **Plan Phase 2** (calendar integration)

---

*Document approved for implementation on 2026-02-01*
