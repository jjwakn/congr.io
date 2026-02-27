#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const SUPPORTED_EXTENSIONS = ['.ts', '.tsx', '.json', '.css', '.md', '.html'];
const CHUNK_SIZE = 100;

const runGit = (args) =>
  execFileSync('git', args, { cwd: process.cwd(), encoding: 'utf8' });

const stagedFiles = runGit([
  'diff',
  '--cached',
  '--name-only',
  '--diff-filter=ACMR',
])
  .split('\n')
  .map((file) => file.trim())
  .filter(Boolean);

const filesToFormat = stagedFiles.filter(
  (file) =>
    existsSync(file) &&
    SUPPORTED_EXTENSIONS.some((extension) => file.endsWith(extension)),
);

if (!filesToFormat.length) {
  console.log('[format-staged] No staged files require formatting');
  process.exit(0);
}

for (let index = 0; index < filesToFormat.length; index += CHUNK_SIZE) {
  const chunk = filesToFormat.slice(index, index + CHUNK_SIZE);
  execFileSync('yarn', ['prettier', '--write', ...chunk], {
    cwd: process.cwd(),
    stdio: 'inherit',
  });
}

execFileSync('git', ['add', '--', ...filesToFormat], {
  cwd: process.cwd(),
  stdio: 'inherit',
});

console.log(`[format-staged] Formatted and staged ${filesToFormat.length} file(s)`);
