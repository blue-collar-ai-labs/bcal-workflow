# Slack Bot Setup for Notify Skills

The `notify-proof` and `notify-pdf` skills both use a Slack bot token to post messages and upload files. This guide walks you through setup.

## What you need

Two environment variables configured in Claude Code:

| Variable | Example | Purpose |
|---|---|---|
| `SLACK_BOT_TOKEN` | `xoxb-1234-5678-abc...` | Authenticates API calls to Slack |
| `SLACK_REVIEW_CHANNEL_ID` | `C07ABC123` | Channel where review notifications are posted |

## Setup steps

### If you already have a Slack app

1. Go to https://api.slack.com/apps and click your app
2. Go to **OAuth & Permissions** in the sidebar
3. Under **Bot Token Scopes**, make sure you have:
   - `chat:write` — post messages
   - `files:write` — upload PDFs
4. If you added new scopes, click **Reinstall to Workspace** at the top and authorize
5. Copy the **Bot User OAuth Token** (starts with `xoxb-`)
6. Skip to [Configure env vars](#configure-env-vars)

### If you need to create a new app

1. Go to https://api.slack.com/apps and click **Create New App** > **From scratch**
2. Name it something recognizable (e.g., "BCAL Reviews") and pick your workspace
3. Go to **OAuth & Permissions** in the sidebar
4. Under **Bot Token Scopes**, add:
   - `chat:write`
   - `files:write`
5. Scroll up and click **Install to Workspace**, then authorize
6. Copy the **Bot User OAuth Token** (starts with `xoxb-`)

### Invite the bot to your channel

In Slack, go to the channel where you want review notifications and type:

```
/invite @YourBotName
```

### Get the channel ID

Right-click the channel name > **View channel details** > scroll to the bottom and copy the **Channel ID** (starts with `C`).

## Configure env vars

Add the values to your Claude Code **user settings** so they're available across all projects but not checked into any repo:

**File:** `~/.claude/settings.json`

Add or merge into the `"env"` block:

```json
{
  "env": {
    "SLACK_BOT_TOKEN": "xoxb-your-token-here",
    "SLACK_REVIEW_CHANNEL_ID": "C07YOUR_CHANNEL_ID"
  }
}
```

If the file already has other settings, just add the two keys inside the existing `"env"` object.

## Verify it works

Run `/notify-proof` or `/notify-pdf` with a test document. If you see an error:

| Error | Fix |
|---|---|
| `not_authed` / `invalid_auth` | Token is wrong or expired. Re-copy from OAuth & Permissions. |
| `channel_not_found` | Channel ID is wrong. Double-check the ID from channel details. |
| `not_in_channel` | Bot wasn't invited. Run `/invite @BotName` in the channel. |
| `missing_scope` | Go to OAuth & Permissions, add the missing scope, and reinstall. |

## Notes

- The bot token is the only Slack credential these skills need. You do not need the App ID, Client ID, Client Secret, Signing Secret, or Verification Token.
- Both skills post to the same channel. If you want them in separate channels, set `SLACK_REVIEW_CHANNEL_ID` to the shared one and we can add per-skill overrides later.
- The webhook URL (`SLACK_PROOF_WEBHOOK_URL`) is no longer used. You can remove it from your settings.
