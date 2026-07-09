---
name: prep-for-proof
description: "Preprocess markdown before uploading it to Proof (proofeditor.ai): convert YAML frontmatter to a fenced yaml block, normalize unicode punctuation to ASCII, and unwrap hard-wrapped paragraphs. Run before any Proof upload."
---

# prep-for-proof

Deterministically transform a markdown file so it renders cleanly in Proof. Proof renders a single newline as a hard line break, shows non-ASCII punctuation as replacement characters, and garbles raw `---` frontmatter delimiters — un-prepped uploads read to reviewers as "the document is broken." This skill wraps the bundled script `scripts/prep-for-proof.mjs`, which is the single implementation of the canonical format below.

## Canonical Output Format

Prepped markdown satisfies all of the following. "Prepped" is machine-checkable and defined as a fixpoint: running the script on a prepped file returns byte-identical output (`--check` exits 0).

1. **Frontmatter**: a leading `---`-delimited YAML block is converted to a fenced ` ```yaml ` code block. The metadata stays visible to reviewers; its content is byte-preserved (no punctuation changes inside it).
2. **Punctuation** is ASCII outside fenced code blocks and inline code spans:

   | Replace | With |
   |---|---|
   | `—` (em dash) | `--` |
   | `–` (en dash) | `-` |
   | Smart single quotes | `'` |
   | Smart double quotes | `"` |
   | Ellipsis character | `...` |
   | `→` / `⇒` / `←` | `->` / `=>` / `<-` |
   | Non-breaking space | regular space |

   (The mapping matches `notify-proof`'s Slack sanitization table; the em dash maps to `--` without surrounding spaces, and arrows are additional here.)
3. **Paragraphs are one logical line.** Consecutive prose lines are joined with a single space. Preserved as-is: blank lines, headings, list markers (`-`/`*`/`+`/`N.`/`N)`), blockquote lines (`>`), table rows (`|`), thematic breaks, setext underlines, indented code (4+ spaces or tab), and everything inside fenced code blocks. A line ending in a markdown hard break (two trailing spaces or a backslash) marks the break after it as intentional — the next line is not joined. Nothing is ever joined into a heading, fence, table row, blockquote, or thematic break.
4. **Line endings are LF.** CRLF input is normalized, so a CRLF file is by definition not yet prepped.
5. **The source file is never modified.** Prepped output goes to stdout or to a `--write` target; the script refuses `--write` onto its own input. Convention: write the sibling `<name>.prepped.md` and upload that file. The source stays canonical for tools that parse real YAML frontmatter (glow-up render, proposal-pro).

## Steps

### 1. Check Node availability

Run `node --version` (any supported Node works; no dependencies are installed). If the command is not found, tell the user:

```
prep-for-proof needs Node.js on PATH and it was not found.
Native Claude Code installs do not bundle a `node` on PATH — install Node from
https://nodejs.org (or via your package manager), then retry.
Note: without Node, the Proof upload hook is also inactive (it fails open).
```

Then stop — do not proceed.

### 2. Locate the script

The script lives at `${CLAUDE_SKILL_DIR}/scripts/prep-for-proof.mjs` (Claude Code substitutes the variable; requires v2.1.196+). If the variable is not substituted in your harness (Codex, Gemini, older Claude Code), resolve the path manually: it is `skills/prep-for-proof/scripts/prep-for-proof.mjs` inside the installed bcal-workflow plugin directory, and use that literal absolute path in the commands below.

### 3. Prep the file

Write the prepped output to the sibling `<name>.prepped.md` — never onto the source.

Bash tool:

```bash
node "<script path>" "docs/proposal.md" --write "docs/proposal.prepped.md"
```

PowerShell tool:

```powershell
node "<script path>" "docs\proposal.md" --write "docs\proposal.prepped.md"
```

Substitute the literal script path from step 2 for `<script path>` in either shell.

### 4. Verify

```bash
node "<script path>" "docs/proposal.prepped.md" --check
```

Exit 0 means prepped; exit 1 means not prepped (something went wrong — do not upload). The same `--check` is what the plugin's Proof upload hook runs.

### 5. Upload the prepped file

Hand the `.prepped.md` file to whatever performs the upload (`ce-proof`, proposal-pro, or a direct API call). Upload the prepped sibling, not the source. The frontmatter appears in Proof as a visible fenced yaml block — this is the approved way to "include frontmatter" per the Proof Integration guidance. Delete the `.prepped.md` sibling after a successful upload unless the user wants to keep it.

## Enforcement notes

- These instructions are the primary enforcement on every platform. On Claude Code only, the plugin also ships a PreToolUse hook (`hooks/scripts/proof-upload-gate.mjs`) that denies Bash uploads to Proof write endpoints when the referenced `.md` file fails `--check`. The hook is defense-in-depth: it matches only the Bash tool (PowerShell-tool uploads are not covered), never rewrites commands or files, and fails open on any internal error.
- Running prep twice is safe — the transform is idempotent by definition (fixpoint).
