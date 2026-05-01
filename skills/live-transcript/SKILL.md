---
name: live-transcript
description: "Capture group discussion from a live Notion transcript and synthesize it into an answer. Use during video calls when the team discusses a question aloud instead of typing."
---

# live-transcript

Read a team's live discussion from a Notion transcript, synthesize it, and return a clear answer the operator can relay to whatever workflow prompted the question.

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

### 3. Confirm connection

Print the connection confirmation:

```
Live Transcript Mode active — connected to [page name].
```

If this is a subsequent invocation (transcript was already cached), still print this confirmation so the team on the call sees that the connection is live.

### 4. Capture the question context

Read the current question from the conversation context — this is whatever question or prompt the operator is trying to answer. If the question is not obvious from context, ask the operator:

```
What question should the team discuss? Paste the question or describe it briefly.
```

### 5. Write the START marker

Increment the session's question counter (Q1, Q2, Q3...).

Append a collapsed toggle block to the end of the transcript page using the Notion MCP. The toggle's title text should be:

```
LT:{Q_ID}:START
```

For example: `LT:Q1:START`

Record the block ID returned by the write operation — this is needed in Step 8 to identify the content boundary.

**If the write fails:** This is the capability test. Report:

```
Live Transcript Mode requires the ability to write blocks to Notion pages.
The current Notion MCP server does not appear to support this operation.
```

Then stop — do not proceed.

### 6. Wait for discussion

Print the capture indicator:

```
Listening... (type anything when the discussion is done)
```

Wait for the operator to type any input. Any text — including just pressing enter — signals that the discussion is complete.

Do not implement a silence timeout. Always wait for explicit operator input.

### 7. Write the STOP marker

Append a collapsed toggle block to the end of the transcript page. The toggle's title text should be:

```
LT:{Q_ID}:STOP
```

For example: `LT:Q1:STOP`

Record the block ID returned by the write operation.

**If the write fails:** Retry once. If still failing, proceed to Step 8 using a degraded capture — read from the START marker to the end of the page. Inform the operator:

```
STOP marker write failed. Reading from the start of your discussion to the end of the transcript instead.
```

### 8. Read the transcript content

Fetch the blocks from the transcript page using the Notion MCP. Use the block IDs from Steps 5 and 7 as boundaries:

- Start reading from the block after the START marker block ID
- Stop reading at the block before the STOP marker block ID
- If using degraded capture (STOP marker failed), read from the START marker to the end of the page

The Notion API paginates blocks with a cursor. Paginate forward through the results. For very long transcripts, cap extraction at 3 cursor pages of results. If the START marker is not found within that range, ask the operator to confirm the correct transcript page.

Extract the text content from each block between the markers. Combine into a single text representing the team's discussion.

### 9. Synthesize the answer

Read the discussion text in the context of the question from Step 4. Synthesize it into an answer appropriate to the question type:

- **Menu selection:** Identify which option the team chose and state it clearly.
- **Text response:** Compose a concise answer capturing the team's consensus.
- **Multiple decisions:** List each decision the team reached.

**If the discussion is ambiguous** — the team disagreed, the conversation wandered off-topic, or the response doesn't clearly map to the question:

1. Summarize the perspectives or tensions identified.
2. Present them as selectable options using the platform's question tool, including a "Re-discuss" option.
3. If the operator picks a perspective, use that as the answer.
4. If the operator picks "Re-discuss," return to Step 5 with a new question counter (e.g., Q2 if the original was Q1) to write fresh markers and capture a new discussion.

### 10. Present the synthesized answer

Display the answer clearly so the operator can relay it to whatever prompted the question:

```
**Synthesized answer:**

[The answer, formatted appropriately for the question type]
```

The operator reads this and provides it to the calling skill or conversation by typing, pasting, or reading it aloud to the team.
