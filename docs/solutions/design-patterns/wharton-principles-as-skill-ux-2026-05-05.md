---
title: Wharton design principles as interactive skill UX framework
date: 2026-05-05
category: design-patterns
module: apply-claude-md-best-practices
problem_type: design_pattern
component: tooling
severity: medium
applies_when:
  - Building interactive skills that walk users through choices
  - Designing agent UX for curated recommendations or best practices
  - Any skill where the agent presents options and the user decides what to apply
tags: [wharton, design-principles, skill-ux, human-in-the-loop, agent-design]
---

# Wharton design principles as interactive skill UX framework

## Context

The Wharton Blueprint for AI Agent Adoption (April 2026) was originally operationalized as a checklist for customer-facing artifacts (videos, proposals, emails). When building the `apply-claude-md-best-practices` skill, the same principles proved directly applicable to designing how an AI agent skill interacts with users — not just what it produces, but how it presents choices and seeks approval.

## Guidance

Apply these Wharton-derived principles when designing interactive agent skills:

1. **Suggest, don't act.** Present each option with its rationale and a preview. Never apply without explicit approval.
2. **Low-power language.** Use "suggests," "offers," "helps" — not "decides," "controls," or "manages."
3. **Keep the human in control.** One item at a time. The user can accept, skip, or stop at any point.
4. **Show the reasoning.** Each option includes a "Why" section so the user makes an informed decision, not just trusts the tool.
5. **Acknowledge limitations.** These are opinionated defaults, not universal truths. Say so if asked.

## Why This Matters

Without these principles, interactive skills tend toward two failure modes: (1) dumping all options at once and asking "which ones?" which overwhelms, or (2) applying everything automatically which removes agency. The Wharton research shows moderate autonomy (suggest but don't act) and visible reasoning increase both trust and adoption.

## When to Apply

- Any skill that presents a catalog of options to the user
- Skills that modify user-owned files (CLAUDE.md, config, etc.)
- Curated recommendation workflows where the agent has opinions but the user decides

## Examples

**Before (dumps everything):**
```
Here are 8 best practices for your CLAUDE.md. Which ones do you want? (1-8)
```

**After (Wharton-informed):**
```
**Practice: Proof frontmatter preservation** (tooling)

Tells the agent to always include YAML frontmatter when posting
to Proof, if the original file has frontmatter. Reviewers need
to see metadata like client, type, and status.

Here's what would be added to your CLAUDE.md:
[preview snippet]

Apply this practice? (yes / no / stop)
```

## Related

- bcal-brain: `playbooks/wharton-design-principles-checklist.md`
- bcal-brain: `reference/wharton-blueprint-ai-agent-adoption.md`
- skills/apply-claude-md-best-practices/SKILL.md
