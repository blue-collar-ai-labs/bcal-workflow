---
title: "feat: Add Live Transcript Mode skill"
type: feat
status: complete
date: 2026-05-01
origin: docs/brainstorms/live-transcript-mode-requirements.md
---

# feat: Add Live Transcript Mode skill

## Overview

Add a new `live-transcript` skill to the bcal-workflow plugin that lets an operator on a video call capture group discussion from a live Notion transcript and synthesize it into an answer. The skill is standalone, agent-agnostic, and works alongside any workflow or conversation.

---

## Problem Frame

During team video calls running AI-assisted workflows, the operator must manually synthesize group discussion into typed responses. This breaks the conversation flow and creates cognitive overhead. Live Transcript Mode eliminates this by reading the team's discussion directly from a live Notion transcript, synthesizing it, and presenting a clear answer the operator relays back.

(see origin: `docs/brainstorms/live-transcript-mode-requirements.md`)

---

## Requirements Trace

- R1. Search Notion for today's transcripts via MCP on first activation
- R2. Handle multiple, single, or zero transcript candidates
- R3. Cache transcript page ID for the session
- R4. Use collapsed toggle blocks as markers with structured labels
- R5. Write START marker immediately on activation
- R6. Write STOP marker when operator signals completion
- R7. Operator signals "done" by typing anything
- R8. Display "Listening..." indicator while capturing
- R9. Synthesize discussion into answer appropriate to the question type
- R10. Handle ambiguous discussion: summarize tensions, present options, offer re-discuss
- R11. Re-discuss re-enters the capture flow with a new START marker
- R12. Standalone skill, explicitly invoked, no menu injection
- R13. Not coupled to any specific workflow
- R14. Graceful exit when Notion MCP unavailable
- R15. All logic self-contained in bcal-workflow
- R16. Mediator pattern: capture question, manage transcript, return synthesized answer
- R17. Agent-agnostic: platform-specific question tools, open MCP standard
- R18. Persistent status indicator (printed message fallback)

**Origin actors:** A1 (Operator), A2 (Team members), A3 (Claude/skill agent), A4 (Notion MCP server)
**Origin flows:** F1 (Transcript connection), F2 (Live discussion capture), F3 (Ambiguous discussion resolution)
**Origin acceptance examples:** AE1 (covers R1, R2, R3), AE2 (covers R5, R6, R7, R9), AE3 (covers R10, R11), AE4 (covers R14)

---

## Scope Boundaries

- No silence-based timeout — always operator-triggered
- No multi-operator support
- No audio processing — text transcript only
- No transcript providers other than Notion in v1
- No automatic cleanup of markers after session
- No persistent transcript connections across sessions
- No modification to any third-party plugin
- No status line API integration — printed message fallback only

---

## Context & Research

### Relevant Code and Patterns

- `skills/notify-proof/SKILL.md` — best pattern to follow: structured steps, environment variable checks, error handling, JSON payload examples
- `skills/end-session-gracefully/SKILL.md` — multi-step procedural flow with conditional branching
- `skills/start-session/SKILL.md` — menu-driven user interaction pattern
- `skills/start-session/agents/openai.yaml` — agent interface definition pattern
- All existing skills use YAML frontmatter with `name` and `description`, then `## Steps` with numbered H3 subsections

### External References

- Notion API: Toggle blocks are collapsed by default. Created via `PATCH /v1/blocks/{page_id}/children` with `type: "toggle"` and `rich_text` content. No `collapsed` property — toggles render collapsed in the UI by default.
- Notion API: `POST /v1/search` supports partial title match. Filter by `object: "page"`, sort by `last_edited_time` descending. Returns pages whose titles contain the query string.
- Notion API: `GET /v1/blocks/{page_id}/children` is cursor-paginated. No range queries — must fetch all blocks and filter client-side by block ID to extract content between markers.
- Official Notion MCP server (`makenotion/notion-mcp-server`): Exposes `notion-search`, `notion-fetch`, `notion-update-page`, `notion-create-comment`, `notion-get-comments`. May not expose raw "append block children." The skill instructions must be written to work with whatever Notion MCP tools are available, or document the required tool set.

---

## Key Technical Decisions

- **Collapsed toggle blocks as markers:** Notion has no HTML comment or hidden block type. Toggle blocks are collapsed by default, making them effectively invisible in the transcript. The toggle's `rich_text` content holds the structured label (e.g., `LT:Q3:START`).
- **End-of-page append for markers:** Markers are appended to the end of the transcript page. Since the transcript grows downward and discussion is about the latest content, this is the natural position.
- **Client-side content extraction:** The Notion API has no range query for blocks and only supports forward cursor pagination (no reverse or tail-first reading). The skill fetches blocks from the page, filtering to those between the START and STOP marker block IDs. Since markers are near the end of the page, the agent should paginate forward and can optimize by caching the last-seen cursor position from prior reads in the same session.
- **STOP marker timing tolerance:** There is an inherent race between the operator signaling "done" and the STOP marker being written. Transcript content may continue arriving from the meeting bot during the MCP write round-trip. This is accepted as negligible (sub-second delay). The skill reads all content between START and STOP markers inclusive.
- **Pre-flight capability check:** Step 1 verifies both that a Notion MCP server is available AND that it can write blocks to a page. The first START marker write (Step 5) serves as the definitive capability test. If the write fails, the skill reports the required MCP capability and exits, similar to R14 handling.
- **Mid-flow error recovery:** If the STOP marker write fails (Step 7), the skill retries once. If still failing, it falls back to reading from the START marker to the end of the page, capturing all content after the discussion began. This degraded capture is better than losing the discussion entirely.
- **Printed message for status:** Skills cannot control the Claude Code status line. The skill prints "Live Transcript Mode active — connected to [page name]" after connection and on each subsequent invocation.
- **MCP tool names documented with intent fallback:** The skill instructions list the known tool names from the official Notion MCP server (`notion-search`, `notion-fetch`, `notion-update-page`) as defaults, with a note that alternative MCP servers may use different names. This gives agents concrete defaults while remaining compatible with other implementations.
- **Two distinct status messages:** "Live Transcript Mode active — connected to [page name]" prints after transcript connection (Step 3, R18). "Listening..." prints during active discussion capture (Step 6, R8). These are separate messages for separate moments — connection confirmation vs. capture-in-progress.
- **Block ID-based content extraction:** The skill uses the block IDs returned from the START and STOP marker write calls as boundary anchors. Content is extracted by fetching blocks and filtering to those between the two known IDs. This avoids ambiguity from content-matching approaches and handles re-discuss loops correctly since each Q_ID pair has unique block IDs.
- **Question counter maintained in conversation:** The sequential question ID (Q1, Q2, Q3...) is tracked in the agent's conversation context, not persisted to a file. It resets each session, which is fine since markers are self-identifying.

---

## Open Questions

### Resolved During Planning

- **Marker placement:** End of page. The transcript grows downward; markers at the end bracket the latest content.
- **Listening indicator:** Printed message. No status line API available to plugins.
- **Relay UX:** The skill presents the synthesized answer as text output. The operator reads it and provides it to the calling skill by typing, pasting, or reading aloud. No programmatic injection into other skills.
- **Date format in transcript titles:** The skill should try common date formats (e.g., "May 1", "2026-05-01", "5/1") when searching. The exact format depends on the meeting bot and will be learned on first use.

### Deferred to Implementation

- **MCP tool name variations:** The skill documents the official Notion MCP tool names (`notion-search`, `notion-fetch`, `notion-update-page`) as defaults. If the deployed MCP server uses different names, the agent adapts at runtime.
- **Pagination depth:** For very long transcripts, the agent may need to paginate through many blocks. The skill should cap content extraction at a practical limit (e.g., last 3 cursor pages before the STOP marker). If the START marker is not found within that range, report to the operator and ask for confirmation. The Notion API only supports forward pagination — no reverse or tail-first mode is available.

---

## Output Structure

```
skills/
└── live-transcript/
    ├── SKILL.md              # Full skill definition with steps
    └── agents/
        └── openai.yaml       # Codex agent interface
```

---

## Implementation Units

- U1. **Create SKILL.md**

**Goal:** Write the complete skill definition for `live-transcript` with all procedural steps covering transcript discovery, marker management, content capture, synthesis, and ambiguity resolution.

**Requirements:** R1–R18

**Dependencies:** None

**Files:**
- Create: `skills/live-transcript/SKILL.md`

**Approach:**
- YAML frontmatter with `name: live-transcript` and `description`
- Steps organized as numbered H3 subsections following existing skill patterns
- Step 1: Check for Notion MCP availability (R14). Verify the MCP server is reachable. If not available, report and exit. List known tool names (`notion-search`, `notion-fetch`, `notion-update-page`) as defaults with a note about alternative servers.
- Step 2: Transcript discovery (R1, R2, R3). Search for today's date. Handle multiple/single/zero results. Cache page ID in conversation context.
- Step 3: Confirm connection and print "Live Transcript Mode active — connected to [page name]" (R18). This is the connection confirmation message.
- Step 4: Capture question context (R16). Read or ask for the current question the team needs to discuss.
- Step 5: Write START marker (R4, R5). Append a collapsed toggle block with `LT:{Q_ID}:START` to the transcript page. Record the returned block ID. If the write fails, report the required MCP capability and exit (pre-flight capability test).
- Step 6: Display "Listening..." and wait (R7, R8). This is the capture-in-progress indicator, distinct from Step 3's connection message. Wait for any operator input.
- Step 7: Write STOP marker (R4, R6). Append a collapsed toggle block with `LT:{Q_ID}:STOP`. Record the returned block ID. If the write fails, retry once. If still failing, fall back to reading from START to end-of-page.
- Step 8: Read transcript content (R9). Fetch blocks between START and STOP marker block IDs (using the IDs recorded in Steps 5 and 7). Paginate forward through the page blocks. Cap extraction at a practical limit if the transcript is very long.
- Step 9: Synthesize answer (R9, R10, R11). Synthesize the discussion into an answer. If ambiguous, summarize tensions and present options including "Re-discuss." If re-discuss, loop back to Step 5 with a new Q_ID and new markers.
- Step 10: Present answer (R16). Display the synthesized answer clearly for the operator to relay.
- The skill instructions must use agent-agnostic language (R17): reference platform-specific question tools by convention
- Include a note that the skill can be invoked multiple times in a session — subsequent invocations skip discovery (R3, R13)
- R12 (standalone, no menu injection) and R15 (self-contained) are architectural constraints enforced by the SKILL.md structure itself — no menu hook declarations, no external plugin references

**Patterns to follow:**
- `skills/notify-proof/SKILL.md` for structured steps with error handling and JSON examples
- `skills/start-session/SKILL.md` for menu-driven interaction and conditional flow
- `skills/end-session-gracefully/SKILL.md` for multi-step procedural flow

**Test scenarios:**
- Happy path: First invocation discovers one transcript, connects, writes START marker, operator types "done", writes STOP marker, reads content, synthesizes clear answer
- Happy path: Second invocation in same session skips discovery, uses cached page ID
- Edge case: No Notion MCP available — skill reports requirement and exits gracefully
- Edge case: No transcripts found for today — skill reports and falls back to normal input
- Edge case: Multiple transcripts found — skill presents candidates for selection
- Edge case: Operator provides empty input as "done" signal — treated as valid completion signal
- Error path: Ambiguous discussion with disagreement — skill summarizes perspectives, presents options, includes re-discuss
- Error path: START marker write fails — skill reports MCP capability requirement and exits gracefully (pre-flight test)
- Error path: STOP marker write fails — skill retries once, then falls back to reading START-to-end-of-page
- Integration: Re-discuss selected — new START marker written with incremented Q_ID, capture flow re-enters from Step 5

**Verification:**
- SKILL.md follows the frontmatter + steps pattern of existing skills
- All 18 requirements are addressed: R1–R11 and R13–R18 in procedural steps; R12 (no menu injection) and R15 (self-contained) enforced by the SKILL.md structure itself
- Steps are procedural and precise enough for any agent to execute
- Known MCP tool names documented as defaults, with intent descriptions for compatibility
- Agent-agnostic language throughout
- "Live Transcript Mode active" (connection) and "Listening..." (capture) are clearly distinguished as separate messages

---

- U2. **Create Codex agent interface**

**Goal:** Add the openai.yaml for Codex compatibility.

**Requirements:** R17

**Dependencies:** U1

**Files:**
- Create: `skills/live-transcript/agents/openai.yaml`

**Approach:**
- Follow the exact pattern from `skills/start-session/agents/openai.yaml`
- `display_name`: "Live Transcript"
- `short_description`: "Capture group discussion from a live Notion transcript"
- `default_prompt`: "Use $live-transcript to capture the team's discussion."

**Patterns to follow:**
- `skills/start-session/agents/openai.yaml`
- `skills/end-session-gracefully/agents/openai.yaml`

**Test expectation:** none — pure config file, follows established pattern

**Verification:**
- YAML is valid and follows existing agent interface conventions

---

- U3. **Update README.md**

**Goal:** Add the `live-transcript` skill to the README's skill table and document any Notion MCP setup requirements.

**Requirements:** None (housekeeping — documents new skill and its prerequisites)

**Dependencies:** U1

**Files:**
- Modify: `README.md`

**Approach:**
- Add a row to the skills table: `live-transcript` | `/bcal-workflow:live-transcript` | description
- Add a "Prerequisites" or "Setup" note about the Notion MCP server requirement for this skill
- Keep the existing README structure and tone

**Patterns to follow:**
- Existing README skill table format

**Test expectation:** none — documentation update

**Verification:**
- New skill appears in the skills table
- Notion MCP requirement is documented
- Existing README content unchanged

---

## System-Wide Impact

- **Interaction graph:** The skill interacts with the Notion MCP server only. It does not touch other skills, plugins, or internal state. The operator is the bridge between this skill and any calling workflow.
- **Error propagation:** MCP failures (search fails, block append fails, read fails) are reported to the operator with clear messages. The skill never fails silently.
- **State lifecycle risks:** The only state is the cached transcript page ID and question counter, both held in conversation context. No file writes, no persistent state, no cleanup needed.
- **API surface parity:** No API changes. This is a new skill addition.
- **Unchanged invariants:** Existing skills (start-session, end-session-gracefully, write-to-diary, notify-proof) are not modified.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Notion MCP server may not expose "append block children" tool | Step 5's first START marker write serves as a capability test. If it fails, the skill exits with a clear message about the required capability. Known tool names are documented as defaults. |
| Toggle blocks may be visible enough to disrupt transcript readability | Toggles are collapsed by default and display only a small arrow. Acceptable tradeoff. Could use a neutral label like "·" if the marker text is too prominent. |
| Long transcripts may require many API calls to paginate | Forward pagination only (Notion API has no reverse mode). Cap at last 3 cursor pages. If START marker not found within that range, ask operator to confirm. |
| STOP marker write fails mid-flow | Retry once; if still failing, degrade to reading from START to end-of-page. Operator is informed of degraded capture. |
| Transcript naming pattern varies by meeting bot | Skill tries multiple date formats and falls back to asking the operator if search returns nothing. |

### Post-Implementation Pivot (2026-05-01)

Testing against real Notion transcripts revealed that the toggle-marker approach (R4, R5, R6) does not work as designed. Transcript content lives inside `<meeting-notes><transcript>` blocks, not as sibling blocks on the page. Markers appended to the page cannot bracket transcript content.

**Revised approach:** Anchor-based extraction with subagent isolation. A subagent reads the transcript at capture start and returns only the last line as an anchor. At capture end, a second subagent reads the transcript, finds the anchor via fuzzy matching, and returns only the delta. The main context window never sees the full transcript.

Key discoveries:
- `include_transcript: true` is required on `notion-fetch` — without it, Notion omits transcript content
- Notion revises transcription between reads, requiring fuzzy anchor matching (~10 words)
- A 1.5-hour transcript returns ~64KB; subagent isolation is essential for context window protection

See `docs/solutions/architecture-patterns/notion-live-transcript-subagent-extraction-2026-05-01.md` for the full lesson.

---

## Sources & References

- **Origin document:** [docs/brainstorms/live-transcript-mode-requirements.md](docs/brainstorms/live-transcript-mode-requirements.md)
- Notion API Block Reference: developers.notion.com/reference/block
- Notion API Search: developers.notion.com/reference/post-search
- Notion API Block Children: developers.notion.com/reference/get-block-children
- Official Notion MCP Server: github.com/makenotion/notion-mcp-server
