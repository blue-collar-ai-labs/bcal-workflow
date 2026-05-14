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

### 4. Offer to compound lessons

Ask the user: "Want to look for any lessons worth compounding from this session?"

If the user says **yes**:

1. Review the session for compoundable insights — bugs solved, architecture decisions, patterns discovered, non-obvious fixes, or workflow improvements.
2. Present a brief list of candidates (one line each). If none are found, say so and move on.
3. If the user selects any, invoke `/ce-compound` for each selected lesson.
4. If the repo has a `.brain-config`, ask whether to commit any compounded lessons to the configured brain using `/send-to-brain`.

If the user says **no** or declines, move on without further prompting.

### 5. Check for pending Proof reviews

Scan the current conversation for `proofeditor.ai` URLs (format: `https://www.proofeditor.ai/d/{slug}?token={token}`). If none exist, skip to step 6.

If at least one Proof link exists, take the **most recent** one and:

1. Parse the `slug` and `token` from the URL.
2. Fetch the document state:
   ```
   GET https://www.proofeditor.ai/api/agent/{slug}/state
   Header: x-share-token: {token}
   ```
3. From the response, count unresolved marks — entries in `marks` where `resolved` is `false`. Categorize by type (comments, suggestions).
4. Identify the local file path that was sent to Proof during this session (look for the file read or referenced immediately before the Proof share in conversation context).

Carry the following forward to step 6:
- The full Proof URL (including the `?token=` parameter)
- A one-line description of the document
- The repo-relative path of the local source file
- Counts of unresolved comments and suggestions (if any)

### 6. Write the next-session prompt

Write `NEXT_SESSION.md` at the repo root. Overwrite any existing content — this file always reflects the most recent session.

#### Frontmatter

`NEXT_SESSION.md` has YAML frontmatter that `start-session` reads to present the session-start menu. Include these fields:

```yaml
---
resume_id: "<session ID that claude --resume accepts>"
model: "<full model description, e.g. 'Opus 4.6 (1M context)'>"
ended_at: "<ISO 8601 timestamp, e.g. 2026-05-14T18:30:00Z>"
---
```

**Finding the resume ID:** The Claude Code harness sets `CLAUDE_CODE_SESSION_ID` in the child process environment. Read it with the correct syntax for the shell you're using:

- **Bash tool:** `printenv CLAUDE_CODE_SESSION_ID`
- **PowerShell tool:** `$env:CLAUDE_CODE_SESSION_ID`

Do not mix syntaxes (e.g., `$env:` in Bash will silently fail). If the variable is empty or unset, omit `resume_id` rather than guessing.

Do not include `session_name` or `context_pct` — these are not reliably available and fabricated values are worse than no values. Only include fields you can report accurately. If `model` or `ended_at` are unavailable, omit them rather than writing `unknown`.

#### Body

Craft a tight, self-contained prompt the user can paste at the start of their next session. It should:
- Remind the next agent of the project (name, purpose, current phase)
- State what was just accomplished
- Name the specific next task or decision to tackle
- Reference any key files the next agent should read first (e.g., `AGENTS.md`, `CLAUDE.md`, relevant proposal docs)

Keep it under 150 words (excluding the Proof section below).

**If step 5 produced Proof review data**, append a `## Pending Proof Review` section:

```
## Pending Proof Review
- **Link:** <full proofeditor.ai URL with token>
- **Local file:** <repo-relative path>
- **Description:** <one-line description of the document>
- **Unresolved:** <N comments, M suggestions — or "None" if all resolved>
```

Also present the full file (frontmatter + body) in a code block in the conversation so the user can act on it immediately.

Include `NEXT_SESSION.md` in the commit from step 3.
