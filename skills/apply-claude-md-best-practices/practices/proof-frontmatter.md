---
name: Proof frontmatter preservation
category: tooling
detect: "frontmatter.*[Pp]roof|[Pp]roof.*frontmatter|include.*frontmatter.*posting"
---

## What it does

Tells the agent to keep YAML frontmatter visible when posting markdown documents to Proof (proofeditor.ai) — preserved as a fenced yaml code block (the transform the bcal-workflow prep skill performs), never stripped and never left as raw `---` delimiters.

## Why

Proof renders whatever markdown you send it. Some agents strip YAML frontmatter before posting because they treat it as metadata rather than content, which loses context reviewers need (client, type, status). Leaving the raw `---` delimiters is no better — Proof's renderer garbles them. Converting the block to fenced yaml keeps the metadata visible and clean; the "Prep-for-proof before upload" practice installs the skill requirement that produces this automatically.

## Snippet

```markdown
## Proof Integration

When posting markdown documents to Proof (proofeditor.ai), keep YAML frontmatter from the source file visible -- preserved as a fenced yaml code block, not stripped and not left as raw --- delimiters. Reviewers need to see metadata like client, type, and status in the rendered document.
```
