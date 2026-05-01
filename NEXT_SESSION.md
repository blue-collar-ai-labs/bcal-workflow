## Resume: bcal-workflow — Live Transcript Mode first real use

**Project:** bcal-workflow plugin (agent-agnostic workflow skills, bcal-agent-plugins marketplace). Connected to bcal-brain.

**Just completed:** Tested live-transcript skill end-to-end against real Notion transcripts. Discovered toggle markers can't bracket transcript content (lives inside `<meeting-notes><transcript>`). Rewrote skill to use subagent anchor-based extraction — protects main context window from 60-130KB transcript reads. Fuzzy matching handles Notion's transcription revisions. Connected repo to bcal-brain, promoted architecture lesson, marked plan complete.

**Next task:** First real use — invoke `/bcal-workflow:live-transcript` during an actual team call with a real question to discuss and synthesize. This validates the full workflow including synthesis quality and operator UX, not just plumbing.

**Read first:** `skills/live-transcript/SKILL.md`, `docs/solutions/architecture-patterns/notion-live-transcript-subagent-extraction-2026-05-01.md`
