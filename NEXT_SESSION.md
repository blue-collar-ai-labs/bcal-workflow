## Resume: bcal-workflow — Live Transcript first real use

**Project:** bcal-workflow plugin (agent-agnostic workflow skills, bcal-agent-plugins marketplace). Connected to bcal-brain.

**Just completed:** Fixed plugin update detection — updater compares version strings, not git SHAs. Bumped to 0.2.0, confirmed the update flow works. Added a pre-commit hook in `.claude/settings.json` that blocks skill changes without a version bump. Documented and promoted to bcal-brain.

**Next task:** First real use of `/bcal-workflow:live-transcript` during an actual team call. This validates synthesis quality and operator UX end-to-end. Also consider whether the version bump hook should auto-increment the patch version instead of just blocking.

**Read first:** `skills/live-transcript/SKILL.md`, `docs/solutions/plugin-version-bump-update-detection-2026-05-04.md`
