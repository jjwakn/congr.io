#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const projects = [
  { name: 'frontend', dir: 'front/src/locales' },
  { name: 'backend', dir: 'back/src/locales' },
];

const referenceLang = 'en';

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
    const files = fs
      .readdirSync(path.join(dir, lang))
      .filter((f) => f.endsWith('.json'));

    for (const file of files) {
      const key = path.basename(file, '.json');
      const content = JSON.parse(
        fs.readFileSync(path.join(dir, lang, file), 'utf-8'),
      );
      locales[lang][key] = content;
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

const checkLocales = (locales) => {
  const langs = Object.keys(locales);
  const flat = Object.fromEntries(langs.map((l) => [l, flatten(locales[l])]));

  const refKeys = new Set(Object.keys(flat[referenceLang]));

  for (const lang of langs) {
    if (lang === referenceLang) continue;
    const keys = new Set(Object.keys(flat[lang]));

    // Missing keys
    for (const k of refKeys) {
      if (!keys.has(k)) {
        console.error(`[${lang}] Missing key: ${k}`);
        process.exit(1);
      }
    }

    // Extra keys
    for (const k of keys) {
      if (!refKeys.has(k)) {
        console.warn(`[${lang}] Extra key: ${k}`);
        process.exit(1);
      }
    }
  }
};

for (const project of projects) {
  console.log(`\n🔍 Checking ${project.name} (${project.dir})`);
  const locales = loadLocales(project.dir);
  checkLocales(locales);
}
