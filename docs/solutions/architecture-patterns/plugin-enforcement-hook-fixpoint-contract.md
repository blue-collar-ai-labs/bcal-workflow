---
title: Plugin Enforcement Hook Contract with Fixpoint Idempotency
date: 2026-07-09
category: architecture-patterns
module: prep-for-proof
problem_type: architecture_pattern
component: tooling
severity: medium
applies_when:
  - "adding a PreToolUse enforcement hook to a plugin"
  - "defining processed-content detection without marker state"
  - "gating write-shaped API calls extracted from untrusted command strings"
  - "deciding fail-open vs fail-closed behavior for hook errors"
  - "verifying working-tree plugin behavior before marketplace release"
tags: [plugin-hooks, pretooluse, fixpoint-idempotency, deterministic-enforcement, fail-open, command-injection-safety, defense-in-depth, headless-smoke-test]
related_components:
  - development_workflow
  - documentation
---

# Plugin Enforcement Hook Contract with Fixpoint Idempotency

## Context

Proof (proofeditor.ai) renders markdown unforgivingly: a single newline becomes a hard line break, non-ASCII punctuation shows as replacement characters, and raw `---` frontmatter delimiters garble the top of the document. Un-prepped uploads kept recurring, and each one read to reviewers as "the document is broken." The failure mode was not a missing tool — SKILL.md and CLAUDE.md already said to preprocess before uploading — it was that agents forget instructions under context pressure, and instruction-following degrades exactly when it matters (long sessions, delegated subagents, other platforms).

The fix shipped in bcal-workflow (commit 26d2e86) as the repo's **first hook**: a deterministic preprocessing script (`skills/prep-for-proof/scripts/prep-for-proof.mjs`) plus a PreToolUse gate (`hooks/scripts/proof-upload-gate.mjs`) that denies Bash uploads of un-prepped markdown to Proof write endpoints. With zero hooks precedent in the repo, the design contract had to be worked out from scratch — and most of what was learned is reusable for any plugin-shipped enforcement hook, not just this one.

Verified working: 40/40 node:test tests, plus real-harness smoke tests (`claude --plugin-dir <working tree> -p ...`) showing deny-on-un-prepped with remediation text, silence on read-only calls, and correct skill registration.

## Guidance

### Define "processed" as a fixpoint, not a marker

The core mechanism: **"prepped" means `prep(content) === content`**. The transform is its own validity check.

```js
// prep-for-proof.mjs --check
const result = prep(text);
if (check) {
  if (result === text) process.exit(0);
  process.stderr.write(`prep-for-proof: ${file} is not prepped for Proof\n`);
  process.exit(1);
}
```

One property serves three consumers:

1. **Agents on any platform** check state with `--check` (exit 0/1) — no Claude Code dependency.
2. **Idempotency is the same invariant** — `prep(prep(x)) === prep(x)` is a named test, not a separate guarantee.
3. **The hook derives its gate from the identical primitive** — it just runs `--check` on the candidate file.

Rejected alternatives: marker comments and sidecar state files. Both drift from content the moment the file is edited after processing; the fixpoint cannot drift because it *is* the content.

The consequence to accept up front: output must be canonical in **every** dimension, including line endings. The script normalizes CRLF to LF, so a CRLF file is by definition un-prepped. That in turn means byte-exact test fixtures need a `.gitattributes` `-text` pin — under `core.autocrlf=true` the suite would otherwise break only on Windows checkouts, which is a miserable class of CI failure to debug after the fact.

### The plugin enforcement-hook contract

Six rules that make a plugin-shipped deterministic hook safe to inflict on every consumer of the plugin.

**1. Matcher is tool-name-only; all content filtering lives in the script.** `hooks.json` matches nothing finer than the tool name:

```json
{ "hooks": { "PreToolUse": [ { "matcher": "Bash", "hooks": [
  { "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/scripts/proof-upload-gate.mjs\"" }
] } ] } }
```

The script's first action is a cheap string test with a silent exit for non-matching commands. This hook runs on **every Bash call for every plugin consumer**, so the fast path matters:

```js
const WRITE_ENDPOINT = /proofeditor\.ai\/(?:share\/markdown|api\/agent\/[^\s"'`]+\/rewrite)\b/;
// ...
if (!WRITE_ENDPOINT.test(command)) return; // not a Proof write call: allow, fast path
```

**2. Gate write-shaped operations only.** The regex matches the two write endpoints (`POST /share/markdown`, `/api/agent/{slug}/rewrite`) — not the domain. Read-only API calls, ops/marks calls, and commands that merely embed a proofeditor.ai URL all pass. This is not theoretical: a naive domain-string matcher would have broken the repo's own `end-session-gracefully` state read and `notify-proof` Slack posts. Enumerate what you deny; default-allow everything else.

**3. The command string is untrusted input.** Extract candidate file paths from it, but invoke the checker via an argv array — never shell-string concatenation:

```js
// argv array, no shell: the untrusted path is data, never code.
const check = spawnSync(process.execPath, [PREP_SCRIPT, target, '--check'], { stdio: 'ignore' });
```

Unit-test this with a crafted filename containing shell metacharacters, asserting no execution and no side effects.

**4. Fail open on every internal error, with a diagnostic.** Malformed stdin, no extractable path, node missing, checker crash — all allow, each with a one-line stderr message so misses are diagnosable in `claude --debug`:

```js
try {
  main();
} catch (err) {
  diagnostic(`internal error (${err?.message ?? err}); allowing.`);
}
process.exit(0);
```

A fail-closed hook that can't parse a heredoc upload hard-blocks legitimate work with no recovery path. Claude Code already defaults hook crashes to allow; align with that rather than fighting it.

**5. Block-and-remind is the ceiling.** The hook never rewrites the command and never touches the file. The deny message is an **agent-facing API**: it must carry the exact copy-paste remediation with real paths substituted (including the `--write` sibling target), or blocked agents retry-loop instead of recovering:

```js
permissionDecision: 'deny',
permissionDecisionReason:
  `${target} is not prepped for Proof (frontmatter/unicode/line-wrapping would render broken). ` +
  `Run: node "${PREP_SCRIPT}" "${target}" --write "${prepped}" ` +
  `then upload "${prepped}" instead of the source file. See the bcal-workflow prep-for-proof skill.`,
```

**6. Document coverage gaps honestly.** The SKILL.md Enforcement notes state plainly: the hook covers Claude Code's Bash tool only (PowerShell-tool uploads on Windows are not covered), and it requires `node` on PATH (native Claude Code installers don't bundle one). Therefore SKILL.md/CLAUDE.md instructions remain the **primary** enforcement on all platforms; the hook is defense-in-depth. Writing this down prevents the team from quietly assuming the hook is airtight and deleting the instructions.

### Pre-release verification against the working tree

Headless smoke tests must exercise the working tree, not the installed marketplace cache — `--plugin-dir` is what makes that happen:

```
claude --plugin-dir "<working tree>" -p "<one-shot prompt>" --allowedTools Bash --max-turns 4
```

Used to prove three things before commit: the deny fires with the remediation text, read-only Proof calls pass untouched, and the skill registers under its plugin prefix. Without `--plugin-dir` you would be smoke-testing yesterday's published plugin and rubber-stamping today's uncommitted changes.

## Why This Matters

- **Instructions decay; invariants don't.** The fixpoint definition turns "did the agent remember to prep?" into a machine-checkable property that three independent consumers (cross-platform agents, the test suite, the hook) verify from one primitive. There is no marker or sidecar to drift out of sync with the content.
- **Plugin hooks run in other people's sessions.** Unlike a repo-local hook, a plugin-shipped hook executes on every matching tool call for every consumer. The contract rules — fast-path exit, write-only gating, fail-open, block-and-remind ceiling — are what keep a well-meaning gate from becoming a plugin-wide denial-of-service.
- **The deny message is part of the product.** The consumer of a PreToolUse deny is an agent mid-task. A deny with exact remediation self-heals in one turn; a bare deny produces retry loops and burned context.
- **Hook command strings are an injection surface.** Any hook that extracts data from a tool command and passes it to another process must treat that data as hostile. The argv-array rule plus a metacharacter-filename test makes the guarantee verifiable rather than aspirational.
- **Honest gap documentation preserves layered defense.** Naming what the hook does *not* cover keeps the instruction layer alive instead of being "cleaned up" once the hook exists.

## When to Apply

- Designing any "has this file/content been processed?" check — prefer a fixpoint (`transform(x) === x`) over marker comments, sidecar files, or filename conventions whenever the transform is deterministic.
- Shipping a hook inside a plugin (rather than a single repo), where it will run on every matching tool call for every consumer.
- Gating an external write/upload/publish operation from a PreToolUse hook — enumerate write endpoints; never gate on domain presence alone.
- Any hook that parses file paths, URLs, or arguments out of a tool command string and hands them to a subprocess.
- Deciding a hook's failure posture: default to fail-open with stderr diagnostics unless the gated action is irreversible and dangerous.
- Writing a deny message that an agent (not a human) will consume.
- Producing byte-canonical output that tests compare exactly, on a team with Windows checkouts (`.gitattributes` `-text` pin).
- Verifying plugin changes before commit — use `claude --plugin-dir <working tree> -p ...` so smokes hit uncommitted code, not the installed cache.

## Examples

**The deny an agent sees, and how it recovers.** An agent runs a curl upload of an un-prepped file:

```
curl -X POST https://proofeditor.ai/share/markdown ... -d @docs/proposal.md
```

The hook denies with:

```
C:\...\docs\proposal.md is not prepped for Proof (frontmatter/unicode/line-wrapping
would render broken). Run: node "<plugin>/skills/prep-for-proof/scripts/prep-for-proof.mjs"
"C:\...\docs\proposal.md" --write "C:\...\docs\proposal.prepped.md" then upload
"C:\...\docs\proposal.prepped.md" instead of the source file.
```

The agent copy-pastes the command verbatim, uploads the `.prepped.md` sibling, and the gate passes (`--check` exits 0). No human intervention, one extra turn.

**What passes without a whisper.** A read-only status call (`curl https://proofeditor.ai/api/agent/xyz/state`) or a Slack message that merely contains a Proof link — the `WRITE_ENDPOINT` regex doesn't match, the hook exits silently on the fast path. A domain-only matcher would have broken both of the repo's own skills that read Proof state.

**The injection test.** A unit test crafts a command referencing a markdown file named with shell metacharacters, feeds it to the hook as stdin, and asserts the checker was invoked with the name as a single argv element — no command execution, no side effects. This is the test that proves the `spawnSync(process.execPath, [PREP_SCRIPT, target, '--check'])` argv discipline, and it fails immediately if anyone "simplifies" the call into a shell string.

**Fail-open in practice.** Feed the hook malformed JSON on stdin, or a command that matches the write endpoint but contains no resolvable `.md` path (a heredoc upload): the hook prints a one-line `proof-upload-gate:` diagnostic to stderr and allows. The upload proceeds under the instruction-layer enforcement, and the miss is visible in `claude --debug` rather than silently swallowed.

## Related

- [Cross-repo file formats need a single canonical definition](../conventions/cross-repo-file-canonical-format-contract-2026-05-14.md) — the fixpoint `--check` primitive instantiates this doc's canonical-definition principle for a hook-enforced gate.
- [Specify shell-specific commands in skill instructions](../conventions/shell-specific-env-var-commands-2026-05-14.md) — sibling shell-safety lesson; the argv-array rule extends the same "be explicit about shell semantics or fail silently" principle.
