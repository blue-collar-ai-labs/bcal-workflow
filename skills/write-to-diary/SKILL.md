---
name: write-to-diary
description: "Append a 1-3 sentence summary of the current session's work to DIARY.csv in the repo root. Creates the file on first run. Standardizes older diary files to the current format."
---

# write-to-diary

Record what was worked on in this session to a per-repo diary.

## Steps

### 1. Check for existing diary files

Look for `DIARY.csv` in the repository root.

If `DIARY.csv` does not exist, this is the first diary entry for this repo:
- Create the file with the header row (see format below).
- Never add DIARY.csv to .gitignore — the diary is part of the repo's committed history.

If `DIARY.md` exists, delete it — the CSV is the single diary format.

### 2. Check .gitignore

If `.gitignore` exists and contains an entry matching `DIARY.csv`, tell the user it's currently gitignored and ask if they'd like it removed. If they agree, remove the entry. If they decline, continue without changing it.

### 3. Standardize existing DIARY.csv

If `DIARY.csv` already exists, check whether its header matches the current format:

```
Datetime,User,Agent,Description
```

If the header uses different column names (e.g., `When,What`), rewrite the file:
- Rename old columns to their new equivalents (`When` → `Datetime`, `What` → `Description`).
- Add missing columns (`User`, `Agent`) with empty values for existing rows.
- Preserve all existing data rows.

### 4. Generate the timestamp

Run:
```bash
date '+%Y-%m-%d %I:%M %p %Z'
```

The output must match this exact format: `2026-04-24 02:07 PM EDT`. Use 12-hour time with AM/PM and the system's local timezone abbreviation.

On Windows (Git Bash), do NOT use `TZ='America/New_York'` — it silently falls back to GMT instead of converting. The default `date` command already uses the correct local timezone.

### 5. Resolve the User and Agent fields

- **User**: The current Git user's GitHub ID. Run `git config user.name` or use the known GitHub username (e.g., `dksmith01`). If unavailable, leave blank.
- **Agent**: The coding agent running this session. Use `Claude Code` or `Codex` as appropriate. If unknown, leave blank.

### 6. Write the diary entry

Summarize the session's work in 1-3 clear, jargon-free sentences. Write as if explaining to a colleague what you got done today. No bullet points, no technical deep-dives — just a plain-English record.

**DIARY.csv format** — a comma-delimited file with four columns:

```csv
Datetime,User,Agent,Description
"2026-04-24 02:07 PM EDT","dksmith01","Claude Code","Did the thing and the other thing."
```

Append new rows to the bottom. Always quote all fields to handle commas in the summary. Do not rewrite existing rows.

### 7. Report

Show the entry that was written. Do not ask for confirmation or revision — just write it and move on.
