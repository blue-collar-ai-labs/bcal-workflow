# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project

`bcal-workflow` is a Claude Code plugin providing agent-agnostic workflow skills for session lifecycle management. It is part of the [bcal-agent-plugins](https://github.com/blue-collar-ai-labs/bcal-agent-plugins) marketplace.

**Owner:** Blue Collar AI Labs

## Plugin Format

A skill is a directory under `skills/<skill-name>/` containing:
- `SKILL.md` — skill definition with YAML frontmatter (`name`, `description`) and step-by-step instructions
- `agents/` (optional) — agent-specific configs (e.g., `openai.yaml` for Codex compatibility)

Skill directories use kebab-case. The `name:` in SKILL.md frontmatter matches the directory name exactly.

## Architecture Decisions

- **Agent-agnostic.** Skills use platform-specific question tools (`AskUserQuestion` for Claude Code, `request_user_input` for Codex, `ask_user` for Gemini) rather than hardcoding one agent's API.
- **No dependency on braintrust.** These skills are brain-agnostic — they work in any repo regardless of brain configuration.
- **No dependency on proposal-pro.** `notify-proof` sends Slack notifications for any Proof review, not just proposals.
