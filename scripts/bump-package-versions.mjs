#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = process.cwd();

const runGit = (args) =>
  execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' });

const readGitFile = (spec) => {
  try {
    return runGit(['show', spec]);
  } catch {
    return null;
  }
};

const parseVersion = (content, packagePath) => {
  let parsed;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`${packagePath} is not valid JSON`);
  }

  if (typeof parsed.version !== 'string') {
    throw new Error(`${packagePath} does not contain a string "version" field`);
  }

  return parsed.version;
};

const bumpPatchVersion = (version, packagePath) => {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);

  if (!match) {
    throw new Error(`${packagePath} has unsupported version format "${version}"`);
  }

  const nextPatch = Number(match[3]) + 1;
  return `${match[1]}.${match[2]}.${nextPatch}`;
};

const getStagedFiles = () => {
  const output = runGit(['diff', '--cached', '--name-only']);
  return output
    .split('\n')
    .map((file) => file.trim())
    .filter((file) => file.length > 0);
};

const hasUnstagedChanges = (packagePath) => {
  const output = runGit(['diff', '--name-only', '--', packagePath]);
  return output.trim().length > 0;
};

const hasStagedVersionChange = (packagePath) => {
  const headContent = readGitFile(`HEAD:${packagePath}`);
  const stagedContent = readGitFile(`:${packagePath}`);

  if (!headContent || !stagedContent) {
    return false;
  }

  const headVersion = parseVersion(headContent, packagePath);
  const stagedVersion = parseVersion(stagedContent, packagePath);

  return headVersion !== stagedVersion;
};

const bumpPackageVersion = (packagePath) => {
  if (hasUnstagedChanges(packagePath)) {
    throw new Error(
      `${packagePath} has unstaged changes. Stage or discard them before committing.`,
    );
  }

  if (hasStagedVersionChange(packagePath)) {
    console.log(
      `[version-bump] Skipping ${packagePath}: staged version already differs from HEAD`,
    );
    return;
  }

  const absolutePath = join(repoRoot, packagePath);

  if (!existsSync(absolutePath)) {
    throw new Error(`${packagePath} not found`);
  }

  const content = readFileSync(absolutePath, 'utf8');
  const data = JSON.parse(content);
  const currentVersion = parseVersion(content, packagePath);
  const nextVersion = bumpPatchVersion(currentVersion, packagePath);

  data.version = nextVersion;

  writeFileSync(absolutePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  runGit(['add', packagePath]);

  console.log(`[version-bump] ${packagePath}: ${currentVersion} -> ${nextVersion}`);
};

const main = () => {
  const stagedFiles = getStagedFiles();

  const shouldBumpBack = stagedFiles.some((file) => file.startsWith('back/'));
  const shouldBumpFront = stagedFiles.some((file) => file.startsWith('front/'));
  const shouldBumpRoot = stagedFiles.some(
    (file) => !file.startsWith('back/') && !file.startsWith('front/'),
  );

  if (!shouldBumpBack && !shouldBumpFront && !shouldBumpRoot) {
    console.log('[version-bump] No matching staged changes found');
    return;
  }

  if (shouldBumpBack) {
    bumpPackageVersion('back/package.json');
  }

  if (shouldBumpFront) {
    bumpPackageVersion('front/package.json');
  }

  if (shouldBumpRoot) {
    bumpPackageVersion('package.json');
  }
};

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[version-bump] ${message}`);
  process.exit(1);
}
