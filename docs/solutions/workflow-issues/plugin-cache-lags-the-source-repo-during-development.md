---
title: A plugin's own repo edits do not reach the session running that plugin
date: 2026-08-20
category: workflow-issues
module: plugin-distribution
problem_type: workflow_issue
component: tooling
severity: medium
applies_when:
  - Working inside the repo of a plugin that is also installed and running in the session
  - A skill was just edited or released and the agent invokes that same skill
  - Skill behavior does not match the SKILL.md visible in the working tree
tags:
  - plugin-development
  - plugin-cache
  - stale-instructions
  - self-shipping-plugin
  - skill-authoring
---

# A plugin's own repo edits do not reach the session running that plugin

## Context

`bcal-workflow` is a plugin whose repo ships the skills the session is using. During one session we removed the `resume_id` step from `end-session-gracefully`, merged it to `main` as version 1.1.0, and confirmed the marketplace was serving the new version.

Minutes later, invoking `/bcal-workflow:end-session-gracefully` loaded the skill from the installed plugin cache at version 1.0.0 — the pre-change copy, which still instructed the agent to write `resume_id` and to read `CLAUDE_CODE_SESSION_ID`. The working tree said one thing; the instructions the agent actually received said another.

Nothing was broken. The plugin system was behaving correctly: an installed plugin runs from its cached copy and only changes when the user updates it. The trap is specific to editing a plugin from inside a session that is running that same plugin — the source of truth for *authoring* and the source of truth for *execution* are two different files, and the second one lags by at least one release.

## Guidance

When working inside a plugin's own repo, treat the repo working tree as authoritative for skill behavior and the loaded instructions as potentially stale.

1. **Read the skill from the repo, not from what was loaded.** If a skill definition was changed this session, open `skills/<name>/SKILL.md` in the working tree before following the instructions that arrived with the invocation.
2. **Say so out loud when they disagree.** A silent choice between two versions of an instruction is invisible to the user and unreviewable afterward.
3. **Run a plugin update before trusting a just-released skill.** After a release lands, `/plugin` refreshes the cache. Until then, the session keeps executing the old copy.
4. **Expect the lag by construction.** A plugin that ships the skills used to develop it is always one update behind its own source. This is not a bug to fix; it is a property to remember.

## Why This Matters

The failure is silent and self-consistent. The stale skill produces plausible output that follows its own older contract, so nothing errors and nothing looks wrong. In this case the stale copy would have written a `resume_id` field into `NEXT_SESSION.md` that the current `start-session` no longer reads — quietly reintroducing the exact field the session had just finished removing, into the file that carries context to the next session.

The blast radius grows with how self-referential the plugin is. Session-lifecycle skills are the worst case: they run at the boundaries of every session, and their output is the input to the next one, so a stale copy propagates its old contract forward.

## When to Apply

- Any session that edits a skill or hook belonging to a plugin installed in that same session
- Immediately after merging a plugin release, when the temptation to exercise the new behavior is highest
- When a skill's observed behavior contradicts the SKILL.md in the working tree
- When reviewing agent output that followed skill instructions — check which version those instructions came from

## Examples

The version actually executing, versus the version on disk:

```
loaded  ~/.claude/plugins/cache/bcal-agent-plugins/bcal-workflow/1.0.0/skills/end-session-gracefully/SKILL.md
source  ./skills/end-session-gracefully/SKILL.md          # repo at 1.1.0, resume_id removed
```

The stale copy's instruction, still live in the running session:

```
resume_id: "<session ID that claude --resume accepts>"

**Finding the resume ID:** The Claude Code harness sets CLAUDE_CODE_SESSION_ID ...
```

The repo's actual 1.1.0 contract, which is the one to follow:

```
model: "<full model description>"
ended_at: "<ISO 8601 timestamp>"
```

## Related

- `docs/solutions/workflow-issues/standalone-to-plugin-skill-migration-orphans-2026-05-14.md` — the other way a stale skill wins. That is an orphan standalone copy shadowing the plugin; this is the plugin's own cache lagging the repo you are editing. Same symptom, different mechanism, different fix.
- `docs/solutions/design-patterns/retire-skill-steps-absorbed-by-the-harness.md` — the change that exposed this lag
