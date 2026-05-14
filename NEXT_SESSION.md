---
session_name: "hungry-fox-17"
model: "Opus 4.6 (1M context)"
context_pct: 18
ended_at: "2026-05-14T13:40:00Z"
---

## Resume: bcal-workflow — test new practices, bump version

**Project:** bcal-workflow plugin (agent-agnostic workflow skills, bcal-agent-plugins marketplace). Connected to bcal-brain.

**Just completed:** Formalized the NEXT_SESSION.md contract between end-session-gracefully and start-session using YAML frontmatter (session_name, model, context_pct, ended_at). Start-session now shows previous session metadata to help users decide between /continue, resuming with prompt, or starting fresh. Fixed write-to-diary to never gitignore DIARY.csv and added a legacy gitignore check. Added three new best practices: Wharton AI adoption principles, agent-native architecture, and prompts-as-installers.

**Next task:** Test the three new best practices in a repo with a bare CLAUDE.md. Bump plugin version. Sync the installed skill copies under `~/.claude/skills/` with the updated repo versions.

**Read first:** `skills/apply-claude-md-best-practices/practices/`, `skills/end-session-gracefully/SKILL.md`, `skills/start-session/SKILL.md`
