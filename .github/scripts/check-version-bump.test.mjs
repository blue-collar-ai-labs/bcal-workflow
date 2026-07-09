import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate } from './check-version-bump.mjs';

// Shared base state: after the unification reconciliation both manifests sit at
// the same value on main, so a valid release moves both to one new value.
const BASE = { claudeBase: '1.0.0', codexBase: '1.0.0' };

test('source touched, both bumped to same new value -> pass', () => {
  const r = evaluate({
    changedPaths: ['skills/write-to-diary/SKILL.md'],
    ...BASE,
    claudeHead: '1.0.1',
    codexHead: '1.0.1',
  });
  assert.equal(r.ok, true);
});

test('source touched, neither bumped -> fail, names both manifests', () => {
  const r = evaluate({
    changedPaths: ['skills/write-to-diary/SKILL.md'],
    ...BASE,
    claudeHead: '1.0.0',
    codexHead: '1.0.0',
  });
  assert.equal(r.ok, false);
  assert.match(r.reason, /\.claude-plugin\/plugin\.json/);
  assert.match(r.reason, /\.codex-plugin\/plugin\.json/);
});

test('source touched, only claude bumped -> fail, names codex', () => {
  const r = evaluate({
    changedPaths: ['hooks/scripts/proof-upload-gate.mjs'],
    ...BASE,
    claudeHead: '1.0.1',
    codexHead: '1.0.0',
  });
  assert.equal(r.ok, false);
  assert.match(r.reason, /\.codex-plugin\/plugin\.json/);
  assert.doesNotMatch(r.reason, /\.claude-plugin\/plugin\.json/);
});

test('source touched, only codex bumped -> fail, names claude', () => {
  const r = evaluate({
    changedPaths: ['skills/prep-for-proof/scripts/prep-for-proof.mjs'],
    ...BASE,
    claudeHead: '1.0.0',
    codexHead: '1.0.1',
  });
  assert.equal(r.ok, false);
  assert.match(r.reason, /\.claude-plugin\/plugin\.json/);
  assert.doesNotMatch(r.reason, /\.codex-plugin\/plugin\.json/);
});

test('source touched, both bumped to different values -> fail', () => {
  const r = evaluate({
    changedPaths: ['skills/write-to-diary/SKILL.md'],
    ...BASE,
    claudeHead: '1.0.1',
    codexHead: '1.0.2',
  });
  assert.equal(r.ok, false);
  assert.match(r.reason, /different values/);
});

test('no source touched (docs/README only) -> pass regardless of version', () => {
  const r = evaluate({
    changedPaths: ['README.md', 'docs/solutions/x.md'],
    ...BASE,
    claudeHead: '1.0.0',
    codexHead: '1.0.0',
  });
  assert.equal(r.ok, true);
});

test('path anchoring: lookalikes are not source, real paths are', () => {
  const notSource = evaluate({
    changedPaths: ['myskills/x.md', 'docs/skills-note.md'],
    ...BASE,
    claudeHead: '1.0.0',
    codexHead: '1.0.0',
  });
  assert.equal(notSource.ok, true, 'myskills/ and docs/skills-note.md must not count as source');

  const realSource = evaluate({
    changedPaths: ['skills/a/SKILL.md', 'hooks/scripts/y.mjs'],
    ...BASE,
    claudeHead: '1.0.0',
    codexHead: '1.0.0',
  });
  assert.equal(realSource.ok, false, 'skills/ and hooks/ paths must count as source');
});

test('manifest-only change with no source -> pass', () => {
  const r = evaluate({
    changedPaths: ['.claude-plugin/plugin.json', '.codex-plugin/plugin.json'],
    ...BASE,
    claudeHead: '1.0.1',
    codexHead: '1.0.1',
  });
  assert.equal(r.ok, true);
});

test('empty changedPaths -> pass', () => {
  const r = evaluate({
    changedPaths: [],
    ...BASE,
    claudeHead: '1.0.0',
    codexHead: '1.0.0',
  });
  assert.equal(r.ok, true);
});
