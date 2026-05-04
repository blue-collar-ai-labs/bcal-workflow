---
name: end-session-gracefully
description: "Wrap up an AI coding-agent session cleanly: update durable project status, record the session, commit and push changes when appropriate, and draft a tight next-session prompt the user can paste to resume."
---

# end-session-gracefully

This skill wraps up an AI coding-agent session cleanly.

## Steps

### 1. Update durable project status

Update the repository's durable project-status or agent-instructions artifact with learnings from this session.

Use the current agent's native closeout/status workflow when one exists:
- In Claude Code, invoke the project status or `CLAUDE.md` revision skill if available.
- In Codex, use the repo's project closeout/status convention if available, or update the relevant durable file directly.

Prefer existing repo conventions. Common targets include `AGENTS.md`, `CLAUDE.md`, `PROJECT_STATUS.md`, `docs/status/`, or a plan file with active checkboxes.

### 2. Write to diary

Record what was accomplished this session using the current agent's available diary or session-note mechanism.

Use `write-to-diary` when that skill is available. Otherwise, append a concise session note to the repo's established diary/status file, or ask the user where session notes should live if the repo has no convention.

### 3. Commit and push

Inspect the working tree, separate unrelated user changes from session changes, then stage only the files that belong to this session. Commit with a short, descriptive message summarizing the completed work. Push to the current branch when the user has asked for push behavior or the repo's closeout convention requires it.

Use this commit format:
```
<one-line summary of session work>

<agent attribution line if required by the current repo or tool>
```

Use the current agent's normal attribution format when the repo requires one. Do not invent a Claude-specific co-author line when the session was not run by Claude.

### 4. Check for pending Proof reviews

Scan the current conversation for `proofeditor.ai` URLs (format: `https://www.proofeditor.ai/d/{slug}?token={token}`). If none exist, skip to step 5.

If at least one Proof link exists, take the **most recent** one and:

1. Parse the `slug` and `token` from the URL.
2. Fetch the document state:
   ```
   GET https://www.proofeditor.ai/api/agent/{slug}/state
   Header: x-share-token: {token}
   ```
3. From the response, count unresolved marks — entries in `marks` where `resolved` is `false`. Categorize by type (comments, suggestions).
4. Identify the local file path that was sent to Proof during this session (look for the file read or referenced immediately before the Proof share in conversation context).

Carry the following forward to step 5:
- The full Proof URL (including the `?token=` parameter)
- A one-line description of the document
- The repo-relative path of the local source file
- Counts of unresolved comments and suggestions (if any)

### 5. Write the next-session prompt

Craft a tight, self-contained prompt the user can paste at the start of their next session. It should:
- Remind the next agent of the project (name, purpose, current phase)
- State what was just accomplished
- Name the specific next task or decision to tackle
- Reference any key files the next agent should read first (e.g., `AGENTS.md`, `CLAUDE.md`, relevant proposal docs)

Keep it under 150 words (excluding the Proof section below).

**If step 4 produced Proof review data**, append a `## Pending Proof Review` section to NEXT_SESSION.md:

```
## Pending Proof Review
- **Link:** <full proofeditor.ai URL with token>
- **Local file:** <repo-relative path>
- **Description:** <one-line description of the document>
- **Unresolved:** <N comments, M suggestions — or "None" if all resolved>
```

Write the prompt to `NEXT_SESSION.md` at the repo root. Overwrite any existing content — this file always reflects the most recent session. Also present it in a code block in the conversation so the user can act on it immediately.

Include `NEXT_SESSION.md` in the commit from step 3.
