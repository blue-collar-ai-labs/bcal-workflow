---
name: Session status separation
category: workflow
detect: "NEXT_SESSION\\.md|project status lives in|session handoff"
---

## What it does

Ensures project status lives in `NEXT_SESSION.md` (the canonical location) and that `CLAUDE.md` points there instead of duplicating it. Creates `NEXT_SESSION.md` if it doesn't exist.

## Why

CLAUDE.md is for durable project instructions -- conventions, architecture, guidelines. Project status (what's done, what's next, current state) changes every session and belongs in NEXT_SESSION.md. Duplicating status in CLAUDE.md leads to stale information that misleads the agent and requires manual cleanup.

## Snippet

```markdown
## Session Handoff

Project status and session context live in `NEXT_SESSION.md`. Use `/start` at the beginning of a session to check for a previous session handoff and choose how to proceed.
```
