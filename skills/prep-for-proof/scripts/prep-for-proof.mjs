#!/usr/bin/env node
// prep-for-proof: deterministic markdown preprocessing for Proof (proofeditor.ai).
// Canonical format contract: skills/prep-for-proof/SKILL.md — this file implements it,
// the test suite verifies it, and the plugin's proof-upload-gate hook derives "prepped"
// from the fixpoint property below. Zero dependencies; Node stdlib only.
//
// The three transforms:
//   1. Leading YAML frontmatter -> fenced ```yaml block (metadata stays visible).
//   2. Non-ASCII punctuation -> ASCII, outside fenced code and inline code spans.
//   3. Intra-paragraph soft line breaks unwrapped; block structure preserved.
// Output always uses LF line endings. "Prepped" is defined as fixpoint:
// prep(content) === content.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PUNCTUATION_MAP = [
  [/—/g, '--'], // em dash
  [/–/g, '-'], // en dash
  [/[‘’]/g, "'"], // smart single quotes
  [/[“”]/g, '"'], // smart double quotes
  [/…/g, '...'], // ellipsis
  [/→/g, '->'], // right arrow
  [/⇒/g, '=>'], // double right arrow
  [/←/g, '<-'], // left arrow
  [/ /g, ' '], // non-breaking space
];

const FENCE = /^ {0,3}(`{3,}|~{3,})/;
const HEADING = /^ {0,3}#{1,6}\s/;
const LIST_MARKER = /^\s*(?:[-*+]|\d{1,9}[.)])\s/;
const BLOCKQUOTE = /^ {0,3}>/;
const TABLE_ROW = /^\s*\|/;
const THEMATIC_BREAK = /^ {0,3}(?:-{3,}|\*{3,}|_{3,})\s*$/;
const SETEXT_UNDERLINE = /^ {0,3}=+\s*$/;
const INDENTED_CODE = /^(?: {4,}|\t)/;
const HARD_BREAK_END = /(?: {2,}|\\)$/;

function convertFrontmatter(lines) {
  if (lines[0] !== '---') return lines;
  const end = lines.indexOf('---', 1);
  if (end === -1) return lines;
  return ['```yaml', ...lines.slice(1, end), '```', ...lines.slice(end + 1)];
}

// Structural line: starts a block and must never be joined up into the previous line.
function isBlockStart(line) {
  return (
    HEADING.test(line) ||
    LIST_MARKER.test(line) ||
    BLOCKQUOTE.test(line) ||
    TABLE_ROW.test(line) ||
    THEMATIC_BREAK.test(line) ||
    SETEXT_UNDERLINE.test(line) ||
    INDENTED_CODE.test(line) ||
    FENCE.test(line)
  );
}

// May a continuation line be joined into this (already-emitted) line?
// Paragraph text and list-item lines: yes. Everything structural, blank lines,
// and lines ending in a markdown hard break (two spaces / backslash): no.
function isJoinable(line) {
  if (line === '') return false;
  if (HARD_BREAK_END.test(line)) return false;
  return !(
    HEADING.test(line) ||
    BLOCKQUOTE.test(line) ||
    TABLE_ROW.test(line) ||
    THEMATIC_BREAK.test(line) ||
    SETEXT_UNDERLINE.test(line) ||
    INDENTED_CODE.test(line) ||
    FENCE.test(line)
  );
}

// Normalize punctuation outside inline code spans.
function normalizePunctuation(line) {
  return line
    .split(/(`+[^`]*`+)/)
    .map((segment) => {
      if (segment.startsWith('`')) return segment;
      let out = segment;
      for (const [pattern, replacement] of PUNCTUATION_MAP) out = out.replace(pattern, replacement);
      return out;
    })
    .join('');
}

function transformBody(lines) {
  const out = [];
  let fenceMarker = null; // inside a fenced code block when non-null

  for (const line of lines) {
    if (fenceMarker !== null) {
      out.push(line);
      const close = line.match(FENCE);
      if (close && close[1][0] === fenceMarker) fenceMarker = null;
      continue;
    }

    const open = line.match(FENCE);
    if (open) {
      out.push(line);
      fenceMarker = open[1][0];
      continue;
    }

    const normalized = normalizePunctuation(line);
    const prev = out.length > 0 ? out[out.length - 1] : null;
    if (normalized !== '' && !isBlockStart(normalized) && prev !== null && isJoinable(prev)) {
      out[out.length - 1] = prev.replace(/\s+$/, '') + ' ' + normalized.replace(/^\s+/, '');
    } else {
      out.push(normalized);
    }
  }
  return out;
}

export function prep(text) {
  const lines = text.split(/\r?\n/);
  return transformBody(convertFrontmatter(lines)).join('\n');
}

function usage() {
  process.stderr.write(
    'Usage: node prep-for-proof.mjs <file.md> [--check | --write <out.md>]\n' +
      '  (no flag)        write the prepped markdown to stdout\n' +
      '  --check          exit 0 if <file.md> is already prepped (fixpoint), 1 if not\n' +
      '  --write <out>    write the prepped markdown to <out>; never overwrites the source\n',
  );
}

function main() {
  const args = process.argv.slice(2);
  let file = null;
  let check = false;
  let writeTarget = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--check') check = true;
    else if (args[i] === '--write') writeTarget = args[++i] ?? null;
    else if (file === null) file = args[i];
    else {
      usage();
      process.exit(2);
    }
  }

  if (file === null || (check && writeTarget !== null) || (writeTarget === null && args.includes('--write'))) {
    usage();
    process.exit(2);
  }

  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch (err) {
    process.stderr.write(`prep-for-proof: cannot read ${file}: ${err.message}\n`);
    process.exit(2);
  }

  const result = prep(text);

  if (check) {
    if (result === text) process.exit(0);
    process.stderr.write(`prep-for-proof: ${file} is not prepped for Proof\n`);
    process.exit(1);
  }

  if (writeTarget !== null) {
    if (resolve(writeTarget) === resolve(file)) {
      process.stderr.write('prep-for-proof: refusing to overwrite the source file; pick a different --write target\n');
      process.exit(2);
    }
    writeFileSync(writeTarget, result);
    return;
  }

  process.stdout.write(result);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main();
}
