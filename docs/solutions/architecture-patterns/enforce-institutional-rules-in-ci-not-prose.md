---
title: Enforce Non-Negotiable Rules in CI and Branch Protection, Not Prose
date: 2026-07-09
category: architecture-patterns
module: release-workflow
problem_type: architecture_pattern
component: ci
severity: high
applies_when:
  - "a written rule in CLAUDE.md/AGENTS.md keeps getting violated despite being documented"
  - "a rule must never be bypassed and its violation ships silently (reaches users)"
  - "deciding where an institutional rule should live: prose vs hook vs CI vs branch protection"
  - "building a CI check that gates on which files changed vs whether a required change accompanied them"
  - "making a CI check actually block merge rather than just report red"
tags: [ci-enforcement, branch-protection, github-actions, release-discipline, mechanical-enforcement, required-status-check, prose-rules-fail, defense-in-depth]
related_components:
  - development_workflow
  - documentation
---

# Enforce Non-Negotiable Rules in CI and Branch Protection, Not Prose

## Context

A rule lived in `CLAUDE.md`: when shipping a plugin change, bump the manifest version so `/plugin update` detects the release. It was violated **twice** — once by a squash-merge folding post-stamp commits under an already-installed version, once by a skipped re-bump — and each time the fix reached nobody. Critically, a **structured code review also missed it**: prose rules are invisible to reviewers scanning a diff, because nothing in the diff says "a rule was broken here." The rule was correct and documented; documentation was simply the wrong enforcement layer for a rule that must never be bypassed and whose violation ships silently.

## Guidance

When a rule is **non-negotiable** (bypassing it causes user-visible harm) and **silent** (its violation does not announce itself in a diff), move it down the enforcement ladder from prose to mechanism:

1. **Prose** (`CLAUDE.md`/`AGENTS.md`) — communicates intent; relied on by humans and agents who may forget under pressure. Necessary but never sufficient for a must-not-bypass rule.
2. **Local git hook** (`.git/hooks/pre-commit`) — early feedback, but machine-local (not version-controlled), bypassable with `--no-verify`, and absent on fresh clones. A courtesy, not a gate.
3. **CI check** (GitHub Actions on `pull_request`) — runs on every PR regardless of who opens it. This is where the authoritative rule lives.
4. **Branch protection** — makes the CI check a *required status check* so a red check actually blocks merge. Without this, a failing check is merely advisory.

Two design choices made the CI layer robust:

- **Put the rule in a pure, unit-tested function; let the workflow feed it git data.** The decision logic (`evaluate({changedPaths, ...versions})`) lives in `.github/scripts/check-version-bump.mjs` as a pure function with no git/fs/network, unit-tested against fixtures (9 scenarios). The workflow does only the plumbing: `git diff --name-only <base>...<head>` for changed paths, `git show <sha>:manifest` for versions, then pipes them in. The rule is verifiable locally in milliseconds; the glue is proven end-to-end once in CI.
- **Gate on "did a required change accompany this change," not just "did a file change."** The check fires only when *source* paths changed (anchored `^(skills|hooks)/`, so `docs/` and lookalikes like `myskills/` never trip it) and then asserts the required companion change (both manifests bumped off the base branch to the same new value).

For the branch-protection layer, three settings turn "reports red" into "cannot merge":

- **`required_status_checks.contexts: [<check-name>]`** — the check must pass before merge.
- **`strict: true`** — the branch must be up to date with base before merging. This closes a concurrency hole: without it, two PRs branched from the same base can each pass independently and both merge, re-introducing the exact "shipped under a stale version" failure via plain merge commits.
- **`enforce_admins: true`** — admins are subject to the check too. Without it, "fails CI" still lets a maintainer merge past a red check, so the rule remains bypassable for exactly the people most likely to be in a hurry.

Disable the merge methods that enable the silent-folding failure mode (here: squash and rebase merge, leaving only merge commits), so history and the version-bump commit survive.

## Why This Matters

The failure being solved is *human forgetfulness*, and the cited evidence (two violations, one missed review) shows the humans in the loop — author and reviewer — already failed. Adding a third human checkpoint (a stricter written rule, a review checklist item) targets the layer that already proved unreliable. A mechanism that runs unconditionally on every PR removes the rule from the class of things a human can forget. The cost is small and one-time (one workflow, one pure function, a few `gh api` settings calls); the payoff compounds on every future PR.

A subtle but important corollary: **an advisory check is not enforcement.** "The CI check fails" and "the change cannot merge" are different guarantees. If the goal is *unavoidable*, the branch-protection `required` + `strict` + `enforce_admins` triad is the part that delivers it — the workflow alone only detects.

## When to Apply

- A documented rule keeps getting violated, especially if a review already missed it once.
- The rule's violation is silent — it does not surface as an obvious error in the diff or at runtime until users are affected.
- The rule can be decided mechanically from repository state (changed paths, file contents, version strings, presence of a companion change).

Do **not** reach for this when the "rule" genuinely requires human judgment per change (e.g., "write a good commit message"), when violations are loud and self-correcting, or when the enforcement machinery would cost more than the harm it prevents. Prose is the right layer for guidance that bends to context; mechanism is for rules that must not.

## Examples

**Before — prose only (violated twice, missed by review):**

```markdown
# CLAUDE.md
Bump the plugin manifest version when releasing skill changes.
```

**After — the rule as a pure function the CI workflow feeds:**

```
# .github/scripts/check-version-bump.mjs  (unit-tested, 9 scenarios)
evaluate({changedPaths, claudeBase, codexBase, claudeHead, codexHead}):
  if no path matches ^(skills|hooks)/        -> pass (no bump required)
  if either head === its base                -> fail (a manifest not bumped)
  if claudeHead !== codexHead                -> fail (bumped to different values)
  else                                       -> pass
```

```yaml
# .github/workflows/version-guard.yml
on: { pull_request: { branches: [main] } }
# checkout fetch-depth:0 -> git diff base...head for paths,
# git show base/head:<manifest> for versions -> pipe into the checker
```

**Making it unavoidable (one-time `gh api`, requires admin):**

```bash
# disable the silent-folding merge methods
gh api -X PATCH repos/OWNER/REPO -F allow_squash_merge=false -F allow_rebase_merge=false
# require the check + up-to-date + no admin bypass
gh api -X PUT repos/OWNER/REPO/branches/main/protection --input - <<'JSON'
{ "required_status_checks": {"strict": true, "contexts": ["version-guard"]},
  "enforce_admins": true, "required_pull_request_reviews": null, "restrictions": null }
JSON
```

## Related

- `docs/solutions/plugin-version-bump-update-detection-2026-05-04.md` — the specific rule this enforces (why the version string gates release detection) and the current enforcement stack.
- `docs/solutions/architecture-patterns/plugin-enforcement-hook-fixpoint-contract.md` — a sibling "move enforcement out of prose" pattern, at the PreToolUse-hook layer rather than CI; also notes prose degrades under context pressure.
- A `ce-doc-review` adversarial pass caught the `strict` (stale-base) and `enforce_admins` (advisory-check) gaps as P1 findings *before* implementation — worth running an adversarial review on any "we'll enforce it in CI" plan, since the enforcement teeth are exactly what plans under-specify.
