#!/usr/bin/env node
import fs from 'node:fs';

const commitMsgFile = process.argv[2];

if (!commitMsgFile) {
  console.error('[commit-msg] Missing commit message file path');
  process.exit(1);
}

const message = fs.readFileSync(commitMsgFile, 'utf8');
const header = message
  .split(/\r?\n/)
  .map((line) => line.trim())
  .find((line) => line.length > 0 && !line.startsWith('#'));

if (!header) {
  console.error('[commit-msg] Empty commit message');
  process.exit(1);
}

if (header.startsWith('Merge ') || header.startsWith('Revert "')) {
  process.exit(0);
}

const normalizedHeader = header.replace(/^(fixup|squash)! /, '');
const typePattern =
  'build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test';
const conventionalPattern = new RegExp(
  `^(${typePattern})(\\([a-z0-9._/-]+\\))?(!)?: .+`,
);

if (conventionalPattern.test(normalizedHeader)) {
  process.exit(0);
}

console.error('[commit-msg] Invalid commit message format');
console.error(
  '[commit-msg] Expected: type(scope?): description, e.g. feat(auth): add login',
);
console.error(
  '[commit-msg] Allowed types: build, chore, ci, docs, feat, fix, perf, refactor, revert, style, test',
);
process.exit(1);
