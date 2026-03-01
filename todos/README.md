# Todos

Track work items, deferred improvements, and follow-up tasks.

## Quick Start

```bash
# Create new todo
./scripts/create-todo.sh "p1" "Fix login bug" "Description..."

# Start working on a todo
./scripts/start-todo.sh 001-pending-p1-fix-login-bug.md

# Complete a todo
./scripts/done-todo.sh 001-in-progress-p1-fix-login-bug.md
```

## File Naming Convention

```
{id}-{status}-{priority}-{description}.md
```

**Examples:**

- `001-pending-p1-fix-auth-bug.md`
- `002-in-progress-p2-refactor-api.md`
- `003-done-p3-update-docs.md`

## Status Values

- `pending` - Not started
- `in-progress` - Currently working on
- `done` - Completed
- `deferred` - Postponed
- `rejected` - Won't do

## Priority Levels

- `p0` - Critical (drop everything)
- `p1` - High (this week)
- `p2` - Medium (this month)
- `p3` - Low (nice to have)

## Workflow Integration

Todos are created by:

- `/review` - Code review findings
- `/triage` - After reviewing issues
- Manual creation via `create-todo.sh`

See: [file-todos skill](../skills/file-todos/SKILL.md)
