---
name: Proof frontmatter preservation
category: tooling
detect: "frontmatter.*[Pp]roof|[Pp]roof.*frontmatter|include.*frontmatter.*posting"
---

## What it does

Tells the agent to always include YAML frontmatter when posting markdown documents to Proof (proofeditor.ai), if the original file has frontmatter. Reviewers need to see metadata like client, type, and status in the rendered document.

## Why

Proof renders whatever markdown you send it. By default, some agents strip YAML frontmatter before posting because they treat it as metadata rather than content. This loses context that reviewers need to make informed decisions.

## Snippet

```markdown
## Proof Integration

When posting markdown documents to Proof (proofeditor.ai), always include YAML frontmatter from the source file if it exists. Do not strip or hide frontmatter -- reviewers need to see metadata like client, type, and status in the rendered document.
```
