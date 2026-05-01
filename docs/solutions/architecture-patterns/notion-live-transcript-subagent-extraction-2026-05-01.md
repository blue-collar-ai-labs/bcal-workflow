---
title: Notion live transcript extraction requires subagent isolation and fuzzy anchoring
date: 2026-05-01
category: architecture-patterns
module: live-transcript
problem_type: architecture_pattern
component: tooling
severity: medium
applies_when:
  - Reading content from Notion live meeting transcripts via MCP
  - Building skills that capture portions of a long-running transcript
  - Protecting the main context window from large MCP tool results
tags:
  - notion-mcp
  - live-transcript
  - subagent
  - context-window
  - anchor-extraction
  - fuzzy-matching
---

# Notion live transcript extraction requires subagent isolation and fuzzy anchoring

## Context

The `live-transcript` skill needed to capture a team's spoken discussion from a Notion live transcript during a video call, extract only the portion spoken during a discussion window, and synthesize it into an answer. The original design used toggle-block markers (`<details><summary>LT:Q1:START</summary>`) written to the Notion page to bracket the discussion content.

Testing against real Notion transcripts revealed three architectural problems that required a complete redesign.

## Guidance

### 1. Transcript content lives inside `<meeting-notes><transcript>`, not as page siblings

Notion's live transcription writes all spoken content into a `<transcript>` block nested inside a `<meeting-notes>` element. Toggle blocks appended to the page appear *after* the meeting-notes block, not interspersed with transcript lines. Markers cannot bracket transcript content because they exist in a different block structure.

**Implication:** Any approach that writes markers to the page and tries to read content between them will find nothing. The transcript must be read from inside the `<transcript>` block directly.

### 2. The `include_transcript: true` flag is required

Fetching a Notion meeting-notes page without `include_transcript: true` returns a placeholder: `"Transcript omitted. Use the view tool..."`. The full transcript content is only returned when this flag is explicitly set.

```
// Returns transcript content
notion-fetch({ id: pageId, include_transcript: true })

// Returns placeholder only
notion-fetch({ id: pageId })
```

### 3. Use subagents to isolate transcript reads from the main context window

A 1.5-hour transcript returns ~64KB of text. Reading it directly into the main conversation burns context on content that isn't needed for synthesis. For 2+ hour calls, this becomes prohibitive.

**Solution:** Delegate all transcript reads to subagents. The subagent reads the full transcript but returns only the specific data needed:

- **Anchor subagent (at START):** Returns only the last line of the transcript (~100 chars)
- **Extraction subagent (at STOP):** Returns only the lines spoken after the anchor (the delta)

The main context window never sees the raw transcript — only the anchor and the discussion delta.

### 4. Use fuzzy matching for transcript anchors

Notion's live transcription continuously revises wording as it refines speech recognition. The last line recorded at START time may differ from what appears at STOP time.

Observed example:
- At START: `"...And I'm going to keep talking and you're done."`
- At STOP: `"...And I'm going to keep talking and you're going to like it."`

Match on the first ~10 words of the anchor rather than requiring an exact string match.

### 5. `notion-search` with `page_url` can search within transcript content

The `notion-search` tool accepts a `page_url` parameter to search within a specific page. It successfully finds text inside `<transcript>` blocks, returning highlight snippets. However, it only returns short highlights — not enough to extract the full discussion delta. Useful as a quick validation that the anchor exists before doing the expensive full fetch.

## Why This Matters

Without subagent isolation, every transcript read consumes 60-130KB of context (START + STOP reads). For a multi-question session on a long call, this quickly exhausts the context window and crowds out the actual work the operator is trying to do.

Without fuzzy anchoring, the extraction fails silently — the anchor string doesn't match, and the skill falls back to extracting the last third of the transcript, which may include irrelevant earlier discussion.

Without knowing about `include_transcript: true`, the skill appears broken — it connects to the page successfully but finds no transcript content.

## When to Apply

- Building any skill or workflow that reads Notion meeting transcripts
- Designing MCP-based tools where the raw tool result is much larger than the data actually needed
- Any scenario where a subagent can act as a context-window filter, reading large content and returning only an extracted subset

## Examples

**Subagent prompt for anchor capture:**
```
Fetch Notion page [PAGE_ID] with include_transcript: true. Report back ONLY:
1. The page title
2. Whether the transcript section exists and has content (yes/no)
3. The exact text of the LAST line in the <transcript> block
Do NOT return the full transcript.
```

**Subagent prompt for delta extraction:**
```
Page ID: [PAGE_ID]
Anchor line: "[ANCHOR_TEXT]"
Fetch the page with include_transcript: true. Find the anchor line using
fuzzy matching (first ~10 words). Return ONLY the text after the anchor.
Do NOT return the full transcript.
```

**What hits the main context window:**

| Step | Data in main context |
|------|---------------------|
| Anchor capture | Page title + 1 line (~100 chars) |
| Wait for discussion | Nothing |
| Delta extraction | Only the discussion text |
| Synthesis | Works on the delta already in context |

## Related

- `skills/live-transcript/SKILL.md` — the skill definition using this pattern
- `docs/plans/2026-05-01-001-feat-live-transcript-mode-plan.md` — original plan (toggle-marker approach, now superseded)
