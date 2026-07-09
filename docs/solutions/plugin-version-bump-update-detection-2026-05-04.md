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

The cache directory is named after the version (e.g., `cache/bcal-agent-plugins/bcal-workflow/1.0.0/`), and the updater treats matching versions as "already up to date."

Codex works the same way against its own manifest. The plugin ships **two** manifests — `.claude-plugin/plugin.json` (Claude Code) and `.codex-plugin/plugin.json` (Codex) — that carry **one shared version**, bumped in lockstep to the same new value on every release. (They were previously versioned independently; both were reconciled to `1.0.0` when the unified-version rule was adopted.) A release that should reach both agents must bump both to the same new value.

## Solution

1. **Bump both manifests to the same new value whenever a `skills/` or `hooks/` change ships** — `.claude-plugin/plugin.json` and `.codex-plugin/plugin.json` must move together to one identical version string.
2. **A GitHub Actions check on PRs to `main` is the authoritative enforcement.** It fails any PR that changes a file under `skills/` or `hooks/` unless both manifest versions differ from the base branch and equal each other (`.github/workflows/version-guard.yml` + `.github/scripts/check-version-bump.mjs`). Squash- and rebase-merge are disabled so post-review commits cannot be folded under an already-installed version.
3. **A git `pre-commit` hook** (`.git/hooks/pre-commit`) is a machine-local early warning that blocks a commit touching `skills/` without a staged `plugin.json` change. It is secondary to the CI check: it matches either manifest, does not enforce bumping *both*, and — because `.git/hooks/` is not version-controlled — must be re-installed per clone. (An earlier attempt placed this guard in `.claude/settings.json` as a Claude Code hook, but Claude Code hooks do not gate git commits, so it was moved to a git `pre-commit` hook.)

## User Update Flow

1. `/plugins` → installed → bcal-workflow → **Update now** (fetches new version into cache)
2. `/reload-plugins` (loads new skills into the current session) — or restart the session
