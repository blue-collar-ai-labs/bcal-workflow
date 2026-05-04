## Resume: bcal-workflow — Slack bot migration in progress

**Project:** bcal-workflow plugin (agent-agnostic workflow skills, bcal-agent-plugins marketplace). Connected to bcal-brain.

**Just completed:** Fixed notify-proof Unicode rendering (sanitization table for em-dashes, smart quotes). Migrated notify-proof from webhook to Slack bot token (`chat.postMessage`). Created notify-pdf skill (uploads PDFs via `files.upload`). Unified both skills on `SLACK_BOT_TOKEN` + `SLACK_REVIEW_CHANNEL_ID` with a shared setup guide. Old `SLACK_PROOF_WEBHOOK_URL` is no longer used.

**Next task:** Set up the Slack bot credentials. The user already has a Slack app from the webhook setup — needs to check scopes (`chat:write`, `files:write`), grab the `xoxb-` token, get the channel ID, and add both to `~/.claude/settings.json`. Then test notify-proof end-to-end, followed by notify-pdf. Also: bump plugin version before shipping.

**Read first:** `docs/slack-bot-setup.md`, `skills/notify-proof/SKILL.md`, `skills/notify-pdf/SKILL.md`
