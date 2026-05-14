---
name: Prompts as installers
category: distribution
detect: "prompt.*install|install.*prompt|setup prompt|copyable prompt|paste.*prompt.*setup"
---

## What it does

Guides the agent to treat setup prompts as a first-class distribution mechanism for tools and integrations. When building something that other agents or users will adopt, provide a copyable prompt block that handles installation — not just documentation to read.

## Why

For AI-native tools, the front door is shifting from download buttons and install scripts to setup prompts that users paste into their agent. The prompt gets users from "I want to try this" to "It's running in my workflow" in one step. Based on Every.to's "Prompts Are the New Installers" (Katie Parrott, 2026).

## Snippet

```markdown
## Prompts as Installers

When building tools, plugins, or integrations that others will adopt, provide a copyable setup prompt — not just documentation. The prompt should get a user from "I want to try this" to "it's working" in one paste. Include it in READMEs, product pages, and repo homepages alongside (not instead of) traditional install instructions.
```
