# Workflow

This directory stores the repo-level workflow handoff state shared by Hermes, Claude Code, and future agents.

Start here before implementation/debugging/review:
- `project-profile.yaml`
- `active-task.yaml`
- `handoff.md`

Rules:
- Treat these files as the shared workflow state.
- Keep `active-task.yaml` current when taking or releasing the active writer role.
- Update `handoff.md` before ending a work session.
- Use the verify command defined in `project-profile.yaml`.
