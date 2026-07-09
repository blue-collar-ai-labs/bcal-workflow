---
resume_id: "f49349d3-4ce6-4e82-9aca-ac51dde8c9f7"
model: "Opus 4.8 (1M context)"
ended_at: "2026-07-09T20:27:00Z"
---

## bcal-workflow — release discipline is now mechanically enforced

**Project:** bcal-workflow plugin (agent-agnostic workflow skills, bcal-agent-plugins marketplace). Connected to bcal-brain.

**Just completed:** Shipped release-discipline enforcement. Both plugin manifests were unified onto one shared version (`1.0.0`), and a CI `version-guard` check (pure unit-tested rule in `.github/scripts/check-version-bump.mjs` + `.github/workflows/version-guard.yml`) now fails any PR that changes `skills/` or `hooks/` without bumping both manifests to the same new value. Squash/rebase merge are disabled; the check is a **required** status check on `main` with `strict` + `enforce_admins`. Verified end-to-end on a scratch PR. Also refreshed stale docs + README, and compounded the enforcement lesson to `docs/solutions/architecture-patterns/` and bcal-brain.

**Consequence to know:** `main` is now protected — **direct pushes are blocked; all changes go through a PR** (repo-only doc PRs pass `version-guard` automatically). Releases now require bumping **both** manifests to the same value.

**Next task (pick one):**
1. Exercise a real release: bump both manifests to `1.0.1` via a PR touching a skill, confirm the check passes and `/plugin update` detects it.
2. The local `.git/hooks/pre-commit` is now stale (checks only `skills/`, not `hooks/`, and only one manifest) and isn't version-controlled — decide whether to ship a hook-installer script or drop it in favor of CI.
3. Decide the fate of the two cited-but-missing docs (`no-squash-merge-versioned-plugin-release.md`, `institutional-learnings-must-be-conventions-2026-05-27.md`) — create or drop the references.

**Read first:** `CLAUDE.md`, `docs/solutions/architecture-patterns/enforce-institutional-rules-in-ci-not-prose.md`, `docs/plans/2026-07-09-002-feat-release-discipline-enforcement-plan.md`
