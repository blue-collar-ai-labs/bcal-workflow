## Resume: bcal-workflow — Live Transcript Mode testing

**Project:** bcal-workflow plugin (agent-agnostic workflow skills, bcal-agent-plugins marketplace)

**Just completed:** Brainstormed, planned, and shipped the `live-transcript` skill (PR #1, merged to main). Installed Notion MCP server globally via `claude mcp add --transport http --scope user notion https://mcp.notion.com/mcp`.

**Next task:** Test `/bcal-workflow:live-transcript` end-to-end with a live Notion transcript. The critical first test is whether the Notion MCP can write toggle blocks — invoke the skill, let it find a transcript, and verify the START marker write succeeds. If the write fails, investigate alternative MCP tools or a different Notion MCP server.

**Read first:** `skills/live-transcript/SKILL.md`, `docs/plans/2026-05-01-001-feat-live-transcript-mode-plan.md` (Risks & Dependencies section)
