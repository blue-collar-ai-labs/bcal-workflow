---
name: notify-proof
description: "Slack webhook for Proof document review requests. Sends a formatted notification with reviewer @-mentions when a document is posted to Proof for HITL review."
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

### 2. Resolve the webhook URL

Read the Slack incoming webhook URL from the environment variable `SLACK_PROOF_WEBHOOK_URL`.

If the variable is not set, tell the user:

```
SLACK_PROOF_WEBHOOK_URL is not set. To configure it:
1. Create a Slack incoming webhook at https://api.slack.com/messaging/webhooks
2. Set the env var: export SLACK_PROOF_WEBHOOK_URL="https://hooks.slack.com/services/T.../B.../..."
```

Then stop — do not attempt to send.

### 3. Build the Slack message

Construct a JSON payload using Slack Block Kit:

```json
{
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "📝 Review requested"
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

### 4. Send the webhook

Run:

```bash
curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d 'JSON_PAYLOAD' \
  "$SLACK_PROOF_WEBHOOK_URL"
```

### 5. Report result

- **HTTP 200**: Confirm the notification was sent. Show the channel and reviewers mentioned.
- **Any other status**: Show the HTTP status code and suggest the user verify their webhook URL.
