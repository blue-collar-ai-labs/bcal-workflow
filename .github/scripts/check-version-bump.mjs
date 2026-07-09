#!/usr/bin/env node
// check-version-bump: release-discipline guard for the bcal-workflow plugin.
//
// Rule (see docs/solutions/plugin-version-bump-update-detection-2026-05-04.md):
// a PR that changes any file under skills/ or hooks/ must bump BOTH manifest
// versions off the base branch AND to the same new value. Non-source PRs pass
// regardless of version. The rule lives in the pure evaluate() function so it is
// unit-testable with fixtures; the CLI wrapper does the git plumbing side.
//
// CLI contract (used by .github/workflows/version-guard.yml):
//   git diff --name-only <base>...<head> | node check-version-bump.mjs \
//     --claude-base X --codex-base Y --claude-head A --codex-head B
// Changed paths arrive on stdin, one per line. Exits 0 (pass) or 1 (fail) and
// prints "PASS: <reason>" / "FAIL: <reason>".

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE_RE = /^(skills|hooks)\//;

const CLAUDE_MANIFEST = '.claude-plugin/plugin.json';
const CODEX_MANIFEST = '.codex-plugin/plugin.json';

/**
 * Pure decision core. No git, fs, or network — inputs in, verdict out.
 * @param {{changedPaths: string[], claudeBase: string, codexBase: string,
 *          claudeHead: string, codexHead: string}} input
 * @returns {{ok: boolean, reason: string}}
 */
export function evaluate({ changedPaths, claudeBase, codexBase, claudeHead, codexHead }) {
  const sourceTouched = changedPaths.some((p) => SOURCE_RE.test(p));
  if (!sourceTouched) {
    return { ok: true, reason: 'no change under skills/ or hooks/; version bump not required' };
  }

  const claudeBumped = claudeHead !== claudeBase;
  const codexBumped = codexHead !== codexBase;
  if (!claudeBumped || !codexBumped) {
    const missing = [
      !claudeBumped && `${CLAUDE_MANIFEST} (still ${claudeBase})`,
      !codexBumped && `${CODEX_MANIFEST} (still ${codexBase})`,
    ].filter(Boolean).join(' and ');
    return {
      ok: false,
      reason: `source under skills/ or hooks/ changed but not bumped: ${missing}. Bump both manifests to the same new value.`,
    };
  }

  if (claudeHead !== codexHead) {
    return {
      ok: false,
      reason: `manifests bumped to different values (${CLAUDE_MANIFEST}=${claudeHead}, ${CODEX_MANIFEST}=${codexHead}); both must be the same new value.`,
    };
  }

  return { ok: true, reason: `both manifests bumped to ${claudeHead}` };
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) out[argv[i].slice(2)] = argv[i + 1];
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  let stdin = '';
  try {
    stdin = readFileSync(0, 'utf8');
  } catch {
    stdin = '';
  }
  const changedPaths = stdin.split('\n').map((s) => s.trim()).filter(Boolean);

  const result = evaluate({
    changedPaths,
    claudeBase: args['claude-base'] ?? '',
    codexBase: args['codex-base'] ?? '',
    claudeHead: args['claude-head'] ?? '',
    codexHead: args['codex-head'] ?? '',
  });

  process.stdout.write(`${result.ok ? 'PASS' : 'FAIL'}: ${result.reason}\n`);
  process.exit(result.ok ? 0 : 1);
}

// Run main only when executed directly, not when imported by the test.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
