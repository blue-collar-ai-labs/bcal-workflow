## Resume: bcal-workflow — test new skill, plan next practices

**Project:** bcal-workflow plugin (agent-agnostic workflow skills, bcal-agent-plugins marketplace). Connected to bcal-brain.

**Just completed:** Set up Slack bot credentials and verified notify-proof and notify-pdf end-to-end. Migrated notify-pdf to Slack's three-step upload API (files.upload was deprecated). Built `apply-claude-md-best-practices` skill with Wharton-informed UX — walks users through curated CLAUDE.md practices one at a time. Added lesson compounding step to end-session-gracefully. Bumped to 0.5.0.

**Next task:** Test `apply-claude-md-best-practices` in a repo with a bare CLAUDE.md (this repo already has both practices, so they'll be skipped). Then brainstorm additional practices to add to the catalog. Also consider whether the skill should create CLAUDE.md from scratch if one doesn't exist.

**Read first:** `skills/apply-claude-md-best-practices/SKILL.md`, `skills/apply-claude-md-best-practices/practices/`
