```yaml
title: Fixture — Hard-Wrapped & Unicode-Heavy
client: Acme Corp
type: proposal
status: draft
```

# Proposal Overview

This opening paragraph was hard-wrapped at a narrow column by an editor -- it uses an em dash, "smart double quotes", 'smart single quotes', and an ellipsis... plus an arrow -> to prove the point. It should become one logical line with ASCII punctuation.

The timeline runs May-June (an en dash) and the flow is A => B, with the reverse path written <- like that.

## Scope

- The first list item wraps onto a continuation line that should join it
- The second item stays alone
- A third item mentions `inline → code` which must keep its arrow while this wrapped tail joins

1. Ordered item one wraps across a line
2. Ordered item two

## Details

> A blockquote line -- its dash converts but the line stays its own line.
> A second quoted line that must not merge with the first.

| Phase | Dates -- 2026 |
|-------|--------------|
| One   | May-June     |
| Two   | July-August  |

```js
// Code is sacrosanct: “quotes”, — dashes, and arrows → stay,
// and these wrapped lines
// stay wrapped.
const x = 'a — b';
```

---

Signature block below uses intentional hard breaks:

Jane Doe  
Blue Collar AI Labs  
Springfield

    indented code line one
    indented code line two

A final paragraph that wraps one more time to close things out.
