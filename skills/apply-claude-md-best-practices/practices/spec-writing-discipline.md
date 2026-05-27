---
name: Spec-writing discipline
category: planning
detect: "User Stories|As a .*, I want .*, so that|Acceptance Criteria|Thoughtworks|spec-writing"
---

## What it does

Adds a spec-writing discipline section that shapes how brainstorms and plans are structured: user stories in Thoughtworks format, mandatory acceptance criteria, and actor-first thinking. Applies when running ce-brainstorm, ce-plan, or any requirements/planning workflow.

## Why

Without explicit spec discipline, planning tools jump straight to requirements and implementation units — capturing *what* to build but not *who it's for* or *how to verify it works*. Thoughtworks-style user stories force you to name the actor, the desire, and the value before writing a single requirement. Mandatory acceptance criteria per story create a testable contract that prevents vague specs from reaching implementation.

## Snippet

```markdown
## Spec-Writing Discipline

When planning features — whether through ce-brainstorm, ce-plan, or ad-hoc requirements — follow these practices.

### 1. Start with User Stories

Before writing requirements (R-IDs), write the user stories they come from. Use the Thoughtworks format:

> As a **[actor]**, I want to **[capability]**, so that **[value/outcome]**.

The "so that" clause is the most important part — it's the kill switch for scope creep. If a feature doesn't serve the "so that," question whether it belongs.

Each story should trace forward to the requirements it generates (e.g., `→ Generates: R1, R3, R7`).

### 2. Mandatory Acceptance Criteria

Every user story gets explicit acceptance criteria — not just the ambiguous ones. Use Given/When/Then format:

- **Given** [precondition], **when** [action], **then** [observable outcome].

Acceptance criteria are the contract between the spec and the implementation. They define "done" in terms of behavior, not code. A story without acceptance criteria is a story that can't be verified.

### 3. Actor-First Thinking

Name the actors before writing anything else. Ask:
- Who are the 2-3 people who will use this?
- What does each actor need that the others don't?
- Which actor's needs conflict?

Actors aren't just labels — they reveal when one story is actually two (different actors, different needs, different acceptance criteria).

### 4. Verify by Using, Not by Reading

"Done" means the acceptance criteria pass when you *use* the feature, not when the code compiles or the file exists. Prefer behavioral verification ("run the skill and check the output") over structural verification ("file exists at path").
```
