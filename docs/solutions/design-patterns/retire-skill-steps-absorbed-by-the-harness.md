---
title: Retire skill steps the agent harness has absorbed
date: 2026-08-20
category: design-patterns
module: skill-authoring
problem_type: design_pattern
component: tooling
severity: medium
applies_when:
  - A skill step reproduces something the agent harness now does natively
  - Reviewing a skill written against an older generation of agent capabilities
  - A skill instructs the user to exit the session and run a CLI command
tags:
  - skill-authoring
  - skill-maintenance
  - harness-capabilities
  - dead-data-chains
  - simplification
---

# Retire skill steps the agent harness has absorbed

## Context

`start-session` opened with a two-part menu. The first part asked whether to start fresh or resume the previous session; choosing resume printed instructions to exit and run `claude --resume <id>`. That step was written when resuming a prior context window was something the user had to be walked through.

Claude Code and Codex now handle session resumption natively. The step had become a question the harness already answers better, placed in front of the thing the user actually came for — the handoff prompt.

Removing it was not a one-file edit. The step consumed a `resume_id` field, which `end-session-gracefully` had to produce, which required reading `CLAUDE_CODE_SESSION_ID` from the environment, which had its own documented convention for getting the shell syntax right. Deleting the step let the entire chain go: a menu step, a frontmatter field, an environment read, and the care required to keep that read correct.

## Guidance

Audit skills for steps the harness has since absorbed, and when removing one, follow its data upstream.

1. **Look for steps that instruct rather than act** — telling the user to exit and run a command, explaining a capability, or asking a question the platform now handles. These date fastest.
2. **Trace what the step consumed.** A removed step usually leaves a producer with no consumer: a frontmatter field nothing reads, a file nothing opens, an environment variable nothing needs. Follow the data to its source and remove the whole chain in one change.
3. **Delete rather than deprecate.** A step kept "just in case" still runs, still costs the user a decision, and still has to be maintained.
4. **Update what documented the chain.** Lessons and conventions captured about the removed mechanism are now historical. Mark them as such — the underlying convention often survives even when its example does not.

## Why This Matters

Skills accrete steps. Each one made sense when written, and none of them announce that the platform has caught up. The cost compounds twice: the user pays a decision on every invocation, and the maintainer carries the machinery that step needs — in this case a shell-specific environment read that was itself the subject of an earlier debugging session, kept alive for a field nothing consumed.

Following the chain upstream is what makes the removal worth doing. Deleting only the visible step leaves the producer intact, and dead data is worse than a dead step: it looks load-bearing to the next reader, who preserves it.

## When to Apply

- Reviewing a skill written against an older generation of agent capabilities
- When a step exists to explain a platform feature rather than do work
- When a skill's frontmatter or output contains fields no consumer reads
- After a harness release that absorbs functionality a skill implements by hand

## Examples

**Before** — the step, and the chain hanging off it:

```
start-session step 1        asks fresh vs. resume, prints `claude --resume <id>`
  reads                     resume_id in NEXT_SESSION.md frontmatter
    produced by             end-session-gracefully
      which required        a shell-specific CLAUDE_CODE_SESSION_ID read
```

**After** — the whole chain removed; `start-session` opens on the handoff prompt:

```
start-session               shows the handoff prompt, asks: use it, or something else
NEXT_SESSION.md             frontmatter is model + ended_at
end-session-gracefully      no session-ID discovery at all
```

Auditing question that surfaces these steps: *does this step still exist because the platform could not do it when the skill was written?*

## Related

- `docs/solutions/conventions/shell-specific-env-var-commands-2026-05-14.md` — the convention that governed the environment read this change deleted; the convention still holds, its example is now historical
- `docs/solutions/workflow-issues/plugin-cache-lags-the-source-repo-during-development.md` — releasing this change surfaced the cache lag
