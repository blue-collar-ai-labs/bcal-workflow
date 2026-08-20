---
model: "Opus 5"
ended_at: "2026-08-20T15:20:00Z"
---

## bcal-workflow — start-session simplified, shipped as 1.1.0

**Project:** bcal-workflow plugin (agent-agnostic workflow skills, bcal-agent-plugins marketplace). Connected to bcal-brain.

**Just completed:** Removed `start-session`'s first menu step (fresh vs. resume a previous context window) — Claude Code and Codex resume natively now. Followed the dead data upstream: `end-session-gracefully` no longer writes `resume_id` or reads `CLAUDE_CODE_SESSION_ID`. Released as **1.1.0** via a lockstep manifest bump and a green `version-guard` PR, which also closed out the "exercise a real release" item from last session. Compounded two lessons to `docs/solutions/`, seeded release/distribution and session-lifecycle terms in `CONCEPTS.md`, and pruned all merged branches (`main` is the only branch on the remote).

**Know before you edit a skill:** this repo ships the skills your session is running, so an invoked skill executes the *installed cached copy*, not the working tree. Follow `skills/<name>/SKILL.md` in the repo and run `/plugin` after a release.

**Next task (pick one):**
1. Decide the fate of two cited-but-missing docs: `no-squash-merge-versioned-plugin-release.md` and `institutional-learnings-must-be-conventions-2026-05-27.md` — create them or drop the references.
2. Consolidation review of the two overlapping stale-skill docs: `workflow-issues/standalone-to-plugin-skill-migration-orphans-2026-05-14.md` and the new `workflow-issues/plugin-cache-lags-the-source-repo-during-development.md` (`/ce-compound-refresh plugin-distribution`).

**Read first:** `CLAUDE.md`, `CONCEPTS.md`, `docs/solutions/workflow-issues/plugin-cache-lags-the-source-repo-during-development.md`
