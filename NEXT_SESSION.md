---
session_name: "hungry-fox-17"
model: "Opus 4.6 (1M context)"
context_pct: 25
ended_at: "2026-05-14T13:55:00Z"
---

## Resume: bcal-workflow — test updates, sync installed skills

**Project:** bcal-workflow plugin (agent-agnostic workflow skills, bcal-agent-plugins marketplace). Connected to bcal-brain.

**Just completed:** Formalized the NEXT_SESSION.md contract between end-session-gracefully and start-session using YAML frontmatter (session_name, model, context_pct, ended_at). Start-session now shows previous session metadata and checks for BCAL marketplace plugin updates. Fixed write-to-diary to never gitignore DIARY.csv. Added three new best practices to apply-claude-md-best-practices: Wharton AI adoption, agent-native architecture, and prompts-as-installers. Now at v0.7.0.

**Next task:** Test start-session's new menu format and plugin update check. Test the three new best practices in a repo with a bare CLAUDE.md. Sync installed skill copies under `~/.claude/skills/` with updated repo versions (run `/plugins` to update).

**Read first:** `skills/start-session/SKILL.md`, `skills/end-session-gracefully/SKILL.md`, `skills/apply-claude-md-best-practices/practices/`
