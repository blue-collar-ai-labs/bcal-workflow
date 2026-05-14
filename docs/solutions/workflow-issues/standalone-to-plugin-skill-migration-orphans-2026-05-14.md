---
title: Standalone-to-plugin skill migration leaves orphan copies
date: 2026-05-14
category: workflow-issues
module: plugin-distribution
problem_type: workflow_issue
component: tooling
severity: medium
applies_when:
  - Skills previously installed as standalone directories under ~/.claude/skills/ are migrated into a plugin
  - A plugin update via /plugin or /reload-plugins does not remove stale standalone copies
  - Users see duplicate skills in the skill list (unprefixed and plugin-prefixed versions)
tags:
  - plugin-migration
  - orphan-skills
  - standalone-skills
  - skill-distribution
  - plugin-update
---

# Standalone-to-plugin skill migration leaves orphan copies

## Context

Skills in the bcal-workflow plugin were originally installed as standalone directories under `~/.claude/skills/<skill-name>/` (via braintrust `register` or manual copy). When these skills moved into a plugin distributed through the bcal-agent-plugins marketplace, the old standalone copies were not removed. The plugin update system (`/plugin`, `/reload-plugins`) only manages plugin-prefixed skills (`bcal-workflow:start-session`) — it has no knowledge of standalone copies installed by a different mechanism.

This was discovered when `/start` loaded the old single-step start-session menu instead of the redesigned two-step version that had already been committed and pushed to the plugin repo.

## Guidance

After migrating skills from standalone installation to plugin distribution, manually remove the old standalone directories:

```powershell
Remove-Item -Recurse -Force "$env:USERPROFILE\.claude\skills\start-session"
Remove-Item -Recurse -Force "$env:USERPROFILE\.claude\skills\end-session-gracefully"
Remove-Item -Recurse -Force "$env:USERPROFILE\.claude\skills\write-to-diary"
```

Then run `/reload-plugins` to confirm only the plugin-prefixed versions remain.

To detect orphans, compare `~/.claude/skills/` contents against the plugin's skill list. Any standalone directory whose name matches a plugin-delivered skill is likely an orphan.

## Why This Matters

The standalone (stale) version can shadow the plugin (current) version without any visible error. The user runs outdated skill logic and may not realize it until behavior doesn't match expectations. The plugin update system provides no warning because it doesn't track standalone copies.

## When to Apply

- When migrating skills from any standalone installation mechanism (braintrust `register`, manual copy, symlink) into a plugin
- When a user reports that a skill behaves differently than expected after a plugin update
- When the skill list shows both `skill-name` and `plugin:skill-name` entries for the same skill

## Examples

**Before** — duplicate skills in the list:
```
start-session                    # standalone orphan (stale)
bcal-workflow:start-session      # plugin version (current)
```

**After cleanup** — only plugin version remains:
```
bcal-workflow:start-session      # plugin version (current)
```

## Related

- Brain lesson: `vault/lessons/lesson-2026-05-12-skill-manifest-enables-clean-removal-on-upgrade.md` — covers braintrust `register` orphans via manifest tracking, a complementary but different mechanism
- `docs/solutions/plugin-version-bump-update-detection-2026-05-04.md` — related plugin versioning lesson
