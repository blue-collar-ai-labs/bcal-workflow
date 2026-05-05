---
name: apply-claude-md-best-practices
description: "Walk users through curated best practices for CLAUDE.md files, one at a time, letting them choose which to apply. Optionally runs claude-md-improver first for a structural audit. Use when the user wants to improve their CLAUDE.md, add best practices, or set up project instructions."
---

# apply-claude-md-best-practices

Walk users through a curated catalog of CLAUDE.md best practices. Each practice is presented individually with its rationale, and the user decides whether to apply it. The skill respects what's already in the file and skips practices that are covered.

## Design principles

This skill follows the Wharton-derived design principles for AI agent adoption:

- **Suggest, don't act.** Present each practice with its rationale and a preview of the snippet. Never apply without explicit approval.
- **Low-power language.** Use "suggests," "offers," "helps" -- not "decides," "controls," or "manages."
- **Keep the human in control.** One practice at a time. The user can accept, skip, or stop at any point.
- **Show the reasoning.** Each practice includes a "Why" section so the user can make an informed decision, not just trust the tool.
- **Acknowledge limitations.** These are opinionated defaults, not universal truths. Say so if asked.

## Steps

### 1. Locate CLAUDE.md

Find the project's CLAUDE.md at the repo root. If it doesn't exist, ask the user whether to create one. If they decline, stop.

Read the current contents of CLAUDE.md into memory for duplicate detection in step 3.

### 2. Offer structural audit (optional)

Ask the user:

> "Would you like to run a structural audit of your CLAUDE.md first? This checks for missing sections, stale commands, and overall quality. (Uses claude-md-improver.)"

- If **yes**, invoke `/claude-md-management:claude-md-improver` and wait for it to complete before continuing.
- If **no**, skip to step 3.

### 3. Walk through practices

Read all practice files from `practices/` in this skill's directory. Each practice file has YAML frontmatter with `name`, `category`, and `detect` fields, plus a `## Why` section and a `## Snippet` section containing the markdown to add.

For each practice:

1. **Check for duplicates.** Use the `detect` field (a regex pattern) to search the current CLAUDE.md contents. If the pattern matches, skip this practice silently -- it's already covered.

2. **Present the practice.** Show the user:

   ```
   **Practice: <name>** (<category>)

   <contents of the "What it does" section>

   <contents of the "Why" section>

   Here's what would be added to your CLAUDE.md:

   <contents of the "Snippet" section, shown as a preview>

   Apply this practice? (yes / no / stop)
   ```

3. **Wait for the user's response:**
   - **yes** — Apply the snippet to CLAUDE.md. Insert it in a logical location (after existing content of the same category, or before the last section if no match). Confirm: "Added <name> to CLAUDE.md."
   - **no** — Skip. Move to the next practice.
   - **stop** — End the walkthrough immediately.

### 4. Summary

After all practices have been presented (or the user stopped), show a brief summary:

```
Done. Applied X of Y available practices.
```

If no practices were applied (all skipped or already present), say so without judgment.
