---
name: notify-proof
description: "Post a Slack review-request notification with a link to a Proof document. Uses Slack bot token for delivery."
---

# notify-proof

Send a Slack notification when a document is posted to Proof for human review.

## Steps

### 1. Gather review details

Collect the following from the current context or by asking the user:

- **Document title** (required): The name of the document under review.
- **Proof URL** (required): The proofeditor.ai URL where the reviewer will work.
- **Reviewers** (required): One or more reviewers to @-mention. Accept any of:
  - Slack user IDs (e.g., `U07ABC123`) — used directly as `<@U07ABC123>`
  - Slack display names (e.g., `@david`) — the user is responsible for providing the correct Slack user ID if they want a real mention; display names are included as plain text only
- **Context** (optional): A one-line summary of what the reviewer should focus on or what decision is needed.

If any required field is missing from context, ask the user.

### 2. Resolve credentials

Read these environment variables:

- `SLACK_BOT_TOKEN` — a Slack bot token starting with `xoxb-`
- `SLACK_REVIEW_CHANNEL_ID` — the channel ID (e.g., `C07ABC123`) to post to

If either variable is not set, tell the user:

```
Slack bot credentials not found. See the setup guide:
  docs/slack-bot-setup.md

You need SLACK_BOT_TOKEN and SLACK_REVIEW_CHANNEL_ID in ~/.claude/settings.json
```

Then stop — do not attempt to send.

### 3. Build the Slack message

**Sanitize text for Slack.** Before inserting any text into the payload, replace characters that don't survive the curl pipeline on all platforms:

| Replace | With |
|---|---|
| `—` (em-dash) | ` -- ` |
| `–` (en-dash) | `-` |
| Smart single quotes | `'` |
| Smart double quotes | `"` |
| Ellipsis character | `...` |
| Any other non-ASCII character (emoji, accented letters) | remove or substitute an ASCII equivalent |

This applies to the document title, reviewer names, and context text.

Construct a JSON payload using Slack Block Kit for `chat.postMessage`:

```json
{
  "channel": "SLACK_REVIEW_CHANNEL_ID",
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": ":clipboard: Review requested",
        "emoji": true
      }
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*Document:*\n<PROOF_URL|DOCUMENT_TITLE>"
        },
        {
          "type": "mrkdwn",
          "text": "*Reviewers:*\nREVIEWER_MENTIONS"
        }
      ]
    }
  ]
}
```

If context was provided, append a section block:

```json
{
  "type": "section",
  "text": {
    "type": "mrkdwn",
    "text": "*Context:*\nCONTEXT_TEXT"
  }
}
```

**Reviewer formatting:**
- Slack user IDs (matching `^U[A-Z0-9]+$`): format as `<@U07ABC123>`
- Anything else: include as plain text (e.g., `@david`)

### 4. Send the message

Write the JSON payload to a temporary file, then send with `curl`:

```bash
curl -s -X POST \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
  -H "Content-Type: application/json; charset=utf-8" \
  --data-binary @/tmp/slack-payload.json \
  https://slack.com/api/chat.postMessage
```

Parse the JSON response. Check that `"ok": true` is present.

Delete the temporary file after sending.

### 5. Report result

- **ok: true**: Confirm the notification was sent. Show the channel and reviewers mentioned.
- **ok: false**: Show the `error` field and direct the user to `docs/slack-bot-setup.md` for troubleshooting.
