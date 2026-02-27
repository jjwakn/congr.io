#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const projects = [
  { name: 'frontend', dir: 'front/src/locales' },
  { name: 'backend', dir: 'back/src/locales' },
];

const referenceLang = 'en';

const collectJsonFiles = (baseDir) => {
  const result = [];

  const walk = (currentDir) => {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(absolutePath);
        continue;
      }

      if (entry.isFile() && entry.name.endsWith('.json')) {
        result.push(absolutePath);
      }
    }
  };

  walk(baseDir);
  return result.sort();
};

const assignNestedValue = (target, segments, value) => {
  let current = target;

  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    if (!current[segment] || typeof current[segment] !== 'object') {
      current[segment] = {};
    }
    current = current[segment];
  }

  current[segments[segments.length - 1]] = value;
};

const loadLocales = (dir) => {
  if (!fs.existsSync(dir)) {
    console.warn(`Locales directory not found: ${dir}`);
    return {};
  }

  const locales = {};
  const languages = fs
    .readdirSync(dir)
    .filter((f) => fs.statSync(path.join(dir, f)).isDirectory());

  for (const lang of languages) {
    locales[lang] = {};

    const languageDir = path.join(dir, lang);
    const files = collectJsonFiles(languageDir);

    for (const absolutePath of files) {
      const relativePath = path.relative(languageDir, absolutePath);
      const keySegments = relativePath
        .replace(/\.json$/i, '')
        .split(path.sep)
        .filter(Boolean);
      let content;

      try {
        content = JSON.parse(fs.readFileSync(absolutePath, 'utf-8'));
      } catch {
        throw new Error(`Invalid JSON in ${absolutePath}`);
      }

      assignNestedValue(locales[lang], keySegments, content);
    }
  }

  return locales;
};

const flatten = (obj, prefix = '') =>
  Object.entries(obj).reduce((acc, [k, v]) => {
    const newKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null) {
      Object.assign(acc, flatten(v, newKey));
    } else {
      acc[newKey] = v;
    }
    return acc;
  }, {});

const checkLocales = (projectName, locales) => {
  const langs = Object.keys(locales).sort();

  if (!langs.length) {
    console.error(`[${projectName}] No locale languages found`);
    return false;
  }

  if (!langs.includes(referenceLang)) {
    console.error(
      `[${projectName}] Missing reference language directory: ${referenceLang}`,
    );
    return false;
  }

  const flat = Object.fromEntries(langs.map((l) => [l, flatten(locales[l])]));

  const refKeys = new Set(Object.keys(flat[referenceLang]));
  let hasErrors = false;

  for (const lang of langs) {
    if (lang === referenceLang) continue;
    const keys = new Set(Object.keys(flat[lang]));
    const missingKeys = [];
    const extraKeys = [];

    for (const k of refKeys) {
      if (!keys.has(k)) {
        missingKeys.push(k);
      }
    }

    for (const k of keys) {
      if (!refKeys.has(k)) {
        extraKeys.push(k);
      }
    }

    if (missingKeys.length) {
      hasErrors = true;
      console.error(`[${projectName}][${lang}] Missing keys:`);
      missingKeys.forEach((key) => console.error(`  - ${key}`));
    }

    if (extraKeys.length) {
      hasErrors = true;
      console.error(`[${projectName}][${lang}] Extra keys:`);
      extraKeys.forEach((key) => console.error(`  - ${key}`));
    }
  }

  if (!hasErrors) {
    console.info(
      `[${projectName}] OK (${langs.length} languages checked against "${referenceLang}")`,
    );
  }

  return !hasErrors;
};

let hasValidationErrors = false;

for (const project of projects) {
  console.info(`\n🔍 Checking ${project.name} (${project.dir})`);
  try {
    const locales = loadLocales(project.dir);
    const isValid = checkLocales(project.name, locales);
    if (!isValid) hasValidationErrors = true;
  } catch (error) {
    hasValidationErrors = true;
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${project.name}] ${message}`);
  }
}

if (hasValidationErrors) {
  process.exit(1);
}
