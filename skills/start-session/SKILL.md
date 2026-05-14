---
name: start-session
description: "Present a session-start menu: resume from NEXT_SESSION.md or start fresh."
---

# start-session

Present the user with a session-start menu so they can choose how to begin. The menu has two steps: first choose the context window (fresh or resume), then choose the prompt (handoff or custom).

## Steps

### 1. Check for NEXT_SESSION.md

Look for `NEXT_SESSION.md` at the repo root. If it exists, read its contents. Parse the YAML frontmatter for `resume_id`, `model`, and `ended_at`. The body (after frontmatter) is the handoff prompt.

If `NEXT_SESSION.md` does not exist, say:

```
No previous session handoff found. What would you like to work on?
```

Then stop — skip the remaining steps.

### 2. Step 1 — Choose context window

Show the handoff prompt body in a blockquote so the user can see what the previous session left behind. Include the model and ended_at from frontmatter if available (omit any that are missing or `unknown`).

Then use `AskUserQuestion` to present:

- **Start fresh here (Recommended)** — begin a new session using the handoff summary above for context
- **Resume previous session** — reopen the old session with its full conversation history

"Fresh" is the recommended default because it avoids stale context and starts clean.

**If the user chooses "Resume previous session":**

If `resume_id` exists in frontmatter, show:

```
To resume with the previous context window, exit and run:

  claude --resume <resume_id>

You can paste the handoff prompt above once the session loads, or start with your own task.
```

Then stop — the user needs to exit this session to resume the old one.

If `resume_id` is missing, say:

```
The previous session didn't record a resume ID. You can check recent sessions with `claude --list` and resume one manually. Or continue here with a fresh start.
```

Then fall through to Step 2.

### 3. Step 2 — Choose prompt

Use `AskUserQuestion` to present:

- **Use handoff prompt (Recommended)** — execute the suggested next-task prompt from the previous session
- **Something else** — tell me what you'd like to work on

**If the user chooses "Use handoff prompt"**, execute the handoff prompt body from `NEXT_SESSION.md` as if the user had pasted it.

**If the user chooses "Something else"**, wait for the user to describe their task, then proceed with it.

### 4. Plugin update reminder

If `NEXT_SESSION.md` existed (i.e., this is a returning user), append a one-liner after the menu completes:

```
Tip: Run /plugin to check for plugin updates.
```
