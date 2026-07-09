# Concepts

Shared domain vocabulary for this project — entities, named processes, and status concepts with project-specific meaning. Seeded with core domain vocabulary, then accretes as ce-compound and ce-compound-refresh process learnings; direct edits are fine. Glossary only, not a spec or catch-all.

## Proof workflow

### Proof
The human-in-the-loop review surface (proofeditor.ai) where markdown documents are shared for reviewer comments and suggestions. Its renderer treats a single newline as a hard line break, shows non-ASCII punctuation as replacement characters, and garbles raw frontmatter delimiters — the constraints that make prepping necessary.

### Prepped
The state of a markdown file that is ready for Proof upload, defined as a fixpoint: running the prep transform on the file returns it byte-identical. Detection, idempotency, and enforcement all derive from this one property; there is no marker comment or sidecar state to drift.

A prepped file has its frontmatter as a fenced yaml block, ASCII punctuation outside code, one logical line per paragraph, and LF line endings — so a freshly hard-wrapped or CRLF file is by definition not prepped.

### Prepped sibling
The upload artifact written next to a source document (`<name>.prepped.md`). The sibling is what gets uploaded to Proof; the source file is never modified in place, so tools that parse real YAML frontmatter keep working against it.

### Proof upload gate
The plugin's enforcement hook that denies an un-prepped markdown upload to a Proof write endpoint and replies with the exact remediation command. It follows block-and-remind, fails open on any internal error, and is defense-in-depth behind the skill instructions, which remain the primary enforcement on every platform.

### Block-and-remind
The ceiling for enforcement hooks in this plugin: a hook may deny an action and say precisely how to fix it, but never silently rewrites the user's command or files.

## Conventions

### Canonical format contract
The convention that any file format a skill produces or normalizes is defined exactly once, in a dedicated section of that skill's definition; the implementation, tests, and any enforcement all reference that single definition instead of restating the rules.

### Practice
A unit of paste-able CLAUDE.md guidance in the best-practices library. Each practice carries a what/why explanation, the exact snippet to paste, and a detection pattern used to tell whether a target CLAUDE.md already applies it. Detection patterns must not match sibling practices' snippets, or applying one practice masks another.

## Flagged ambiguities

- "Sanitize" and "prep" had overlapping punctuation mappings and were at risk of being used interchangeably — these are distinct: sanitizing makes text survive the Slack curl transport (notify-proof's payload table); prepping makes a whole document render correctly in Proof.
