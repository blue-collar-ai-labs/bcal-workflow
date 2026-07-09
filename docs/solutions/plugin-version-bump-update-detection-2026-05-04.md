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

The cache directory is named after the version (e.g., `cache/bcal-agent-plugins/bcal-workflow/0.9.4/`), and the updater treats matching versions as "already up to date."

Codex works the same way against its own manifest. The plugin ships **two** manifests on independent version series — `.claude-plugin/plugin.json` (Claude Code, `0.9.x`) and `.codex-plugin/plugin.json` (Codex, `0.5.x`) — so a release that should reach both agents must bump both.

## Solution

1. **Bump the manifest version whenever releasing skill changes** — `.claude-plugin/plugin.json` for Claude Code and `.codex-plugin/plugin.json` for Codex, each in its own series. Bump both when the change affects both agents.
2. **A git `pre-commit` hook** (`.git/hooks/pre-commit`) blocks commits that touch `skills/` without also staging a `plugin.json` change, preventing accidental releases without a version bump. Two caveats: the hook matches either manifest (`plugin.json$`), so it catches a forgotten bump but does not enforce bumping *both*; and because `.git/hooks/` is not version-controlled, the hook is machine-local and must be re-installed per clone.

   (An earlier attempt placed this guard in `.claude/settings.json` as a Claude Code hook, but Claude Code hooks do not gate git commits, so it was moved to a git `pre-commit` hook.)

## User Update Flow

1. `/plugins` → installed → bcal-workflow → **Update now** (fetches new version into cache)
2. `/reload-plugins` (loads new skills into the current session) — or restart the session
