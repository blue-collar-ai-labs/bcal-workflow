---
name: start-session
description: "Present the previous session's handoff prompt from NEXT_SESSION.md and offer to run it or work on something else."
---

# start-session

Present the user with the previous session's handoff prompt so they can choose whether to run it or work on something else.

## Steps

### 1. Check for NEXT_SESSION.md

Look for `NEXT_SESSION.md` at the repo root. If it exists, read its contents. Parse the YAML frontmatter for `model` and `ended_at`. The body (after frontmatter) is the handoff prompt.

If `NEXT_SESSION.md` does not exist, say:

```
No previous session handoff found. What would you like to work on?
```

Then stop — skip the remaining steps.

### 2. Choose prompt

Show the handoff prompt body in a blockquote so the user can see what the previous session left behind. Include the model and ended_at from frontmatter if available (omit any that are missing or `unknown`).

Then use `AskUserQuestion` to present:

- **Use handoff prompt (Recommended)** — execute the suggested next-task prompt from the previous session
- **Something else** — tell me what you'd like to work on

**If the user chooses "Use handoff prompt"**, execute the handoff prompt body from `NEXT_SESSION.md` as if the user had pasted it.

**If the user chooses "Something else"**, wait for the user to describe their task, then proceed with it.

### 3. Plugin update reminder

If `NEXT_SESSION.md` existed (i.e., this is a returning user), append a one-liner after the menu completes:

```
Tip: Run /plugin to check for plugin updates.
```
