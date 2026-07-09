---
name: Prep-for-proof before upload
category: tooling
detect: "prep-for-proof"
---

## What it does

Adds the prep-for-proof requirement to CLAUDE.md: author Proof- and email-bound prose as one logical line per paragraph, and run the bcal-workflow `prep-for-proof` skill before any upload to Proof (proofeditor.ai).

## Why

Proof renders a single newline as a hard line break, shows non-ASCII punctuation as replacement characters, and garbles raw frontmatter delimiters. Hard-wrapped or unicode-heavy markdown reads as "broken" to reviewers and derails the content review. The prep-for-proof skill (bcal-workflow plugin) fixes all three deterministically; this snippet makes running it a standing requirement in any repo that uploads to Proof.

## Snippet

```markdown
## Proof uploads: prep first

- Write one logical line per paragraph for Proof- or email-bound prose; never hard-wrap at a column.
- Before any upload to proofeditor.ai, run the bcal-workflow `prep-for-proof` skill and upload the prepped `<name>.prepped.md` output, not the raw source.
- The prep step keeps YAML frontmatter visible as a fenced yaml code block, normalizes unicode punctuation to ASCII, and unwraps hard-wrapped paragraphs.
```
