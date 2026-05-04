---
module: bcal-workflow
tags: [plugin, versioning, update-detection, hooks]
problem_type: infrastructure
---

# Plugin Version Bump Required for Update Detection

## Problem

After adding new skills or modifying existing ones, users running "Update now" from `/plugins` → installed → bcal-workflow saw no update. The plugin cache remained stale even though new commits were pushed to GitHub.

## Root Cause

The Claude Code plugin update mechanism compares the `version` field in `.claude-plugin/plugin.json` between the installed cache and the remote repository. If the version string is unchanged, no update is fetched — regardless of how many commits exist between the installed SHA and remote HEAD.

The cache directory is named after the version (e.g., `cache/bcal-agent-plugins/bcal-workflow/0.1.0/`), and the updater treats matching versions as "already up to date."

## Solution

1. **Bump the version in `.claude-plugin/plugin.json`** whenever releasing skill changes.
2. **Pre-commit hook** in `.claude/settings.json` blocks commits that change files under `skills/` without also changing `plugin.json`, preventing accidental releases without a version bump.

## User Update Flow

1. `/plugins` → installed → bcal-workflow → **Update now** (fetches new version into cache)
2. `/reload-plugins` (loads new skills into the current session) — or restart the session
