#!/usr/bin/env node
// proof-upload-gate: PreToolUse hook for the bcal-workflow plugin.
//
// Ceiling: block-and-remind only. This hook NEVER rewrites the command, NEVER
// touches the file, and fails open on every internal error — a broken gate
// must not block legitimate work. It denies exactly one thing: a Bash command
// that uploads a checkable, un-prepped markdown file to a Proof write endpoint
// (POST /share/markdown or /api/agent/{slug}/rewrite). Read-only Proof calls,
// ops/marks calls, and commands that merely mention a proofeditor.ai URL pass.
//
// "Prepped" is the fixpoint check owned by the prep-for-proof skill's script;
// this gate runs it via an argv array (no shell) so content extracted from the
// untrusted command string can never be executed.

import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const PREP_SCRIPT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'skills',
  'prep-for-proof',
  'scripts',
  'prep-for-proof.mjs',
);

const WRITE_ENDPOINT = /proofeditor\.ai\/(?:share\/markdown|api\/agent\/[^\s"'`]+\/rewrite)\b/;

function diagnostic(message) {
  process.stderr.write(`proof-upload-gate: ${message}\n`);
}

function extractMarkdownPaths(command) {
  const paths = [];
  // Quoted paths first (may contain spaces), then bare tokens.
  for (const m of command.matchAll(/"([^"]+\.(?:md|markdown))"|'([^']+\.(?:md|markdown))'/gi)) {
    paths.push(m[1] ?? m[2]);
  }
  for (const m of command.matchAll(/[^\s"'`;|&<>@(){}[\]]+\.(?:md|markdown)\b/gi)) {
    paths.push(m[0]);
  }
  return paths;
}

function main() {
  let input;
  try {
    input = JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    return; // unreadable/malformed hook input: allow
  }

  const command = input?.tool_input?.command;
  if (input?.tool_name !== 'Bash' || typeof command !== 'string') return;

  if (!WRITE_ENDPOINT.test(command)) return; // not a Proof write call: allow, fast path

  const cwd = typeof input.cwd === 'string' ? input.cwd : process.cwd();
  const target = extractMarkdownPaths(command)
    .map((p) => resolve(cwd, p))
    .find((p) => existsSync(p));

  if (!target) {
    diagnostic('Proof write endpoint matched but no markdown file was found in the command; allowing (skill instructions remain the enforcement).');
    return;
  }

  // argv array, no shell: the untrusted path is data, never code.
  const check = spawnSync(process.execPath, [PREP_SCRIPT, target, '--check'], { stdio: 'ignore' });

  if (check.status === 0) return; // prepped: allow

  if (check.status === 1) {
    const prepped = target.replace(/\.(?:md|markdown)$/i, '.prepped.md');
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason:
            `${target} is not prepped for Proof (frontmatter/unicode/line-wrapping would render broken). ` +
            `Run: node "${PREP_SCRIPT}" "${target}" --write "${prepped}" ` +
            `then upload "${prepped}" instead of the source file. See the bcal-workflow prep-for-proof skill.`,
        },
      }),
    );
    return;
  }

  diagnostic(`--check did not complete (status ${check.status ?? 'unknown'}); allowing.`);
}

try {
  main();
} catch (err) {
  diagnostic(`internal error (${err?.message ?? err}); allowing.`);
}
process.exit(0);
