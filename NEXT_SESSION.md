---
resume_id: "b43cc2a6-96fc-4c0e-9ad3-7de7a885e8aa"
model: "Fable 5"
ended_at: "2026-07-09T18:52:43Z"
---

## bcal-workflow — shipped prep-for-proof skill and first plugin hook

**Project:** bcal-workflow plugin (agent-agnostic workflow skills, bcal-agent-plugins marketplace). Connected to bcal-brain.

**Just completed:** Shipped `prep-for-proof` (v0.9.4 / 0.5.3): zero-dependency Node script (frontmatter→fenced yaml, ASCII normalization, block-safe unwrapping, fixpoint `--check`), the repo's first PreToolUse hook (`hooks/`) blocking un-prepped Proof uploads, guidance wiring across CLAUDE.md/notify-proof/practice library, 40 passing tests plus real-harness smokes via `claude --plugin-dir`. Compounded the hook-design lesson to `docs/solutions/architecture-patterns/` and bcal-brain; created `CONCEPTS.md`.

**Next task:**
1. Verify the marketplace picked up 0.9.4 on a consuming machine (`/plugins` update, `/reload-plugins`, invoke `bcal-workflow:prep-for-proof`).
2. Run `/ce-compound-refresh plugin-version-bump-update-detection` — that doc claims a pre-commit guard that no longer exists and a single-manifest world; the wharton-principles doc also quotes the old frontmatter practice wording.
3. Optional: fix deferred README staleness (missing notify-pdf and apply-claude-md-best-practices rows; wrong notify-proof env vars).

**Read first:** `CLAUDE.md`, `CONCEPTS.md`, `skills/prep-for-proof/SKILL.md`
