---
name: live-transcript
description: "Capture group discussion from a live Notion transcript and synthesize it into an answer. Use during video calls when the team discusses a question aloud instead of typing."
---

# live-transcript

Read a team's live discussion from a Notion transcript, synthesize it, and return a clear answer the operator can relay to whatever workflow prompted the question.

## How it works

Notion's live transcription writes spoken content into a `<transcript>` block inside a `<meeting-notes>` element on the page. This content cannot be bracketed by external markers on the page — it lives in a separate block structure.

To avoid pulling a full multi-hour transcript into the main context window, this skill delegates all transcript reads to **subagents**. The main conversation only ever sees the anchor line and the extracted discussion delta — never the raw transcript.

**Anchor-based extraction:** A subagent snapshots the last line of the transcript when capture begins. When capture ends, a second subagent reads the transcript, finds the anchor, and returns only the new lines spoken during the discussion window.

## Steps

### 1. Check for Notion MCP availability

Look for a Notion MCP server in the current session. The official server exposes tools like `notion-search`, `notion-fetch`, and `notion-update-page`; other implementations may use different names.

If no Notion MCP tools are available, report:

```
Live Transcript Mode requires a Notion MCP server. No Notion MCP tools were detected in this session.

To set up:
1. Install a Notion MCP server (e.g., makenotion/notion-mcp-server)
2. Configure it in your MCP settings with a Notion API token
3. Restart your session
```

Then stop — do not proceed.

### 2. Discover the transcript

If a transcript page ID is already cached in conversation context from a prior invocation in this session, skip to Step 3.

Search Notion for today's transcripts. Try searching with the platform's Notion search tool using today's date as the query. Common title formats include:
- "May 1" / "May 01"
- "2026-05-01"
- "5/1/2026" / "5/1"

Filter results to pages only (not databases). Sort by last edited time, descending.

**If multiple transcript candidates are found:** Present them to the operator using the platform's question tool (`AskUserQuestion` in Claude Code, `request_user_input` in Codex, `ask_user` in Gemini) and let them pick.

**If exactly one candidate is found:** Auto-select it and confirm with the operator.

**If no candidates are found:** Report that no transcripts were found for today and ask the operator to provide the transcript page name or URL. If they cannot, exit gracefully — the operator can answer the question manually.

Cache the selected transcript page ID in conversation context for subsequent invocations.

### 3. Confirm connection and record anchor

Spawn a subagent to perform the initial transcript read. The subagent must:

1. Fetch the transcript page with `include_transcript: true` (required — without this flag, Notion omits transcript content).
2. Verify the page contains a `<meeting-notes>` block with a `<transcript>` section.
3. Return **only** the following to the main context:
   - The page title (for the connection confirmation)
   - Whether a `<transcript>` section exists and has content
   - The **last line** of the `<transcript>` block (this is the anchor)

The subagent prompt should be:

```
Fetch Notion page [PAGE_ID] with include_transcript: true. Look inside the
<meeting-notes> block for a <transcript> section. Report back ONLY:
1. The page title
2. Whether the transcript section exists and has content (yes/no)
3. The exact text of the LAST line in the <transcript> block (this will be
   used as an anchor — copy it exactly)

Do NOT return the full transcript. Only return these three items.
```

If the transcript section is empty or missing, inform the operator:

```
Connected to [page name], but no transcript content found yet. Is the recording active?
```

Print the connection confirmation:

```
Live Transcript Mode active — connected to [page name].
```

If this is a subsequent invocation (transcript was already cached), still print this confirmation so the team on the call sees that the connection is live.

Store the anchor line in conversation context. If the transcript was empty, record an empty anchor — all content that appears will be new.

### 4. Capture the question context

Increment the session's question counter (Q1, Q2, Q3...).

Read the current question from the conversation context — this is whatever question or prompt the operator is trying to answer. If the question is not obvious from context, ask the operator:

```
What question should the team discuss? Paste the question or describe it briefly.
```

### 5. Wait for discussion

Print the capture indicator:

```
Listening for Q{n}... (type anything when the discussion is done)
```

Wait for the operator to type any input. Any text — including just pressing enter — signals that the discussion is complete.

Do not implement a silence timeout. Always wait for explicit operator input.

### 6. Extract the discussion

Spawn a subagent to read the transcript and extract only the new content. The subagent must:

1. First, try `notion-search` with the `page_url` parameter set to the transcript page ID, using a distinctive phrase from the anchor line as the query. If this returns results that help locate the boundary without a full fetch, use them.
2. If search doesn't return usable transcript content, fetch the full page with `include_transcript: true`.
3. Find the anchor line in the transcript using **fuzzy matching**. Notion's live transcription continuously revises wording as it refines recognition, so the anchor text recorded at START may differ slightly from what appears at STOP. Match on the first ~10 words of the anchor rather than requiring an exact string match.
4. Extract everything **after** the anchor line.
5. Return **only** the extracted discussion text to the main context.

The subagent prompt should be:

```
I need you to extract new discussion content from a Notion transcript.

Page ID: [PAGE_ID]
Anchor line (marks where the discussion STARTED — extract everything AFTER this):
"[ANCHOR_TEXT]"

Strategy:
1. Try notion-search with page_url set to the page ID, querying for a
   distinctive phrase from the anchor line. If this helps locate the boundary
   without a full fetch, use it.
2. Otherwise, fetch the page with include_transcript: true.
3. Find the anchor line in the <transcript> block. Use FUZZY MATCHING — compare
   the first ~10 words of the anchor rather than requiring an exact string
   match. Notion's live transcription revises wording between reads, so the
   anchor text may have shifted slightly.
4. Return ONLY the text that appears AFTER the anchor line. Do NOT return any
   text before or including the anchor.
5. If the anchor is not found, return the last third of the transcript and
   note that the anchor was not found.
6. If no new content appears after the anchor, say so.

Do NOT return the full transcript. Only return the new discussion content.
```

**If the subagent reports the anchor was not found:** Inform the operator:

```
Could not find the exact starting point. Extracting recent discussion — please verify the content covers your discussion.
```

**If the subagent reports no new content:** Inform the operator:

```
No new transcript content detected since capture started. The team may need to speak, or the recording may have paused.
```

### 7. Synthesize the answer

Read the discussion text returned by the subagent in the context of the question from Step 4. Synthesize it into an answer appropriate to the question type:

- **Menu selection:** Identify which option the team chose and state it clearly.
- **Text response:** Compose a concise answer capturing the team's consensus.
- **Multiple decisions:** List each decision the team reached.

**If the discussion is ambiguous** — the team disagreed, the conversation wandered off-topic, or the response doesn't clearly map to the question:

1. Summarize the perspectives or tensions identified.
2. Present them as selectable options using the platform's question tool, including a "Re-discuss" option.
3. If the operator picks a perspective, use that as the answer.
4. If the operator picks "Re-discuss," return to Step 3 (re-record anchor from current transcript position) with a new question counter (e.g., Q2 if the original was Q1) to capture a new discussion.

### 8. Present the synthesized answer

Display the answer clearly so the operator can relay it to whatever prompted the question:

```
**Synthesized answer (Q{n}):**

[The answer, formatted appropriately for the question type]
```

The operator reads this and provides it to the calling skill or conversation by typing, pasting, or reading it aloud to the team.
