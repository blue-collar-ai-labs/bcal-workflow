---
name: Agent-native architecture principles
category: architecture
detect: "agent-native|parity.*agent|granular.*tool|atomic.*primitive|composab.*prompt"
---

## What it does

Guides architecture decisions toward agent-native patterns when building tools, features, or systems that agents will interact with. Covers parity, granularity, composability, and the approval framework.

## Why

Traditional software design bundles decision logic into code, creates UI-only features agents can't reach, and over-constrains tool inputs. Agent-native architecture inverts this: tools are atomic primitives, features emerge from prompt composition, and behavior changes through prompts rather than code deploys. Based on Every.to's agent-native architecture principles (Katie Parrott, Dan Shipper).

## Snippet

```markdown
## Agent-Native Architecture

Based on Every.to's agent-native architecture principles.

### Parity

Any outcome a user can accomplish through UI, an agent should be able to achieve through tools. When adding a UI feature, verify the agent can accomplish the equivalent.

### Granularity

Tools should be atomic, irreducible primitives. Features emerge as outcomes agents pursue through looping tool use, not pre-choreographed sequences. If a tool bundles decision logic (e.g., `classify_and_organize`), break it into primitives and let the agent decide.

### Composability

Atomic tools with parity enable new features through prompts alone, no new code. When behavior needs to change, edit prompts before reaching for code.

### Files Over Opaque State

Prefer files for anything users or agents should be able to inspect, edit, or version. Use databases for high-volume structured data and fast indexed lookup. When in doubt, files.

### Approval by Stakes

| Stakes | Reversibility | Pattern |
|--------|---------------|---------|
| Low | Easy | Auto-apply |
| Low | Hard | Quick confirm |
| High | Easy | Suggest + apply |
| High | Hard | Explicit approval |

Explicit user requests skip approval -- the user has already approved by asking.
```
