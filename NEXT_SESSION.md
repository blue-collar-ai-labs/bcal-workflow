## Resume: bcal-workflow — plugin v0.3.0 shipped

**Project:** bcal-workflow plugin (agent-agnostic workflow skills, bcal-agent-plugins marketplace). Connected to bcal-brain.

**Just completed:** Fixed /doctor warning — moved version-bump guard from invalid Claude Code hook to native git pre-commit hook. Enhanced end-session-gracefully to fetch Proof API state and surface pending reviews in NEXT_SESSION.md. Plugin bumped to 0.3.0.

**Next task:** The cached plugin version is still 0.2.0 (visible in the skill base directory path). Verify the plugin update mechanism picks up 0.3.0 on next install/refresh. Also: first real use of `/bcal-workflow:live-transcript` during a team call remains pending.

**Read first:** `skills/end-session-gracefully/SKILL.md`, `CLAUDE.md`
