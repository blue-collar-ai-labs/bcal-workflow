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
- `bcal-workflow:prep-for-proof`
- `bcal-workflow:notify-proof`
- `bcal-workflow:notify-pdf`
- `bcal-workflow:live-transcript`
- `bcal-workflow:apply-claude-md-best-practices`

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
| prep-for-proof | `/bcal-workflow:prep-for-proof` | Preprocess markdown (frontmatter, unicode, unwrapping) before uploading to Proof |
| notify-proof | `/bcal-workflow:notify-proof` | Send a Slack notification when a doc is posted to Proof for review |
| notify-pdf | `/bcal-workflow:notify-pdf` | Upload a PDF to a Slack channel with a review-request message |
| live-transcript | `/bcal-workflow:live-transcript` | Capture group discussion from a live Notion transcript and synthesize an answer |
| apply-claude-md-best-practices | `/bcal-workflow:apply-claude-md-best-practices` | Walk through curated CLAUDE.md best practices one at a time, choosing which to apply |

### live-transcript setup

Requires a Notion MCP server configured in your session. The skill uses the MCP server to search for transcript pages, write markers, and read discussion content.

1. Install a Notion MCP server (e.g., [makenotion/notion-mcp-server](https://github.com/makenotion/notion-mcp-server))
2. Configure it with a Notion API integration token that has access to your transcript pages
3. Add the MCP server to your Claude Code or agent configuration

### notify-proof / notify-pdf setup

Both Slack skills use the Slack Web API with a bot token. Set these environment variables:

```bash
export SLACK_BOT_TOKEN="xoxb-..."          # bot token
export SLACK_REVIEW_CHANNEL_ID="C07ABC123" # channel to post to
```

## Tests

The `prep-for-proof` script and the Proof upload hook are the repo's only executable code. Run their suites with:

```bash
node --test "skills/prep-for-proof/scripts/*.test.mjs" "hooks/scripts/*.test.mjs"
```

The plugin also ships a Claude Code `PreToolUse` hook (`hooks/hooks.json`) that blocks Bash uploads of un-prepped markdown to Proof write endpoints. It is block-and-remind only, fails open on any error, and requires `node` on PATH.

## License

UNLICENSED
