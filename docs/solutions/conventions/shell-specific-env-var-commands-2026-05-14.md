---
title: Specify shell-specific commands for environment variable reads in skill instructions
date: 2026-05-14
category: conventions
module: skill-authoring
problem_type: convention
component: tooling
severity: medium
applies_when:
  - Skill instructions need to read environment variables
  - The skill runs on Windows where both Bash and PowerShell tools are available
  - Instructions say "check the environment" without specifying how
tags:
  - shell-syntax
  - environment-variables
  - windows
  - bash-vs-powershell
  - skill-instructions
  - silent-failure
---

# Specify shell-specific commands for environment variable reads in skill instructions

## Context

The end-session-gracefully skill needed to read `CLAUDE_CODE_SESSION_ID` from the environment. The instruction said "check the agent runtime environment for this value" without specifying which shell command to use. On Windows, where both Bash and PowerShell tools are available, the agent used PowerShell `$env:VAR` syntax inside the Bash tool. Bash interpreted `$env` as an undefined variable and output the literal string `:CLAUDE_CODE_SESSION_ID` — silently wrong, not an error.

**Status:** The originating code is gone. `start-session` no longer offers to resume a previous context window (agentic harnesses handle that natively), so `end-session-gracefully` stopped writing `resume_id` and no longer reads `CLAUDE_CODE_SESSION_ID` at all. Retired 2026-08-20. The convention below still applies to any skill that reads environment variables; the `resume_id` code below is kept as the illustrating case, not as current code.

## Guidance

When skill instructions need to read an environment variable, specify the exact command for each available shell:

```
- **Bash tool:** `printenv VAR_NAME`
- **PowerShell tool:** `$env:VAR_NAME`
```

Do not write "check the environment" or "read the env var" without specifying the command. The syntax difference between shells is invisible when it fails — wrong-shell reads produce garbage, not errors.

## Why This Matters

Silent failures are worse than loud ones. The agent saw output (`:CLAUDE_CODE_SESSION_ID`), concluded the variable was unset, and omitted the resume_id from NEXT_SESSION.md. The variable was set the whole time. Deterministic instructions eliminate this class of failure entirely.

## When to Apply

- Any SKILL.md that instructs the agent to read environment variables
- Any cross-platform skill where Bash and PowerShell are both available
- Especially on Windows, where the default shell choice varies between sessions

## Examples

Both snippets are historical — this code no longer exists in `end-session-gracefully`.

Before (ambiguous — caused the failure):
```
**Finding the resume ID:** Check the agent runtime environment for this value.
If the session ID is not discoverable, omit resume_id rather than guessing.
```

After (deterministic — prevents the failure):
```
**Finding the resume ID:** The Claude Code harness sets CLAUDE_CODE_SESSION_ID
in the child process environment. Read it with the correct syntax for the
shell you're using:

- **Bash tool:** `printenv CLAUDE_CODE_SESSION_ID`
- **PowerShell tool:** `$env:CLAUDE_CODE_SESSION_ID`

Do not mix syntaxes (e.g., $env: in Bash will silently fail). If the variable
is empty or unset, omit resume_id rather than guessing.
```

## Related

- `skills/end-session-gracefully/SKILL.md` — where this fix was applied, and where it was later removed along with the `resume_id` frontmatter field
- `skills/start-session/SKILL.md` — dropped its resume-a-previous-session step, which is what made `resume_id` dead
