---
name: start-session
description: "Present a session-start menu: resume from NEXT_SESSION.md or start fresh."
---

# start-session

Present the user with a session-start menu so they can choose how to begin.

## Steps

### 1. Check for NEXT_SESSION.md

Look for `NEXT_SESSION.md` at the repo root. If it exists, read its contents.

### 2. Present the menu

If `NEXT_SESSION.md` exists, parse its YAML frontmatter for `session_name`, `model`, `context_pct`, and `ended_at`. Use the body (after frontmatter) as the resume prompt.

Present:

```
**Previous session: "<session_name>"**
<model> · <context_pct>% context used · ended <relative time, e.g. "18 hours ago">

1. **Resume with prompt** — start a fresh context window using the recommended handoff prompt below
2. **Something else** — tell me what you'd like to work on

Type 1 or 2 (or just describe your task).
```

Then show the handoff prompt body in a blockquote so the user can see what they'd be resuming.

If any frontmatter fields are missing or `unknown`, omit them from the status line rather than showing "unknown".

If `NEXT_SESSION.md` does not exist, say:

```
No previous session handoff found. What would you like to work on?
```

### 3. Act on the choice

- If the user picks **1**, execute the handoff prompt body from `NEXT_SESSION.md` as if the user had pasted it.
- If the user picks **2** or describes a task, proceed with that task.
- If the user just types a task description without picking a number, treat it as option 2.
