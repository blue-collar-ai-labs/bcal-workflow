import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { prep } from './prep-for-proof.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, 'prep-for-proof.mjs');
const RAW_FIXTURE = join(HERE, 'fixtures', 'hard-wrapped-unicode.md');
const PREPPED_FIXTURE = join(HERE, 'fixtures', 'hard-wrapped-unicode.prepped.md');

// --- Frontmatter (R1) ---

test('leading YAML frontmatter becomes a fenced yaml block with identical content', () => {
  const input = '---\ntitle: Test\nclient: Acme\n---\n\nBody text.\n';
  const expected = '```yaml\ntitle: Test\nclient: Acme\n```\n\nBody text.\n';
  assert.equal(prep(input), expected);
});

test('document without frontmatter is unchanged by the frontmatter transform', () => {
  const input = 'Just a paragraph.\n';
  assert.equal(prep(input), input);
});

test('document that is only frontmatter converts fully', () => {
  const input = '---\ntitle: Only\n---\n';
  assert.equal(prep(input), '```yaml\ntitle: Only\n```\n');
});

test('a later --- thematic break is not treated as frontmatter', () => {
  const input = 'Intro paragraph.\n\n---\n\nAfter the break.\n';
  assert.equal(prep(input), input);
});

// --- Punctuation normalization (R2) ---

test('each mapped character converts to its ASCII form', () => {
  const input = 'A—B C–D ‘e’ “f” g… h→i j⇒k l←m\n';
  assert.equal(prep(input), "A--B C-D 'e' \"f\" g... h->i j=>k l<-m\n");
});

test('unicode inside fenced code blocks is untouched', () => {
  const input = '```js\nconst s = “hello” — ok;\n```\n';
  assert.equal(prep(input), input);
});

test('unicode inside inline code spans is untouched', () => {
  const input = 'Use `a → b` outside → here.\n';
  assert.equal(prep(input), 'Use `a → b` outside -> here.\n');
});

test('CRLF input is normalized to LF output', () => {
  const input = 'Line one\r\nstill line one.\r\n\r\nPara two.\r\n';
  assert.equal(prep(input), 'Line one still line one.\n\nPara two.\n');
});

// --- Block-safe unwrapping (R3) ---

test('hard-wrapped paragraph joins to one logical line', () => {
  const input = 'This paragraph was wrapped\nat a narrow column width\nby some editor.\n';
  assert.equal(prep(input), 'This paragraph was wrapped at a narrow column width by some editor.\n');
});

test('blank lines are preserved as paragraph breaks', () => {
  const input = 'Para one line one\njoined here.\n\nPara two.\n';
  assert.equal(prep(input), 'Para one line one joined here.\n\nPara two.\n');
});

test('wrapped list-item continuation joins into the item', () => {
  const input = '- item one wraps\n  onto a second line\n- item two\n';
  assert.equal(prep(input), '- item one wraps onto a second line\n- item two\n');
});

test('ordered list markers are preserved and continuations join', () => {
  const input = '1. first item\n   continues here\n2. second item\n';
  assert.equal(prep(input), '1. first item continues here\n2. second item\n');
});

test('table rows are never joined', () => {
  const input = '| a | b |\n|---|---|\n| 1 | 2 |\n';
  assert.equal(prep(input), input);
});

test('blockquote lines are preserved and never receive joins', () => {
  const input = '> quoted line one\n> quoted line two\n';
  assert.equal(prep(input), input);
});

test('a plain continuation never joins into a blockquote line', () => {
  const input = '> quoted\nplain lazy continuation\n';
  assert.equal(prep(input), input);
});

test('headings never receive joins', () => {
  const input = '## Heading\nParagraph after heading\nwraps.\n';
  assert.equal(prep(input), '## Heading\nParagraph after heading wraps.\n');
});

test('thematic breaks are preserved and never joined', () => {
  const input = 'Before.\n\n---\n\nAfter\nwrapped.\n';
  assert.equal(prep(input), 'Before.\n\n---\n\nAfter wrapped.\n');
});

test('fenced code content is byte-preserved, including hard wraps', () => {
  const input = '```\nwrapped code\nstays wrapped\n```\n';
  assert.equal(prep(input), input);
});

test('a markdown hard break (two trailing spaces) is an intentional break and is not joined', () => {
  const input = 'Address line one  \nAddress line two\n';
  assert.equal(prep(input), input);
});

test('a backslash hard break is not joined', () => {
  const input = 'Line one\\\nLine two\n';
  assert.equal(prep(input), input);
});

test('indented code blocks are preserved', () => {
  const input = 'Paragraph.\n\n    indented code\n    more code\n\nAfter.\n';
  assert.equal(prep(input), input);
});

// --- Fixpoint / idempotency (R4, AE1) ---

const SAMPLES = [
  '---\nt: v\n---\n\nWrapped\nparagraph with — dash.\n',
  '- list\n  wrap\n\n> quote\n\n| t |\n|---|\n',
  '```\ncode → here\n```\nplain\nwrap\n',
];

test('prep(prep(x)) === prep(x) across samples', () => {
  for (const s of SAMPLES) {
    const once = prep(s);
    assert.equal(prep(once), once);
  }
});

test('raw fixture preps to the committed prepped fixture, byte-exact', () => {
  const raw = readFileSync(RAW_FIXTURE, 'utf8');
  const expected = readFileSync(PREPPED_FIXTURE, 'utf8');
  assert.equal(prep(raw), expected);
});

test('prepped fixture is a fixpoint: re-prep is byte-identical', () => {
  const prepped = readFileSync(PREPPED_FIXTURE, 'utf8');
  assert.equal(prep(prepped), prepped);
});

// --- CLI contract (R5) ---

function runCli(args, opts = {}) {
  return spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8', ...opts });
}

test('--check exits 1 on the raw fixture and 0 on the prepped fixture', () => {
  assert.equal(runCli([RAW_FIXTURE, '--check']).status, 1);
  assert.equal(runCli([PREPPED_FIXTURE, '--check']).status, 0);
});

test('default invocation writes the transformed result to stdout', () => {
  const res = runCli([RAW_FIXTURE]);
  assert.equal(res.status, 0);
  assert.equal(res.stdout, readFileSync(PREPPED_FIXTURE, 'utf8'));
});

test('--write writes the output file and leaves the source unmodified', () => {
  const dir = mkdtempSync(join(tmpdir(), 'prep-'));
  const src = join(dir, 'doc.md');
  const out = join(dir, 'doc.prepped.md');
  const original = '---\na: 1\n---\n\nWrapped\nline.\n';
  writeFileSync(src, original);
  const res = runCli([src, '--write', out]);
  assert.equal(res.status, 0);
  assert.equal(readFileSync(src, 'utf8'), original);
  assert.equal(readFileSync(out, 'utf8'), prep(original));
  rmSync(dir, { recursive: true, force: true });
});

test('--write refuses to overwrite the source file', () => {
  const dir = mkdtempSync(join(tmpdir(), 'prep-'));
  const src = join(dir, 'doc.md');
  writeFileSync(src, 'text\n');
  const res = runCli([src, '--write', src]);
  assert.equal(res.status, 2);
  assert.equal(readFileSync(src, 'utf8'), 'text\n');
  rmSync(dir, { recursive: true, force: true });
});

test('missing file argument exits 2', () => {
  assert.equal(runCli([]).status, 2);
});

test('unreadable file exits 2', () => {
  assert.equal(runCli([join(tmpdir(), 'prep-does-not-exist-xyz.md')]).status, 2);
});
