# bcal-workflow

Agent-agnostic workflow skills for [Claude Code](https://claude.ai/code) and [Codex](https://openai.com/index/introducing-codex/). Session lifecycle management, diary, and review notifications.

Part of the [bcal-agent-plugins](https://github.com/blue-collar-ai-labs/bcal-agent-plugins) marketplace from [Blue Collar AI Labs](https://github.com/blue-collar-ai-labs).

## Install (Claude Code)

Add the marketplace, then install:

```
/plugin marketplace add blue-collar-ai-labs/bcal-agent-plugins
/plugin install bcal-workflow
```

After installing, type `/` and look for:

- `bcal-workflow:start-session`
- `bcal-workflow:end-session-gracefully`
- `bcal-workflow:write-to-diary`
- `bcal-workflow:notify-proof`

## Install (Codex)

Codex does not have a plugin marketplace. Copy skill directories into your project and reference the `agents/openai.yaml` configs in your `AGENTS.md`.

```bash
git clone https://github.com/blue-collar-ai-labs/bcal-workflow.git
```

## Skills

| Skill | Command | Description |
|---|---|---|
| start-session | `/bcal-workflow:start-session` | Resume from `NEXT_SESSION.md` or start fresh |
| end-session-gracefully | `/bcal-workflow:end-session-gracefully` | Commit, push, update project status, write a handoff prompt |
| write-to-diary | `/bcal-workflow:write-to-diary` | Append a session summary to `DIARY.csv` |
| notify-proof | `/bcal-workflow:notify-proof` | Send a Slack notification when a doc is posted to Proof for review |

### notify-proof setup

Requires a Slack incoming webhook URL set as an environment variable:

```bash
export SLACK_PROOF_WEBHOOK_URL="https://hooks.slack.com/services/T.../B.../..."
```

## License

UNLICENSED
