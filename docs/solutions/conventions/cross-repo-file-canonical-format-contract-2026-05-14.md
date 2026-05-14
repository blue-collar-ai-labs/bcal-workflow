---
title: Cross-repo file formats need a single canonical definition
date: 2026-05-14
category: conventions
module: write-to-diary
problem_type: convention
component: tooling
severity: medium
applies_when:
  - A skill creates or standardizes files in repos other than its own
  - A file format is defined in skill instructions and referenced in multiple steps
tags:
  - diary
  - canonical-format
  - cross-repo
  - standardization
  - skill-design
---

# Cross-repo file formats need a single canonical definition

## Context

The `write-to-diary` skill defines a 4-column CSV format (`Datetime,User,Agent,Description`) for DIARY.csv files it creates across many repos. The column names were repeated in three separate places in the skill (validation step, write step, format example), and the standardization logic only recognized two specific old header patterns (`When,What`) rather than handling arbitrary non-standard headers.

When DIARY.csv files were created during sessions that predated the 4-column format (or by agents that didn't follow the skill strictly), they ended up with headers like `date,session_summary` or `Date,Summary,Key Files`. The standardization step silently skipped these because it didn't recognize the column names.

## Guidance

When a skill defines a file format that it creates or maintains across multiple repos:

1. **Define the format exactly once** in the skill, in a dedicated section near the top. Every subsequent step references "the canonical format" rather than restating column names, field order, or structure.

2. **Standardization must handle any non-matching header**, not just known old formats. Match columns by semantic meaning (any date-like column maps to the date field, any summary-like column maps to the description field), and fill missing canonical columns with empty values.

3. **Quote the contract explicitly**: field count, field names, field order, quoting rules. If any of these can vary, the format isn't canonical — it's a suggestion that will drift.

## Why This Matters

Skills that create files across repos are writing a distributed contract. Every repo that has a DIARY.csv is a consumer of the write-to-diary format. If the contract is ambiguous or the validation is narrow, format drift is silent — files look fine locally but fail when another tool or session tries to standardize them. The cost compounds: each non-canonical file requires a manual fix across repos.

## When to Apply

- Designing any skill that creates or maintains files in repos other than its own
- Adding standardization/migration logic to a skill
- Reviewing a skill that references the same format specification in multiple steps

## Examples

**Before** — format repeated, standardization brittle:

```markdown
### 3. Standardize existing DIARY.csv
If the header uses different column names (e.g., `When,What`), rewrite...

### 6. Write the diary entry
**DIARY.csv format** — four columns:
Datetime,User,Agent,Description
```

**After** — single definition, semantic matching:

```markdown
## Canonical Format
DIARY.csv uses exactly these four columns in this order:
Datetime,User,Agent,Description
Every step below must use this header verbatim.

### 3. Standardize existing DIARY.csv
If the header does NOT exactly match the canonical header, rewrite...
Map old columns to canonical columns by meaning, not by exact name.
```

## Related

- `skills/write-to-diary/SKILL.md` — the skill where this convention was applied
- `docs/solutions/conventions/shell-specific-env-var-commands-2026-05-14.md` — another case where skill instructions needed hardening for cross-environment reliability
