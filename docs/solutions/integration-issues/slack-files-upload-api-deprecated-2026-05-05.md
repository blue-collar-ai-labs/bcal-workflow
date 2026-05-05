---
title: Slack files.upload API deprecated — migrate to three-step upload flow
date: 2026-05-05
category: integration-issues
module: notify-pdf
problem_type: integration_issue
component: tooling
symptoms:
  - "Slack API returns method_deprecated error on files.upload"
root_cause: wrong_api
resolution_type: code_fix
severity: high
tags: [slack-api, file-upload, api-migration, notify-pdf]
---

# Slack files.upload API deprecated — migrate to three-step upload flow

## Problem

The `files.upload` Slack API endpoint returns `{"ok": false, "error": "method_deprecated"}`. File uploads via the old single-call method no longer work.

## Symptoms

- Slack API call to `https://slack.com/api/files.upload` returns `method_deprecated`
- No file is uploaded; no message is posted to the channel

## What Didn't Work

- The old single-call `files.upload` with `-F` form fields (token, channels, file, filename, title, initial_comment) — Slack has fully deprecated this endpoint.

## Solution

Slack now requires a three-step upload flow:

**Step 1 — Get an upload URL:**

```bash
FILESIZE=$(wc -c < "$FILE_PATH" | tr -d ' ')
curl -s -X POST \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "filename=document.pdf" \
  --data-urlencode "length=$FILESIZE" \
  https://slack.com/api/files.getUploadURLExternal
```

Response contains `upload_url` and `file_id`.

**Step 2 — Upload the file content:**

```bash
curl -s -X POST -F "file=@$FILE_PATH" "$UPLOAD_URL"
```

Response is `OK` followed by byte count.

**Step 3 — Complete the upload and share to channel:**

```bash
curl -s -X POST \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{
    "files": [{"id": "FILE_ID", "title": "Document Title"}],
    "channel_id": "CHANNEL_ID",
    "initial_comment": "Message text here"
  }' \
  https://slack.com/api/files.completeUploadExternal
```

## Why This Works

Slack deprecated the monolithic `files.upload` in favor of a chunked upload flow that separates URL acquisition, content transfer, and channel sharing. The new flow supports larger files and is consistent with their modern API patterns.

## Prevention

- When building Slack integrations, check the Slack API changelog for deprecation notices
- The `files:write` bot token scope is still required — same as before
- The `initial_comment` field in `completeUploadExternal` supports mrkdwn formatting, same as the old API

## Related Issues

- notify-pdf SKILL.md updated to use three-step flow in this session
