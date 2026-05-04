---
name: notify-pdf
description: "Upload a PDF to a Slack channel with a review-request message. Uses the Slack Web API (bot token) to attach the file alongside a notification."
---

# notify-pdf

Upload a PDF to a Slack channel with a formatted review-request message.

## Steps

### 1. Gather review details

Collect the following from the current context or by asking the user:

- **PDF path** (required): Absolute path to the PDF file to upload.
- **Document title** (required): The name of the document under review.
- **Reviewers** (required): One or more reviewers to @-mention. Accept any of:
  - Slack user IDs (e.g., `U07ABC123`) — used directly as `<@U07ABC123>`
  - Slack display names (e.g., `@david`) — the user is responsible for providing the correct Slack user ID if they want a real mention; display names are included as plain text only
- **Context** (optional): A one-line summary of what the reviewer should focus on or what decision is needed.

If any required field is missing from context, ask the user.

Verify the PDF file exists before proceeding.

### 2. Resolve credentials

Read these environment variables:

- `SLACK_BOT_TOKEN` — a Slack bot token starting with `xoxb-`
- `SLACK_REVIEW_CHANNEL_ID` — the channel ID (e.g., `C07ABC123`) to upload to

If either variable is not set, tell the user:

```
Slack bot credentials not found. See the setup guide:
  docs/slack-bot-setup.md

You need SLACK_BOT_TOKEN and SLACK_REVIEW_CHANNEL_ID in ~/.claude/settings.json
```

Then stop -- do not attempt to send.

### 3. Build the message text

**Sanitize text for Slack.** Before inserting any text into the message, replace characters that don't survive the curl pipeline on all platforms:

| Replace | With |
|---|---|
| `---` (em-dash) | ` -- ` |
| `--` (en-dash) | `-` |
| Smart single quotes | `'` |
| Smart double quotes | `"` |
| Ellipsis character | `...` |
| Any other non-ASCII character (emoji, accented letters) | remove or substitute an ASCII equivalent |

Compose an `initial_comment` string for the file upload. Use Slack mrkdwn formatting:

```
:page_facing_up: *Review requested*

*Document:* DOCUMENT_TITLE
*Reviewers:* REVIEWER_MENTIONS
*Context:* CONTEXT_TEXT
```

Omit the Context line if no context was provided.

**Reviewer formatting:**
- Slack user IDs (matching `^U[A-Z0-9]+$`): format as `<@U07ABC123>`
- Anything else: include as plain text (e.g., `@david`)

### 4. Upload the PDF

Use the Slack `files.upload` API (v1) which handles both file upload and message posting in one call:

```bash
curl -s -F "token=$SLACK_BOT_TOKEN" \
  -F "channels=$SLACK_REVIEW_CHANNEL_ID" \
  -F "file=@PDF_PATH" \
  -F "filename=FILENAME.pdf" \
  -F "title=DOCUMENT_TITLE" \
  -F "initial_comment=MESSAGE_TEXT" \
  https://slack.com/api/files.upload
```

Parse the JSON response. Check that `"ok": true` is present.

### 5. Report result

- **ok: true**: Confirm the PDF was uploaded and the notification was sent. Show the channel and reviewers mentioned.
- **ok: false**: Show the `error` field from the response. Common errors:
  - `not_authed` / `invalid_auth` — bad or missing bot token
  - `channel_not_found` — wrong channel ID or bot not invited to the channel
  - `not_in_channel` — bot needs to be invited: `/invite @BotName`
