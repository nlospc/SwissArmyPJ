# Data Model

## Projects Table
id, uuid, name, description, status, created_at, updated_at

## Work Packages Table
id, uuid, project_id, parent_id, name, description, type, status, priority, scheduling_mode, start_date, end_date, duration_days, progress, budget_planned, budget_actual, created_at, updated_at

## Dependencies Table
id, predecessor_id, successor_id, type, lag_days, created_at
