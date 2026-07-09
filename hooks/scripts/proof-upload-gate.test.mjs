import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const GATE = join(HERE, 'proof-upload-gate.mjs');
const RAW_FIXTURE = join(HERE, '..', '..', 'skills', 'prep-for-proof', 'scripts', 'fixtures', 'hard-wrapped-unicode.md');
const PREPPED_FIXTURE = join(HERE, '..', '..', 'skills', 'prep-for-proof', 'scripts', 'fixtures', 'hard-wrapped-unicode.prepped.md');

function runGate(stdinText) {
  return spawnSync(process.execPath, [GATE], { input: stdinText, encoding: 'utf8' });
}

function bashEvent(command) {
  return JSON.stringify({
    hook_event_name: 'PreToolUse',
    tool_name: 'Bash',
    tool_input: { command },
    cwd: process.cwd(),
  });
}

function parseDeny(stdout) {
  const parsed = JSON.parse(stdout);
  assert.equal(parsed.hookSpecificOutput.hookEventName, 'PreToolUse');
  assert.equal(parsed.hookSpecificOutput.permissionDecision, 'deny');
  return parsed.hookSpecificOutput.permissionDecisionReason;
}

// --- AE2: block and remediate ---

test('un-prepped upload to /share/markdown is denied with a remediation command', () => {
  const cmd = `jq -Rs '{title:"Doc",markdown:.}' "${RAW_FIXTURE}" | curl -s -X POST https://www.proofeditor.ai/share/markdown -H "Content-Type: application/json" -d @-`;
  const res = runGate(bashEvent(cmd));
  assert.equal(res.status, 0);
  const reason = parseDeny(res.stdout);
  assert.ok(reason.includes(RAW_FIXTURE));
  assert.ok(reason.includes('prep-for-proof.mjs'));
  assert.ok(reason.includes('--write'));
  assert.ok(reason.includes('.prepped.md'));
});

test('the same upload with the prepped fixture is allowed', () => {
  const cmd = `jq -Rs '{title:"Doc",markdown:.}' "${PREPPED_FIXTURE}" | curl -s -X POST https://www.proofeditor.ai/share/markdown -H "Content-Type: application/json" -d @-`;
  const res = runGate(bashEvent(cmd));
  assert.equal(res.status, 0);
  assert.equal(res.stdout, '');
});

test('un-prepped whole-doc replacement via /rewrite is denied', () => {
  const cmd = `curl -s -X POST "https://www.proofeditor.ai/api/agent/abc123/rewrite" -d @"${RAW_FIXTURE}"`;
  const res = runGate(bashEvent(cmd));
  assert.equal(res.status, 0);
  parseDeny(res.stdout);
});

// --- AE3: reads and embedded URLs pass ---

test('read-only state fetch is allowed silently', () => {
  const cmd = 'curl -s "https://www.proofeditor.ai/api/agent/abc123/state" -H "x-share-token: xxx"';
  const res = runGate(bashEvent(cmd));
  assert.equal(res.status, 0);
  assert.equal(res.stdout, '');
  assert.equal(res.stderr, '');
});

test('Slack post embedding a proofeditor.ai document URL is allowed silently', () => {
  const cmd = 'curl -s -X POST -H "Authorization: Bearer $SLACK_BOT_TOKEN" --data-binary @/tmp/slack-payload.json https://slack.com/api/chat.postMessage # links https://www.proofeditor.ai/d/abc?token=x';
  const res = runGate(bashEvent(cmd));
  assert.equal(res.status, 0);
  assert.equal(res.stdout, '');
  assert.equal(res.stderr, '');
});

test('ops/marks comment call is allowed silently', () => {
  const cmd = `curl -s -X POST "https://www.proofeditor.ai/api/agent/abc123/ops" -d '{"kind":"comment"}'`;
  const res = runGate(bashEvent(cmd));
  assert.equal(res.status, 0);
  assert.equal(res.stdout, '');
});

// --- Fail-open paths ---

test('malformed stdin JSON is allowed', () => {
  const res = runGate('this is not json');
  assert.equal(res.status, 0);
  assert.equal(res.stdout, '');
});

test('write endpoint with no extractable markdown file fails open with a diagnostic', () => {
  const cmd = `curl -s -X POST https://www.proofeditor.ai/share/markdown -d '{"title":"T","markdown":"inline body"}'`;
  const res = runGate(bashEvent(cmd));
  assert.equal(res.status, 0);
  assert.equal(res.stdout, '');
  assert.ok(res.stderr.includes('proof-upload-gate'));
});

test('non-Bash tool events are allowed', () => {
  const res = runGate(JSON.stringify({ tool_name: 'WebFetch', tool_input: { url: 'https://www.proofeditor.ai/share/markdown' } }));
  assert.equal(res.status, 0);
  assert.equal(res.stdout, '');
});

// --- Injection safety ---

test('a crafted filename with shell metacharacters is data, never code', () => {
  const dir = mkdtempSync(join(tmpdir(), 'gate-'));
  const evil = join(dir, 'inj; echo pwned.md');
  writeFileSync(evil, 'Un-prepped — content\nwrapped line.\n');
  const before = readdirSync(dir).sort();
  const cmd = `curl -s -X POST https://www.proofeditor.ai/share/markdown -d @"${evil}"`;
  const res = runGate(bashEvent(cmd));
  assert.equal(res.status, 0);
  const reason = parseDeny(res.stdout);
  assert.ok(reason.includes('inj; echo pwned.md'));
  assert.ok(!res.stdout.includes('pwned\n'), 'no injected command output');
  assert.deepEqual(readdirSync(dir).sort(), before, 'no filesystem side effects');
  assert.equal(readFileSync(evil, 'utf8'), 'Un-prepped — content\nwrapped line.\n', 'file untouched');
  rmSync(dir, { recursive: true, force: true });
});
