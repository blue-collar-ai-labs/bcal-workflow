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
- `bcal-workflow:live-transcript`

## Install (Codex)

Add the marketplace, then enable `bcal-workflow` in Codex's plugin UI:

```bash
codex plugin marketplace add blue-collar-ai-labs/bcal-agent-plugins
```

The plugin publishes Codex metadata in `.codex-plugin/plugin.json` and exposes the skills under `skills/`.

## Skills

| Skill | Command | Description |
|---|---|---|
| start-session | `/bcal-workflow:start-session` | Resume from `NEXT_SESSION.md` or start fresh |
| end-session-gracefully | `/bcal-workflow:end-session-gracefully` | Commit, push, update project status, write a handoff prompt |
| write-to-diary | `/bcal-workflow:write-to-diary` | Append a session summary to `DIARY.csv` |
| notify-proof | `/bcal-workflow:notify-proof` | Send a Slack notification when a doc is posted to Proof for review |
| live-transcript | `/bcal-workflow:live-transcript` | Capture group discussion from a live Notion transcript and synthesize an answer |

### live-transcript setup

Requires a Notion MCP server configured in your session. The skill uses the MCP server to search for transcript pages, write markers, and read discussion content.

1. Install a Notion MCP server (e.g., [makenotion/notion-mcp-server](https://github.com/makenotion/notion-mcp-server))
2. Configure it with a Notion API integration token that has access to your transcript pages
3. Add the MCP server to your Claude Code or agent configuration

### notify-proof setup

Requires a Slack incoming webhook URL set as an environment variable:

```bash
export SLACK_PROOF_WEBHOOK_URL="https://hooks.slack.com/services/T.../B.../..."
```

## License

UNLICENSED
